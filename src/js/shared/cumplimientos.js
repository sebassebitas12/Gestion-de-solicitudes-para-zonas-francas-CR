// ==========================================
// ZoFranca CR / PROCOMER - CUMPLIMIENTOS
// Motor global de cumplimiento de la empresa.
//
// Calcula el estado de cumplimiento a partir
// de los datos ya disponibles en frontend:
//   - Documentos (catálogo + subidos)
//   - Trámites derivados de solicitudes
//
// NO inventa endpoints: cuando exista backend
// de cumplimientos bastará reemplazar la
// fuente de datos dentro de este módulo.
//
// API pública:
//   calcularCumplimientos(empresaId)  -> Promise<resumen>
//   calcularResumenEmpresas(ids[])    -> Promise<{resumen, detalle[]}>
//   renderizarPanelCumplimiento(contenedor, resumen, opciones)
//   renderizarResumenEmpresas(contenedor, detalle[])
// ==========================================

import {
    getSolicitudes,
    getDocumentos,
    derivarTramites,
    formatearFecha
} from '../empresa/empresa-data.js';

import { fetchAPI } from '../../services/api.js';


// ------------------------------------------
// Definición de estados (icono + color +
// texto: nunca solo color).
// ------------------------------------------

export const ESTADOS_CUMPLIMIENTO = {

    cumplido: {
        texto: 'Cumplido',
        icono: 'check_circle',
        color: '#1e8e3e',
        fondo: '#e8f5ec'
    },

    pendiente: {
        texto: 'Pendiente',
        icono: 'schedule',
        color: '#8a6d00',
        fondo: '#fdf6dd'
    },

    proximo: {
        texto: 'Próximo a vencer',
        icono: 'hourglass_top',
        color: '#b45309',
        fondo: '#fdf0d7'
    },

    vencido: {
        texto: 'Vencido',
        icono: 'error',
        color: '#ba1a1a',
        fondo: '#fdeaea'
    }
};


const DIAS_PROXIMO_VENCER = 30;


// ------------------------------------------
// Cálculo del estado de un documento según
// su vencimiento efectivo (misma regla que
// usa el panel de Documentos).
// ------------------------------------------

function estadoDocumento(documento) {

    const declarado =
        String(documento.estado || '')
            .toLowerCase();

    if (declarado === 'en revisión' || declarado === 'en revision') {
        return 'pendiente';
    }

    if (!documento.vencimiento) {
        return 'cumplido';
    }

    const hoy = new Date();

    const vence =
        new Date(documento.vencimiento);

    const dias =
        Math.ceil(
            (vence - hoy) / (1000 * 60 * 60 * 24)
        );

    if (dias < 0) {
        return 'vencido';
    }

    if (dias <= DIAS_PROXIMO_VENCER) {
        return 'proximo';
    }

    return 'cumplido';
}


function accionDocumento(item) {

    if (item.estado === 'vencido') {
        return 'Acción urgente: renueve o subsane este documento.';
    }

    if (item.estado === 'proximo') {
        return `Programe la renovación antes del ${formatearFecha(item.vence)}.`;
    }

    if (item.estado === 'pendiente') {
        return 'Complete los requisitos solicitados y espere la revisión.';
    }

    return 'Sin acciones requeridas.';
}


function accionTramite(item) {

    if (item.estado === 'pendiente') {
        return 'Inicie o dé seguimiento al trámite asociado a la solicitud.';
    }

    return 'Continúe con el proceso hasta su finalización.';
}


// ------------------------------------------
// Resumen de cumplimiento de UNA empresa.
// ------------------------------------------

