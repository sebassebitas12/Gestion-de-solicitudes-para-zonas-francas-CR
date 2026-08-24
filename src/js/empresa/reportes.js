// ==========================================
// ZoFranca CR - PANEL DE REPORTES
// (Módulo Empresa)
// ==========================================

import {
    getSolicitudes,
    getAlertasEmpresa,
    escaparHTML,
    formatearFecha
} from './empresa-data.js';

import {
    protegerPanelEmpresa,
    iniciarPanelBase
} from './panel-base.js';


let sesionActual = null;

let todasSolicitudes = [];

let todasAlertas = [];

let reportesGenerados = [];


const MESES_VISIBLES = 6;

const COLORES_ESTADO = {
    pendiente: 'amber',
    en_revision: '',
    aprobada: 'green',
    completada: 'green',
    rechazada: 'red'
};

const ETIQUETAS_ESTADO = {
    pendiente: 'Pendiente',
    en_revision: 'En revisión',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    completada: 'Completada'
};


// ==========================================
// INICIO
// ==========================================

async function iniciarPanel() {

    sesionActual = protegerPanelEmpresa();

    iniciarPanelBase(sesionActual);

    renderizarIdentidad();

    configurarEventos();

    await cargarDatos();

    aplicarFiltros();
}


function renderizarIdentidad() {

    const nombre =
        sesionActual.nombre || 'Empresa';

    const iniciales = nombre
        .split(' ')
        .map(palabra => palabra.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();


    const avatarSidebar =
        document.getElementById('avatarEmpresaSidebar');

    const avatarTop =
        document.getElementById('avatarEmpresaTop');

    const nombreElemento =
        document.getElementById('nombreEmpresa');

    if (avatarSidebar) {
        avatarSidebar.textContent = iniciales;
    }

    if (avatarTop) {
        avatarTop.textContent = iniciales;
    }

    if (nombreElemento) {
        nombreElemento.textContent = nombre;
    }
}


function configurarEventos() {

    document
        .getElementById('btnAplicarFiltros')
        ?.addEventListener('click', () => {

            aplicarFiltros();
        });

    document
        .getElementById('btnGenerarReporte')
        ?.addEventListener('click', generarReporte);

    document
        .getElementById('btnImprimir')
        ?.addEventListener('click', () => window.print());
}


async function cargarDatos() {

    [todasSolicitudes, todasAlertas] =
        await Promise.all([
            getSolicitudes(sesionActual.empresaId),
            getAlertasEmpresa(sesionActual.empresaId)
        ]);
}


// ==========================================
// FILTRADO
// ==========================================

function normalizarEstado(solicitud) {

    return String(solicitud.estado || '')
        .toLowerCase()
        .replace(/\s+/g, '_');
}


function filtrarSolicitudes() {

    const periodo =
        document.getElementById('filtroPeriodo')?.value
        || 'todo';

    const estado =
        document.getElementById('filtroEstado')?.value
        || '';

    const limiteMilisegundos =
        calcularLimitePeriodo(periodo);


    return todasSolicitudes.filter(solicitud => {

        const dentroDePeriodo =

            !limiteMilisegundos ||
            new Date(solicitud.fecha || 0).getTime()
                >= limiteMilisegundos;


        const coincideEstado =

            !estado ||
            normalizarEstado(solicitud) === estado;

        return dentroDePeriodo && coincideEstado;
    });
}


function calcularLimitePeriodo(periodo) {

    if (periodo === 'todo') {
        return null;
    }

    const meses =
        periodo === '6m' ? 6 : 12;

    const limite =
        new Date();

    limite.setMonth(limite.getMonth() - meses);

    return limite.getTime();
}


function descripcionPeriodo() {

    const periodo =
        document.getElementById('filtroPeriodo')?.value
        || 'todo';

    if (periodo === '6m') return 'Últimos 6 meses';

    if (periodo === '12m') return 'Último año';

    return 'Histórico completo';
}


function descripcionTipo() {

    const tipo =
        document.getElementById('filtroTipo')?.value
        || 'general';

    if (tipo === 'solicitudes') return 'Solicitudes';

    if (tipo === 'cumplimiento') return 'Cumplimiento';

    return 'Resumen general';
}


// ==========================================
// KPIS Y GRÁFICOS
// ==========================================

function aplicarFiltros() {

    const filtradas =
        filtrarSolicitudes();


    actualizarElemento(
        'kpiSolicitudes',
        filtradas.length
    );


    const conAprobacion =
        filtradas.filter(
            solicitud =>
                normalizarEstado(solicitud) === 'aprobada' ||
                normalizarEstado(solicitud) === 'completada'
        ).length;

    const tasa =
        filtradas.length > 0
            ? Math.round((conAprobacion / filtradas.length) * 100)
            : 0;

    actualizarElemento(
        'kpiTasaAprobacion',
        `${tasa}%`
    );


    const alertasActivas =
        todasAlertas.filter(
            alerta =>
                String(alerta.estado || '')
                    .toLowerCase() !== 'resuelta'
        ).length;

    actualizarElemento(
        'kpiAlertas',
        alertasActivas
    );


    const porcentajes =
        todasAlertas
            .map(alerta =>
                Number(alerta.porcentajeCumplimiento)
            )
            .filter(valor =>
                Number.isFinite(valor)
            );

    const cumplimientoPromedio =
        porcentajes.length > 0
            ? Math.round(
                porcentajes.reduce((suma, valor) => suma + valor, 0) /
                porcentajes.length
              )
            : 0;

    actualizarElemento(
        'kpiCumplimiento',
        `${cumplimientoPromedio}%`
    );


    renderizarGraficoMensual(filtradas);

    renderizarDistribucion(filtradas);
}


function actualizarElemento(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = String(valor);
    }
}


