// ==========================================
// Procomer - PANEL DE SOLICITUDES
// (Módulo Empresa)
// ==========================================

import {
    getSolicitudes,
    escaparHTML,
    formatearFecha,
    formatearMoneda
} from './empresa-data.js';

import {
    protegerPanelEmpresa,
    iniciarPanelBase
} from './panel-base.js';


let sesionActual = null;

let todasSolicitudes = [];


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

    const nombre = sesionActual.nombre || 'Empresa';

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

    const btnNuevaSolicitud =
        document.getElementById('btnNuevaSolicitud');

    if (btnNuevaSolicitud) {

        btnNuevaSolicitud.addEventListener(
            'click',
            () => {
                window.location.href =
                    'nueva-solicitud.html';
            }
        );
    }


    document
        .getElementById('inputBusqueda')
        ?.addEventListener('input', renderizarTabla);

    document
        .getElementById('filtroEstado')
        ?.addEventListener('change', renderizarTabla);

    document
        .getElementById('filtroOrden')
        ?.addEventListener('change', renderizarTabla);


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

    todasSolicitudes =
        await getSolicitudes(sesionActual.empresaId);

    actualizarResumen();

    renderizarTabla();
}


// ==========================================
// RESUMEN
// ==========================================

function actualizarResumen() {

    const total =
        todasSolicitudes.length;

    const enProceso =
        todasSolicitudes.filter(esEnProceso).length;

    const aprobadas =
        todasSolicitudes.filter(
            solicitud =>
                normalizarEstado(solicitud) === 'aprobada' ||
                normalizarEstado(solicitud) === 'completada'
        ).length;

    const rechazadas =
        todasSolicitudes.filter(
            solicitud =>
                normalizarEstado(solicitud) === 'rechazada'
        ).length;


    actualizarElemento('totalSolicitudes', total);

    actualizarElemento('solicitudesEnProceso', enProceso);

    actualizarElemento('solicitudesAprobadas', aprobadas);

    actualizarElemento('solicitudesRechazadas', rechazadas);
}


function actualizarElemento(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = String(valor);
    }
}


// ==========================================
// TABLA
// ==========================================

function obtenerFiltradas() {

    const busqueda =
        document
            .getElementById('inputBusqueda')
            ?.value
            .trim()
            .toLowerCase() || '';

    const estadoFiltro =
        document
            .getElementById('filtroEstado')
            ?.value || '';

    const orden =
        document
            .getElementById('filtroOrden')
            ?.value || 'recientes';


    let filtradas = todasSolicitudes.filter(solicitud => {

        const coincideBusqueda =

            !busqueda ||
            `${solicitud.id} ${solicitud.sector || ''} ${solicitud.descripcion || ''}`
                .toLowerCase()
                .includes(busqueda);


        const coincideEstado =

            !estadoFiltro ||
            normalizarEstado(solicitud) === estadoFiltro;

        return coincideBusqueda && coincideEstado;

    });


    if (orden === 'antiguas') {

        filtradas.sort(
            (a, b) =>
                new Date(a.fecha || 0) -
                new Date(b.fecha || 0)
        );

    } else if (orden === 'inversion') {

        filtradas.sort(
            (a, b) =>
                Number(b.inversion || 0) -
                Number(a.inversion || 0)
        );

    } else {

        filtradas.sort(
            (a, b) =>
                new Date(b.fecha || 0) -
                new Date(a.fecha || 0)
        );
    }

    return filtradas;
}


function renderizarTabla() {

    const tbody =
        document.getElementById('tablaSolicitudes');

    if (!tbody) {
        return;
    }

    const filtradas =
        obtenerFiltradas();

    const contador =
        document.getElementById('contadorSolicitudes');

    if (contador) {

        contador.textContent =
            `${filtradas.length} resultado${filtradas.length === 1 ? '' : 's'}`;
    }


    if (filtradas.length === 0) {

        tbody.innerHTML = `

            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <span class="material-symbols-outlined">inbox</span>
                        <p>No se encontraron solicitudes con los filtros aplicados.</p>
                    </div>
                </td>
            </tr>

        `;

        return;
    }


    tbody.innerHTML = filtradas.map(solicitud => {

        const estado =
            normalizarEstado(solicitud);

        const prioridad =
            calcularPrioridad(solicitud);

        return `

            <tr data-id="${escaparHTML(solicitud.id)}">

                <td>
                    <strong>${escaparHTML(solicitud.id)}</strong>
                </td>

                <td>${escaparHTML(solicitud.sector || 'General')}</td>

                <td>${formatearMoneda(solicitud.inversion)}</td>

                <td>${formatearFecha(solicitud.fecha)}</td>

                <td>
                    <span class="status ${claseEstado(estado)}">
                        ${etiquetaEstado(estado)}
                    </span>
                </td>

                <td>
                    <span class="chip ${prioridad.clase}">
                        ${prioridad.etiqueta}
                    </span>
                </td>

                <td>
                    <button class="text-button" data-ver="${escaparHTML(solicitud.id)}">
                        Ver detalle
                    </button>
                </td>

            </tr>

        `;
    }).join('');


    tbody.querySelectorAll('[data-ver]')
        .forEach(boton => {

            boton.addEventListener(
                'click',
                () => abrirDetalle(boton.dataset.ver)
            );
        });
}