export async function calcularCumplimientos(empresaId) {


    const solicitudes =
        await getSolicitudes(empresaId);

    const documentos =
        await getDocumentos(empresaId);

    const tramites =
        derivarTramites(solicitudes);


    const items = [];


    (documentos || []).forEach(doc => {

        const estado =
            estadoDocumento(doc);

        items.push({
            id: doc.id,
            nombre: doc.nombre,
            categoria: 'Documento',
            estado,
            detalle:
                doc.vencimiento
                    ? `Vence el ${formatearFecha(doc.vencimiento)}`
                    : 'Sin fecha de vencimiento',
            vence: doc.vencimiento,
            accion: accionDocumento({ estado, vence: doc.vencimiento })
        });

    });


    (tramites || []).forEach(tra => {

        const finalizado =
            tra.estado === 'Finalizado' ||
            tra.estado === 'Completado';

        items.push({
            id: tra.id,
            nombre: tra.nombre,
            categoria: 'Trámite',
            estado: finalizado ? 'cumplido' : 'pendiente',
            detalle:
                `Solicitud ${tra.solicitudId} · ${tra.progreso}% completado`,
            accion: accionTramite({ estado: finalizado ? 'cumplido' : 'pendiente' })
        });

    });


    const conteos = {
        cumplidos: 0,
        pendientes: 0,
        proximos: 0,
        vencidos: 0
    };

    items.forEach(item => {

        if (item.estado === 'cumplido') conteos.cumplidos++;
        else if (item.estado === 'pendiente') conteos.pendientes++;
        else if (item.estado === 'proximo') conteos.proximos++;
        else if (item.estado === 'vencido') conteos.vencidos++;

    });


    const total = items.length;

    const porcentaje =
        total === 0
            ? 100
            : Math.round((conteos.cumplidos / total) * 100);


    let estadoGeneral = 'En cumplimiento';

    let claveGeneral = 'cumplido';

    if (conteos.vencidos > 0 || porcentaje < 50) {
        estadoGeneral = 'Requiere acción urgente';
        claveGeneral = 'vencido';
    } else if (porcentaje < 80) {
        estadoGeneral = 'Con pendientes';
        claveGeneral = 'pendiente';
    } else if (conteos.proximos > 0) {
        estadoGeneral = 'Atención preventiva';
        claveGeneral = 'proximo';
    }


    return {
        empresaId,
        total,
        porcentaje,
        estadoGeneral,
        claveGeneral,
        conteos,
        items
    };
}


// ------------------------------------------
// Resumen multi-empresa (Gerente, Analista,
// Administrador). Usa el endpoint real de
// empresas; el cálculo es el mismo motor.
// ------------------------------------------

export async function calcularResumenEmpresas() {

    const empresas =
        await fetchAPI('/empresas');

    const lista = Array.isArray(empresas)
        ? empresas
        : [];

    const detalles = [];

    for (const empresa of lista) {

        const resumen =
            await calcularCumplimientos(empresa.id);

        detalles.push({
            id: empresa.id,
            nombre:
                empresa.nombre ||
                empresa.razonSocial ||
                empresa.id,
            ...resumen
        });
    }


    const totalEmpresas = detalles.length;

    const promedio =
        totalEmpresas === 0
            ? 100
            : Math.round(
                detalles.reduce(
                    (suma, item) => suma + item.porcentaje,
                    0
                ) / totalEmpresas
            );


    const agregado = {
        promedio,
        totalEmpresas,
        enCumplimiento:
            detalles.filter(d => d.claveGeneral === 'cumplido').length,
        conPendientes:
            detalles.filter(d =>
                d.conteos.pendientes > 0 ||
                d.conteos.proximos > 0
            ).length,
        conVencimientosProximos:
            detalles.filter(d => d.conteos.proximos > 0).length,
        conVencidos:
            detalles.filter(d => d.conteos.vencidos > 0).length
    };


    return { agregado, detalles };
}


// ------------------------------------------
// ESTILOS COMPARTIDOS (inyección única).
// Misma identidad visual en todos los roles.
// ------------------------------------------

