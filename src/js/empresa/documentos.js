// ==========================================
// Procomer - PANEL DE DOCUMENTOS
// (Módulo Empresa)
// ==========================================

import {
    getDocumentos,
    agregarDocumento,
    eliminarDocumento,
    descargarDocumento,
    getIconoTipo,
    clasificarTipoNombre,
    escaparHTML,
    formatearFecha
} from './empresa-data.js';

import {
    protegerPanelEmpresa,
    iniciarPanelBase
} from './panel-base.js';

import {
    showNotification,
    mostrarConfirmacion
} from '../shared/ui.js';


let sesionActual = null;

let todosDocumentos = [];


const DIAS_POR_VENCER = 30;


// ==========================================
// INICIO
// ==========================================

async function iniciarPanel() {

    sesionActual = protegerPanelEmpresa();

    iniciarPanelBase(sesionActual);

    renderizarIdentidad();

    configurarEventos();

    await cargarDatos();
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
        .getElementById('inputBusqueda')
        ?.addEventListener('input', renderizarDocumentos);

    document
        .getElementById('filtroTipo')
        ?.addEventListener('change', renderizarDocumentos);

    document
        .getElementById('filtroEstado')
        ?.addEventListener('change', renderizarDocumentos);


    const btnSubir =
        document.getElementById('btnSubirDocumento');

    const inputArchivo =
        document.getElementById('inputArchivo');

    btnSubir?.addEventListener(
        'click',
        () => inputArchivo?.click()
    );

    inputArchivo?.addEventListener(
        'change',
        subirArchivo
    );


    document.querySelectorAll('[data-cerrar-modal]')
        .forEach(elemento => {

            elemento.addEventListener(
                'click',
                cerrarModal
            );
        });

    document.addEventListener(
        'keydown',
        evento => {

            if (evento.key === 'Escape') {
                cerrarModal();
            }
        }
    );
}


async function cargarDatos() {

    todosDocumentos =
        await getDocumentos(sesionActual.empresaId);

    llenarSelectorTipos();

    actualizarResumen();

    renderizarDocumentos();
}


// ==========================================
// SELECTOR DE TIPOS
// ==========================================

function llenarSelectorTipos() {

    const selector =
        document.getElementById('filtroTipo');

    if (!selector) {
        return;
    }

    const tiposUnicos =
        [...new Set(todosDocumentos.map(doc => doc.tipo))];

    tiposUnicos.sort().forEach(tipo => {

        const opcion =
            document.createElement('option');

        opcion.value = tipo;
        opcion.textContent = tipo;

        selector.appendChild(opcion);
    });
}


// ==========================================
// ESTADO EFECTIVO DEL DOCUMENTO
// ==========================================

function estadoEfectivo(documento) {

    if (documento.estado === 'En revisión') {
        return 'en_revision';
    }

    if (!documento.vencimiento) {
        return documento.estado === 'Vencido'
            ? 'vencido'
            : 'vigente';
    }

    const diasRestantes =
        diasHasta(documento.vencimiento);

    if (diasRestantes < 0) {
        return 'vencido';
    }

    if (diasRestantes <= DIAS_POR_VENCER) {
        return 'por_vencer';
    }

    return 'vigente';
}


function diasHasta(fecha) {

    const objetivo =
        new Date(fecha).setHours(23, 59, 59, 999);

    const hoy =
        new Date().setHours(0, 0, 0, 0);

    return Math.ceil(
        (objetivo - hoy) / 86400000
    );
}


// ==========================================
// RESUMEN
// ==========================================

function actualizarResumen() {

    const conteo = {
        vigente: 0,
        por_vencer: 0,
        vencido: 0,
        en_revision: 0
    };

    todosDocumentos.forEach(documento => {

        const estado =
            estadoEfectivo(documento);

        conteo[estado] += 1;
    });


    actualizarElemento(
        'docsTotal',
        todosDocumentos.length
    );

    actualizarElemento('docsVigentes', conteo.vigente);

    actualizarElemento('docsPorVencer', conteo.por_vencer);

    actualizarElemento('docsVencidos', conteo.vencido);
}