function renderizarGraficoMensual(solicitudes) {

    const contenedor =
        document.getElementById('graficoMensual');

    if (!contenedor) {
        return;
    }


    const hoy =
        new Date();

    const meses = [];

    for (let desplazo = MESES_VISIBLES - 1; desplazo >= 0; desplazo--) {

        const mes =
            new Date(
                hoy.getFullYear(),
                hoy.getMonth() - desplazo,
                1
            );

        meses.push({
            clave:
                `${mes.getFullYear()}-${mes.getMonth()}`,
            etiqueta:
                mes.toLocaleDateString('es-CR', { month: 'short' }),
            cantidad: 0
        });
    }


    solicitudes.forEach(solicitud => {

        const fecha =
            new Date(solicitud.fecha || 0);

        const clave =
            `${fecha.getFullYear()}-${fecha.getMonth()}`;

        const mes =
            meses.find(item => item.clave === clave);

        if (mes) {
            mes.cantidad += 1;
        }
    });


    const maximo =
        Math.max(
            1,
            ...meses.map(mes => mes.cantidad)
        );


    contenedor.innerHTML = meses.map(mes => `

        <div class="bar-col">

            <span class="bar-value">${mes.cantidad}</span>

            <div
                class="bar-shape"
                style="height: ${Math.round((mes.cantidad / maximo) * 130)}px;"
                title="${mes.cantidad} solicitud(es)"
            ></div>

            <span class="bar-label">${escaparHTML(mes.etiqueta)}</span>

        </div>

    `).join('');
}