const ESTILOS_COMP = `

.zof-comp-panel {

    background: #ffffff;

    border: 1px solid #e3e7eb;

    border-radius: 16px;

    box-shadow: 0 10px 30px rgba(19, 27, 46, 0.08);

    padding: 22px 24px;

    font-family: "Hanken Grotesk", sans-serif;
}


.zof-comp-header {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 12px;

    flex-wrap: wrap;

    margin-bottom: 14px;
}


.zof-comp-titulo-grupo {

    display: flex;

    align-items: center;

    gap: 11px;
}


.zof-comp-icono-titulo {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    width: 38px;

    height: 38px;

    border-radius: 12px;

    background: linear-gradient(135deg, #131b2e, #1d2942);

    color: #ffffff;

    box-shadow: 0 4px 10px rgba(19, 27, 46, 0.25);
}


.zof-comp-icono-titulo .material-symbols-outlined {

    font-size: 20px;
}


.zof-comp-titulo {

    margin: 0;

    font-size: 15.5px;

    font-weight: 800;

    color: #131b2e;
}


.zof-comp-subtitulo {

    margin: 2px 0 0;

    font-size: 12px;

    font-weight: 600;

    color: #55606c;
}


.zof-comp-badge {

    display: inline-flex;

    align-items: center;

    gap: 6px;

    padding: 5px 11px;

    border-radius: 999px;

    font-size: 12px;

    font-weight: 800;
}


.zof-comp-badge .material-symbols-outlined {

    font-size: 15px;
}


.zof-comp-principal {

    display: flex;

    align-items: center;

    gap: 18px;

    flex-wrap: wrap;

    margin-bottom: 16px;
}


.zof-comp-anillo {

    position: relative;

    width: 128px;

    height: 128px;

    flex-shrink: 0;
}


.zof-comp-anillo svg {

    width: 100%;

    height: 100%;

    transform: rotate(-90deg);
}


.zof-comp-anillo circle {

    fill: none;

    stroke-width: 11;

    stroke-linecap: round;
}


.zof-comp-anillo .zof-anillo-fondo {

    stroke: #edf0f3;
}


.zof-comp-anillo .zof-anillo-valor {

    transition:
        stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}


.zof-comp-anillo-centro {

    position: absolute;

    inset: 0;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;
}


.zof-comp-anillo-centro strong {

    font-size: 31px;

    font-weight: 800;

    letter-spacing: -0.02em;

    line-height: 1;

    color: #131b2e;
}


.zof-comp-anillo-centro small {

    margin-top: 2px;

    font-size: 12.5px;

    font-weight: 700;

    color: #55606c;
}


.zof-comp-resumen-lado {

    flex: 1;

    min-width: 210px;

    display: flex;

    flex-direction: column;

    gap: 7px;
}


.zof-comp-estado-texto {

    display: flex;

    align-items: center;

    gap: 8px;

    font-size: 17px;

    font-weight: 800;

    color: #131b2e;
}


.zof-comp-total-caption {

    font-size: 12.5px;

    font-weight: 600;

    color: #55606c;
}


.zof-comp-stats {

    display: grid;

    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));

    gap: 10px;
}


.zof-comp-stat {

    position: relative;

    overflow: hidden;

    display: flex;

    align-items: center;

    gap: 10px;

    padding: 12px 14px;

    border-radius: 12px;

    border: 1px solid #edf0f3;

    background: #fafbfc;

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}


.zof-comp-stat::before {

    content: '';

    position: absolute;

    left: 0;
    top: 0;
    bottom: 0;

    width: 3px;

    background: var(--zof-acento, transparent);
}


.zof-comp-stat:hover {

    transform: translateY(-2px);

    border-color: var(--zof-acento, #edf0f3);

    box-shadow: 0 8px 18px rgba(19, 27, 46, 0.09);
}


.zof-comp-stat .material-symbols-outlined {

    font-size: 19px;
}


.zof-comp-stat strong {

    display: block;

    font-size: 17px;

    line-height: 1.1;

    color: #131b2e;
}


.zof-comp-stat small {

    font-size: 11.5px;

    font-weight: 700;

    color: #55606c;
}


/* Lista detallada */

.zof-comp-lista {

    margin-top: 14px;

    display: flex;

    flex-direction: column;

    gap: 8px;
}


.zof-comp-item {

    position: relative;

    overflow: hidden;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 12px;

    padding: 12px 14px;

    padding-left: 17px;

    border-radius: 12px;

    border: 1px solid #edf0f3;

    background: #ffffff;

    flex-wrap: wrap;

    animation:
        zof-comp-entrada 0.4s ease both;

    transition:
        box-shadow 0.2s ease,
        transform 0.2s ease,
        border-color 0.2s ease;
}


.zof-comp-item::before {

    content: '';

    position: absolute;

    left: 0;
    top: 0;
    bottom: 0;

    width: 4px;

    background: var(--zof-acento, #c9d1d9);
}


.zof-comp-item:hover {

    transform: translateY(-1px);

    border-color: var(--zof-acento, #edf0f3);

    box-shadow: 0 8px 20px rgba(19, 27, 46, 0.10);
}


.zof-comp-item-icono {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    width: 34px;

    height: 34px;

    border-radius: 10px;

    background: #f2f4f6;

    color: #45464d;

    flex-shrink: 0;
}


.zof-comp-item-icono .material-symbols-outlined {

    font-size: 18px;
}


.zof-comp-item-accion {

    display: flex;

    align-items: center;

    gap: 5px;
}


@keyframes zof-comp-entrada {

    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}


.zof-comp-item-info {

    flex: 1;

    min-width: 170px;
}


.zof-comp-item-nombre {

    font-size: 13px;

    font-weight: 700;

    color: #131b2e;
}


.zof-comp-item-meta {

    font-size: 12px;

    color: #55606c;

    margin-top: 2px;
}


.zof-comp-item-accion {

    font-size: 12px;

    color: #33404e;

    margin-top: 3px;
}


/* Multi-empresa */

.zof-comp-multi {

    display: flex;

    flex-direction: column;

    gap: 9px;

    margin-top: 4px;
}


.zof-comp-fila {

    display: grid;

    grid-template-columns: minmax(120px, 1.2fr) 2fr auto auto;

    align-items: center;

    gap: 12px;

    padding: 9px 12px;

    border-radius: 10px;

    border: 1px solid #edf0f3;

    background: #fafbfc;
}


.zof-comp-fila-nombre {

    font-size: 13px;

    font-weight: 800;

    color: #131b2e;

    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;
}


.zof-comp-fila-barra {

    height: 8px;

    border-radius: 999px;

    background: #edf0f3;

    overflow: hidden;
}


.zof-comp-fila-barra span {

    display: block;

    height: 100%;

    border-radius: 999px;

    background: linear-gradient(90deg, #085ac0, #1e8e3e);
}


.zof-comp-fila-pct {

    font-size: 13px;

    font-weight: 800;

    color: #131b2e;

    min-width: 42px;

    text-align: right;
}


.zof-comp-fila-badge {

    justify-self: end;
}


@media (max-width: 720px) {

    .zof-comp-panel {

        padding: 18px 16px;
    }

    .zof-comp-anillo {

        width: 104px;

        height: 104px;
    }

    .zof-comp-anillo-centro strong {

        font-size: 25px;
    }

    .zof-comp-stats {

        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .zof-comp-fila {

        grid-template-columns: 1fr auto;

        row-gap: 6px;
    }

    .zof-comp-fila-barra {

        grid-column: 1 / -1;
    }
}

`;