function actualizarElemento(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = String(valor);
    }
}


// ==========================================
// REJILLA DE DOCUMENTOS
// ==========================================

function obtenerFiltrados() {

    const busqueda =
        document
            .getElementById('inputBusqueda')
            ?.value
            .trim()
            .toLowerCase() || '';

    const tipoFiltro =
        document.getElementById('filtroTipo')?.value || '';

    const estadoFiltro =
        document.getElementById('filtroEstado')?.value || '';

    return todosDocumentos.filter(documento => {

        const coincideBusqueda =

            !busqueda ||
            documento.nombre.toLowerCase().includes(busqueda);

        const coincideTipo =

            !tipoFiltro ||
            documento.tipo === tipoFiltro;

        const coincideEstado =

            !estadoFiltro ||
            estadoEfectivo(documento) === estadoFiltro;

        return (
            coincideBusqueda &&
            coincideTipo &&
            coincideEstado
        );
    });
}


function renderizarDocumentos() {

    const contenedor =
        document.getElementById('contenedorDocumentos');

    if (!contenedor) {
        return;
    }

    const filtrados =
        obtenerFiltrados();

    const contador =
        document.getElementById('contadorDocumentos');

    if (contador) {

        contador.textContent =
            `${filtrados.length} documento${filtrados.length === 1 ? '' : 's'}`;
    }


    if (filtrados.length === 0) {

        contenedor.innerHTML = `

            <div class="panel-card">
                <div class="empty-state">
                    <span class="material-symbols-outlined">folder_off</span>
                    <p>No hay documentos que coincidan con los filtros aplicados.</p>
                </div>
            </div>

        `;

        return;
    }


    contenedor.innerHTML = filtrados.map((documento, indice) => {

        const estado =
            estadoEfectivo(documento);


        const claseIcono =
            estado === 'vencido'
                ? 'red'
                : estado === 'por_vencer'
                    ? 'amber'
                    : estado === 'vigente'
                        ? 'green'
                        : '';


        const vencimientoTexto =
            documento.vencimiento
                ? `Vence ${formatearFecha(documento.vencimiento)}`
                : 'Sin vencimiento';

        return `

            <article class="doc-card" data-indice="${indice}">

                <div class="doc-icon ${claseIcono}">
                    <span class="material-symbols-outlined">
                        ${getIconoTipo(documento.tipo)}
                    </span>
                </div>

                <div class="doc-body">

                    <h4 title="${escaparHTML(documento.nombre)}">
                        ${escaparHTML(documento.nombre)}
                    </h4>

                    <div class="doc-meta">

                        <span>${escaparHTML(documento.tipo)}</span>

                        <span>•</span>

                        <span>${formatearFecha(documento.fecha)}</span>

                        <span>•</span>

                        <span>${vencimientoTexto}</span>

                    </div>

                    <span class="status ${claseEstado(estado)}" style="margin-top:8px; display:inline-block;">
                        ${etiquetaEstado(estado)}
                    </span>

                </div>

                <div class="doc-actions">

                    <button
                        class="action-icon"
                        data-ver="${indice}"
                        title="Ver detalle"
                    >
                        <span class="material-symbols-outlined">visibility</span>
                    </button>

                    <button
                        class="action-icon"
                        data-descargar="${indice}"
                        title="Descargar copia de control"
                    >
                        <span class="material-symbols-outlined">download</span>
                    </button>

                    ${documento.subido ? `
                        <button
                            class="action-icon danger"
                            data-eliminar="${indice}"
                            title="Eliminar documento subido"
                        >
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    ` : ''}

                </div>

            </article>

        `;
    }).join('');


    contenedor.querySelectorAll('[data-ver]')
        .forEach(boton => {

            boton.addEventListener(
                'click',
                () => abrirDetalle(Number(boton.dataset.ver))
            );
        });

    contenedor.querySelectorAll('[data-descargar]')
        .forEach(boton => {

            boton.addEventListener(
                'click',
                () => descargarDocumento(obtenerFiltrados()[Number(boton.dataset.descargar)])
            );
        });

    contenedor.querySelectorAll('[data-eliminar]')
        .forEach(boton => {

            boton.addEventListener(
                'click',
                async () => {

                    const indice =
                        Number(boton.dataset.eliminar);

                    const documento =
                        obtenerFiltrados()[indice];

                    if (!documento) {
                        return;
                    }

                    const aceptar =
                        await mostrarConfirmacion({
                            titulo: 'Eliminar documento',
                            mensaje: `¿Eliminar "${documento.nombre}"? Esta acción no se puede deshacer.`,
                            textoConfirmar: 'Sí, eliminar',
                            textoCancelar: 'Cancelar',
                            peligro: true
                        });

                    if (!aceptar) {
                        return;
                    }

                    eliminarDocumento(
                        sesionActual.empresaId,
                        documento.id
                    );

                    await cargarDatos();
                }
            );
        });
}