// ==========================================
// MODAL DETALLE
// ==========================================

function abrirDetalle(solicitudId) {

    const solicitud =
        todasSolicitudes.find(item => item.id === solicitudId);

    if (!solicitud) {
        return;
    }

    const detalle =
        document.getElementById('detalleSolicitud');

    if (!detalle) {
        return;
    }

    const estado =
        normalizarEstado(solicitud);


    const documentos =
        Array.isArray(solicitud.documentos) &&
        solicitud.documentos.length > 0
            ? `
                <div>
                    <span>Documentos adjuntos</span>
                    <ul>
                        ${solicitud.documentos.map(nombre => `<li>${escaparHTML(nombre)}</li>`).join('')}
                    </ul>
                </div>
              `
            : '';


    detalle.innerHTML = `

        <div>
            <span>Solicitud</span>
            <strong>${escaparHTML(solicitud.id)}</strong>
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
            <span>Sector</span>
            <strong>${escaparHTML(solicitud.sector || 'No indicado')}</strong>
        </div>

        <div>
            <span>País de origen</span>
            <strong>${escaparHTML(solicitud.pais || 'No indicado')}</strong>
        </div>

        <div>
            <span>Descripción</span>
            <p>${escaparHTML(solicitud.descripcion || 'Sin descripción.')}</p>
        </div>

        <div>
            <span>Inversión proyectada</span>
            <strong>${formatearMoneda(solicitud.inversion)}</strong>
        </div>

        <div>
            <span>Empleos proyectados</span>
            <strong>${Number(solicitud.empleos || 0).toLocaleString('es-CR')}</strong>
        </div>

        <div>
            <span>Exportaciones proyectadas</span>
            <strong>${formatearMoneda(solicitud.exportaciones)}</strong>
        </div>

        <div>
            <span>Contacto</span>
            <strong>${escaparHTML(solicitud.contactoNombre || 'No indicado')}</strong>
            <p>${escaparHTML(solicitud.contactoEmail || '')}</p>
        </div>

        <div>
            <span>Fecha de registro</span>
            <strong>${formatearFecha(solicitud.fecha)}</strong>
        </div>

        <div>
            <span>Evaluación IA</span>
            <strong>
                ${Number(solicitud.puntajeIA || 0)} / 100 ·
                ${escaparHTML(solicitud.clasificacionIA || 'Sin clasificar')}
            </strong>
        </div>

        <div>
            <span>Justificación IA</span>
            <p>${escaparHTML(solicitud.justificacionIA || 'Sin justificación registrada.')}</p>
        </div>

        ${documentos}

    `;


    document
        .getElementById('modalSolicitud')
        ?.classList.remove('hidden');
}


function cerrarModal() {

    document
        .getElementById('modalSolicitud')
        ?.classList.add('hidden');
}


// ==========================================
// HELPERS DE ESTADO
// ==========================================

function normalizarEstado(solicitud) {

    return String(solicitud.estado || '')
        .toLowerCase()
        .replace(/\s+/g, '_');
}


function esEnProceso(solicitud) {

    const estado =
        normalizarEstado(solicitud);

    return (
        estado === 'pendiente' ||
        estado === 'en_revision'
    );
}


function claseEstado(estado) {

    switch (estado) {

        case 'pendiente': return 'pending';
        case 'en_revision': return 'review';
        case 'aprobada': return 'completed';
        case 'completada': return 'done';
        case 'rechazada': return 'danger';
        default: return 'review';
    }
}


function etiquetaEstado(estado) {

    switch (estado) {

        case 'pendiente': return 'Pendiente';
        case 'en_revision': return 'En revisión';
        case 'aprobada': return 'Aprobada';
        case 'completada': return 'Completada';
        case 'rechazada': return 'Rechazada';
        default: return 'En revisión';
    }
}


function calcularPrioridad(solicitud) {

    const puntaje =
        Number(solicitud.puntajeIA);

    if (!Number.isFinite(puntaje)) {
        return { clase: 'media', etiqueta: 'Media' };
    }

    if (puntaje < 50) {
        return { clase: 'alta', etiqueta: 'Alta' };
    }

    if (puntaje < 75) {
        return { clase: 'media', etiqueta: 'Media' };
    }

    return { clase: 'baja', etiqueta: 'Baja' };
}


iniciarPanel();