let estilosInyectados = false;


function asegurarEstilos() {

    if (estilosInyectados && document.getElementById('zofranca-comp-styles')) {
        return;
    }

    if (
        !document.getElementById('zofranca-comp-styles')
    ) {

        const estilo =
            document.createElement('style');

        estilo.id = 'zofranca-comp-styles';

        estilo.textContent = ESTILOS_COMP;

        document.head.appendChild(estilo);
    }

    estilosInyectados = true;
}


function badgeEstado(clave) {

    const def =
        ESTADOS_CUMPLIMIENTO[clave] ||
        ESTADOS_CUMPLIMIENTO.cumplido;

    return `
        <span
            class="zof-comp-badge"
            style="background:${def.fondo};color:${def.color};"
        >
            <span class="material-symbols-outlined" aria-hidden="true">${def.icono}</span>
            ${def.texto}
        </span>
    `;
}


function escapar(texto) {

    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}


// ------------------------------------------
// RENDER: panel de una empresa.
// opciones: { titulo, mostrarLista, maxItems, accionesHtml }
// ------------------------------------------

// Anillo SVG de porcentaje (reutilizable).
function anilloHtml(porcentaje, color, ariaLabel) {

    const radio = 52;

    const circunferencia =
        (2 * Math.PI * radio).toFixed(1);

    const avance =
        (circunferencia *
            (1 - porcentaje / 100)).toFixed(1);

    return `
        <div
            class="zof-comp-anillo"
            role="img"
            aria-label="${ariaLabel}"
        >
            <svg viewBox="0 0 128 128" aria-hidden="true">
                <circle
                    class="zof-anillo-fondo"
                    cx="64"
                    cy="64"
                    r="${radio}"
                ></circle>
                <circle
                    class="zof-anillo-valor"
                    cx="64"
                    cy="64"
                    r="${radio}"
                    stroke="${color}"
                    stroke-dasharray="${circunferencia}"
                    stroke-dashoffset="${avance}"
                ></circle>
            </svg>
            <div class="zof-comp-anillo-centro">
                <strong>${porcentaje}%</strong>
                <small>global</small>
            </div>
        </div>
    `;
}


// ------------------------------------------
// RENDER: una fila de cumplimiento (compartida
// por el panel y la página dedicada de Empresa).
// indice: posición para la animación escalonada.
// ------------------------------------------