// ==========================================
// SUBIDA DE DOCUMENTOS
// (persistencia local hasta existir API)
// ==========================================

function subirArchivo(evento) {

    const archivo =
        evento.target.files[0];

    if (!archivo) {
        return;
    }

    agregarDocumento(
        sesionActual.empresaId,
        {
            nombre: archivo.name,
            tipo: clasificarTipoNombre(archivo.name)
        }
    );


    evento.target.value = '';


    cargarDatos().then(() => {
        showNotification({
            type: 'success',
            title: 'Documento registrado',
            message: `"${archivo.name}" quedó en estado "En revisión".`
        });
    });
}


// ==========================================
// MODAL DETALLE
// ==========================================

function abrirDetalle(indice) {

    const documento =
        obtenerFiltrados()[indice];

    if (!documento) {
        return;
    }

    const detalle =
        document.getElementById('detalleDocumento');

    if (!detalle) {
        return;
    }

    const estado =
        estadoEfectivo(documento);

    detalle.innerHTML = `

        <div>
            <span>Nombre del archivo</span>
            <strong>${escaparHTML(documento.nombre)}</strong>
        </div>

        <div>
            <span>Estado</span>
            <strong>
                <span class="status ${claseEstado(estado)}">
                    ${etiquetaEstado(estado)}
                </span>
            </strong>
        </div>

        <div>
            <span>Tipo</span>
            <strong>${escaparHTML(documento.tipo)}</strong>
        </div>

        <div>
            <span>Fecha de registro</span>
            <strong>${formatearFecha(documento.fecha)}</strong>
        </div>

        <div>
            <span>Vencimiento</span>
            <strong>
                ${documento.vencimiento
                    ? formatearFecha(documento.vencimiento)
                    : 'No aplica'}
            </strong>
        </div>

        ${documento.solicitudId ? `
            <div>
                <span>Solicitud asociada</span>
                <strong>${escaparHTML(documento.solicitudId)}</strong>
            </div>
        ` : ''}

    `;


    document
        .getElementById('modalDocumento')
        ?.classList.remove('hidden');
}


function cerrarModal() {

    document
        .getElementById('modalDocumento')
        ?.classList.add('hidden');
}


// ==========================================
// HELPERS DE ESTADO
// ==========================================

function claseEstado(estado) {

    switch (estado) {

        case 'vigente': return 'completed';
        case 'por_vencer': return 'warning';
        case 'vencido': return 'danger';
        case 'en_revision': return 'review';
        default: return 'review';
    }
}


function etiquetaEstado(estado) {

    switch (estado) {

        case 'vigente': return 'Vigente';
        case 'por_vencer': return 'Por vencer';
        case 'vencido': return 'Vencido';
        case 'en_revision': return 'En revisión';
        default: return 'En revisión';
    }
}


iniciarPanel();