function renderizarDistribucion(solicitudes) {

    const contenedor =
        document.getElementById('distribucionEstados');

    if (!contenedor) {
        return;
    }


    const conteos = {};

    Object.keys(ETIQUETAS_ESTADO).forEach(clave => {
        conteos[clave] = 0;
    });

    solicitudes.forEach(solicitud => {

        const estado =
            normalizarEstado(solicitud);

        if (estado in conteos) {
            conteos[estado] += 1;
        }
    });


    const total =
        Math.max(1, solicitudes.length);


    const filas =
        Object.entries(conteos)
            .filter(([, cantidad]) => cantidad > 0)
            .map(([estado, cantidad]) => {

                const porcentaje =
                    Math.round((cantidad / total) * 100);

                const color =
                    COLORES_ESTADO[estado] || '';

                return `

                    <div>

                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <strong style="font-size:13px;">
                                ${ETIQUETAS_ESTADO[estado]}
                            </strong>
                            <span class="progress-value">${cantidad} · ${porcentaje}%</span>
                        </div>

                        <div class="progress-track">
                            <div
                                class="progress-fill ${color}"
                                style="width:${porcentaje}%"
                            ></div>
                        </div>

                    </div>

                `;
            });

    contenedor.innerHTML =

        filas.length > 0

            ? filas.join('')

            : `
                <div class="empty-state">
                    <p>Sin datos para el periodo seleccionado.</p>
                </div>
              `;
}


// ==========================================
// GENERACIÓN DE REPORTES
// ==========================================

function generarReporte() {

    const filtradas =
        filtrarSolicitudes();

    if (filtradas.length === 0) {

        alert(
            'No hay solicitudes que coincidan con los filtros aplicados.'
        );

        return;
    }


    const reporte = {
        id:
            `REP-${Date.now().toString().slice(-6)}`,
        nombre:
            `${descripcionTipo()} — ${descripcionPeriodo()}`,
        tipo:
            descripcionTipo(),
        periodo:
            descripcionPeriodo(),
        cantidadSolicitudes:
            filtradas.length,
        fecha:
            new Date().toISOString(),
        datos:
            filtradas
    };


    reportesGenerados.unshift(reporte);

    renderizarTablaReportes();

    descargarReporte(reporte.id);
}


function construirCSV(reporte) {

    const encabezados = [
        'ID',
        'Sector',
        'Pais',
        'Fecha',
        'Inversion',
        'Empleos',
        'Puntaje IA',
        'Clasificacion IA',
        'Estado'
    ];


    const filas =
        reporte.datos.map(solicitud => [

            solicitud.id,
            solicitud.sector,
            solicitud.pais,
            formatearFecha(solicitud.fecha),
            solicitud.inversion,
            solicitud.empleos,
            solicitud.puntajeIA,
            solicitud.clasificacionIA,
            solicitud.estado

        ].map(campo => `"${String(campo ?? '')}"`).join(','));


    return [
        `ZoFranca CR - Reporte: ${reporte.nombre}`,
        `Empresa: ${sesionActual.nombre || ''} (${sesionActual.empresaId})`,
        `Generado: ${formatearFecha(reporte.fecha)}`,
        '',
        encabezados.join(','),
        ...filas
    ].join('\n');
}


function descargarReporte(reporteId) {

    const reporte =
        reportesGenerados.find(item => item.id === reporteId);

    if (!reporte) {
        return;
    }

    const blob =
        new Blob([construirCSV(reporte)], {
            type: 'text/csv;charset=utf-8'
        });

    const url =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement('a');

    enlace.href = url;

    enlace.download =
        `${reporte.id}.csv`;

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    URL.revokeObjectURL(url);
}


function renderizarTablaReportes() {

    const tbody =
        document.getElementById('tablaReportes');

    if (!tbody) {
        return;
    }

    if (reportesGenerados.length === 0) {
        return;
    }


    tbody.innerHTML = reportesGenerados.map(reporte => `

        <tr data-reporte="${reporte.id}">

            <td><strong>${escaparHTML(reporte.nombre)}</strong></td>

            <td>${escaparHTML(reporte.tipo)}</td>

            <td>${escaparHTML(reporte.periodo)}</td>

            <td>${reporte.cantidadSolicitudes}</td>

            <td>${formatearFecha(reporte.fecha)}</td>

            <td>
                <button
                    class="text-button"
                    data-descargar="${reporte.id}"
                >
                    Descargar CSV
                </button>
            </td>

        </tr>

    `).join('');


    tbody.querySelectorAll('[data-descargar]')
        .forEach(boton => {

            boton.addEventListener(
                'click',
                () => descargarReporte(boton.dataset.descargar)
            );
        });
}


iniciarPanel();