const ICONOS_CATEGORIA = {
    'Documento': 'description',
    'Trámite': 'account_tree',
    'Solicitud': 'assignment'
};


export function renderizarItemCumplimiento(item, indice = 0) {

    asegurarEstilos();

    const def =
        ESTADOS_CUMPLIMIENTO[item.estado];

    const iconoCat =
        ICONOS_CATEGORIA[item.categoria] ||
        'task_alt';

    return `
        <div
            class="zof-comp-item"
            style="--zof-acento:${def.color};animation-delay:${Math.min(indice * 45, 400)}ms;"
        >
            <span class="zof-comp-item-icono" aria-hidden="true">
                <span class="material-symbols-outlined">${iconoCat}</span>
            </span>
            <div class="zof-comp-item-info">
                <div class="zof-comp-item-nombre">
                    ${escapar(item.nombre)}
                </div>
                <div class="zof-comp-item-meta">
                    ${escapar(item.categoria)} · ${escapar(item.detalle)}
                </div>
                ${item.estado !== 'cumplido'
                    ? `<div class="zof-comp-item-accion">
                        <span class="material-symbols-outlined" aria-hidden="true">lightbulb</span>
                        ${escapar(item.accion)}
                       </div>`
                    : ''}
            </div>
            <span
                class="zof-comp-badge"
                style="background:${def.fondo};color:${def.color};"
            >
                <span class="material-symbols-outlined" aria-hidden="true">${def.icono}</span>
                ${def.texto}
            </span>
        </div>
    `;
}


export function renderizarPanelCumplimiento(resumen, opciones = {}) {

    asegurarEstilos();

    const panel =
        document.createElement('div');

    panel.className = 'zof-comp-panel';


    const generalDef =
        ESTADOS_CUMPLIMIENTO[resumen.claveGeneral] ||
        ESTADOS_CUMPLIMIENTO.cumplido;


    const stats = [
        ['cumplidos', 'Cumplidos'],
        ['pendientes', 'Pendientes'],
        ['proximos', 'Próximos a vencer'],
        ['vencidos', 'Vencidos']
    ].map(([clave, etiqueta]) => {

        const def =
            ESTADOS_CUMPLIMIENTO[
                clave === 'cumplidos'
                    ? 'cumplido'
                    : clave === 'pendientes'
                        ? 'pendiente'
                        : clave === 'proximos'
                            ? 'proximo'
                            : 'vencido'
            ];

        return `
            <div class="zof-comp-stat">
                <span class="material-symbols-outlined" style="color:${def.color};" aria-hidden="true">${def.icono}</span>
                <div>
                    <strong>${resumen.conteos[clave]}</strong>
                    <small>${etiqueta}</small>
                </div>
            </div>
        `;

    }).join('');


    let listaHtml = '';

    if (opciones.mostrarLista) {

        const orden = {
            vencido: 0,
            proximo: 1,
            pendiente: 2,
            cumplido: 3
        };

        const items = [...resumen.items]
            .sort((a, b) => orden[a.estado] - orden[b.estado])
            .slice(0, opciones.maxItems || resumen.items.length);


        listaHtml = `
            <div class="zof-comp-lista">
                ${items.map((item, i) =>
                    renderizarItemCumplimiento(item, i)
                ).join('')}
            </div>
        `;
    }


    panel.innerHTML = `
        <div class="zof-comp-header">
            <div class="zof-comp-titulo-grupo">
                <span class="zof-comp-icono-titulo" aria-hidden="true">
                    <span class="material-symbols-outlined">verified_user</span>
                </span>
                <div>
                    <h3 class="zof-comp-titulo">
                        ${escapar(opciones.titulo || 'Cumplimiento de la empresa')}
                    </h3>
                    <p class="zof-comp-subtitulo">
                        ${resumen.items.length} obligaciones evaluadas
                        · actualizado hoy
                    </p>
                </div>
            </div>
            ${badgeEstado(resumen.claveGeneral === 'cumplido' && resumen.porcentaje < 100 ? 'pendiente' : resumen.claveGeneral)}
        </div>

        <div class="zof-comp-principal">
            ${anilloHtml(
                resumen.porcentaje,
                generalDef.color,
                `Cumplimiento general: ${resumen.porcentaje} por ciento. Estado: ${escapar(resumen.estadoGeneral)}`
            )}
            <div class="zof-comp-resumen-lado">
                <div class="zof-comp-estado-texto">
                    <span
                        class="material-symbols-outlined"
                        style="color:${generalDef.color};"
                        aria-hidden="true"
                    >${generalDef.icono}</span>
                    ${escapar(resumen.estadoGeneral)}
                </div>
                <p class="zof-comp-total-caption">
                    ${resumen.conteos.cumplidos} de ${resumen.items.length} obligaciones cumplidas.
                </p>
            </div>
        </div>

        <div class="zof-comp-stats">
            ${stats}
        </div>

        ${listaHtml}

        ${opciones.accionesHtml || ''}
    `;

    return panel;
}


// ------------------------------------------
// RENDER: resumen multi-empresa.
// opciones: { titulo }
// ------------------------------------------

export function renderizarResumenEmpresas(agregado, detalles, opciones = {}) {

    asegurarEstilos();

    const panel =
        document.createElement('div');

    panel.className = 'zof-comp-panel';


    const filas = detalles
        .slice()
        .sort((a, b) => a.porcentaje - b.porcentaje)
        .map(item => `

            <div class="zof-comp-fila">

                <span
                    class="zof-comp-fila-nombre"
                    title="${escapar(item.nombre)}"
                >
                    ${escapar(item.nombre)}
                </span>

                <div
                    class="zof-comp-fila-barra"
                    role="progressbar"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow="${item.porcentaje}"
                    aria-label="Cumplimiento de ${escapar(item.nombre)}"
                >
                    <span style="width:${item.porcentaje}%"></span>
                </div>

                <span class="zof-comp-fila-pct">${item.porcentaje}%</span>

                <span class="zof-comp-fila-badge">
                    ${badgeEstado(item.claveGeneral)}
                </span>

            </div>

        `).join('');


    panel.innerHTML = `
        <div class="zof-comp-header">
            <div class="zof-comp-titulo-grupo">
                <span class="zof-comp-icono-titulo" aria-hidden="true">
                    <span class="material-symbols-outlined">verified_user</span>
                </span>
                <div>
                    <h3 class="zof-comp-titulo">
                        ${escapar(opciones.titulo || 'Cumplimiento de empresas')}
                    </h3>
                    <p class="zof-comp-subtitulo">
                        ${detalles.length} empresas evaluadas
                        · actualizado hoy
                    </p>
                </div>
            </div>
            ${badgeEstado(agregado.promedio >= 80 ? 'cumplido' : agregado.promedio >= 50 ? 'pendiente' : 'vencido')}
        </div>

        <div class="zof-comp-principal">
            ${anilloHtml(
                agregado.promedio,
                ESTADOS_CUMPLIMIENTO[agregado.promedio >= 80 ? 'cumplido' : agregado.promedio >= 50 ? 'pendiente' : 'vencido'].color,
                `Cumplimiento promedio: ${agregado.promedio} por ciento`
            )}
            <div class="zof-comp-stats" style="flex:1;">
                <div class="zof-comp-stat">
                    <span class="material-symbols-outlined" style="color:${ESTADOS_CUMPLIMIENTO.cumplido.color};" aria-hidden="true">domain</span>
                    <div>
                        <strong>${agregado.enCumplimiento}</strong>
                        <small>En cumplimiento</small>
                    </div>
                </div>
                <div class="zof-comp-stat">
                    <span class="material-symbols-outlined" style="color:${ESTADOS_CUMPLIMIENTO.pendiente.color};" aria-hidden="true">pending_actions</span>
                    <div>
                        <strong>${agregado.conPendientes}</strong>
                        <small>Con pendientes</small>
                    </div>
                </div>
                <div class="zof-comp-stat">
                    <span class="material-symbols-outlined" style="color:${ESTADOS_CUMPLIMIENTO.proximo.color};" aria-hidden="true">hourglass_top</span>
                    <div>
                        <strong>${agregado.conVencimientosProximos}</strong>
                        <small>Próximos a vencer</small>
                    </div>
                </div>
                <div class="zof-comp-stat">
                    <span class="material-symbols-outlined" style="color:${ESTADOS_CUMPLIMIENTO.vencido.color};" aria-hidden="true">error</span>
                    <div>
                        <strong>${agregado.conVencidos}</strong>
                        <small>Con vencidos</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="zof-comp-multi">
            ${filas}
        </div>
    `;

    return panel;
}
