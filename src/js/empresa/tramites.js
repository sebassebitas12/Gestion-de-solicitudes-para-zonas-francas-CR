// ==========================================
// Procomer - PANEL DE TRÁMITES
// (Módulo Empresa)
// ==========================================

import {
    getSolicitudes,
    derivarTramites,
    escaparHTML,
    formatearFecha
} from './empresa-data.js';

import {
    protegerPanelEmpresa,
    iniciarPanelBase
} from './panel-base.js';


let sesionActual = null;

let todosTramites = [];


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
        ?.addEventListener('input', renderizarTramites);

    document
        .getElementById('filtroEstado')
        ?.addEventListener('change', renderizarTramites);

    document
        .getElementById('filtroPrioridad')
        ?.addEventListener('change', renderizarTramites);


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

    const solicitudes =
        await getSolicitudes(sesionActual.empresaId);

    todosTramites =
        derivarTramites(solicitudes);

    actualizarResumen();

    renderizarTramites();
}


// ==========================================
// RESUMEN
// ==========================================

function actualizarResumen() {

    const activos =
        todosTramites.filter(
            tramite =>
                normalizarEstado(tramite) === 'en_proceso'
        ).length;

    const pendientes =
        todosTramites.filter(
            tramite =>
                normalizarEstado(tramite) === 'pendiente'
        ).length;

    const completados =
        todosTramites.filter(
            tramite =>
                normalizarEstado(tramite) === 'completado' ||
                normalizarEstado(tramite) === 'finalizado'
        ).length;


    const sumaProgreso =
        todosTramites.reduce(
            (suma, tramite) =>
                suma + Number(tramite.progreso || 0),
            0
        );

    const promedio =
        todosTramites.length > 0
            ? Math.round(sumaProgreso / todosTramites.length)
            : 0;


    actualizarElemento('tramitesActivos', activos);

    actualizarElemento('tramitesPendientesPanel', pendientes);

    actualizarElemento('tramitesCompletados', completados);

    actualizarElemento('promedioAvance', `${promedio}%`);
}


function actualizarElemento(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = String(valor);
    }
}


// ==========================================
// TARJETAS DE TRÁMITES
// ==========================================

function obtenerFiltrados() {

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

    const prioridadFiltro =
        document
            .getElementById('filtroPrioridad')
            ?.value || '';

    return todosTramites.filter(tramite => {

        const coincideBusqueda =

            !busqueda ||
            `${tramite.nombre} ${tramite.responsable} ${tramite.solicitudId}`
                .toLowerCase()
                .includes(busqueda);


        const coincideEstado =

            !estadoFiltro ||
            normalizarEstado(tramite) === estadoFiltro;


        const coincidePrioridad =

            !prioridadFiltro ||
            String(tramite.prioridad || '')
                .toLowerCase() === prioridadFiltro;

        return (
            coincideBusqueda &&
            coincideEstado &&
            coincidePrioridad
        );
    });
}


function renderizarTramites() {

    const contenedor =
        document.getElementById('contenedorTramites');

    if (!contenedor) {
        return;
    }

    const filtrados =
        obtenerFiltrados();

    const contador =
        document.getElementById('contadorTramites');

    if (contador) {

        contador.textContent =
            `${filtrados.length} trámite${filtrados.length === 1 ? '' : 's'}`;
    }


    if (filtrados.length === 0) {

        contenedor.innerHTML = `

            <div class="panel-card">
                <div class="empty-state">
                    <span class="material-symbols-outlined">account_tree</span>
                    <p>No hay trámites que coincidan con los filtros aplicados.</p>
                </div>
            </div>

        `;

        return;
    }


    contenedor.innerHTML = filtrados.map((tramite, indice) => {

        const claseEstadoTramite =
            claseEstado(normalizarEstado(tramite));

        const etiqueta =
            etiquetaEstado(normalizarEstado(tramite));


        const claseProgreso =
            tramite.progreso >= 100
                ? 'green'
                : tramite.progreso >= 45
                    ? ''
                    : 'amber';


        return `

            <article class="panel-card tramite-card" data-indice="${indice}">

                <div class="card-header">

                    <div class="card-title">

                        <h3>${escaparHTML(tramite.nombre)}</h3>

                    </div>

                    <span class="status ${claseEstadoTramite}">
                        ${etiqueta}
                    </span>

                </div>

                <p class="tramite-desc">
                    ${escaparHTML(tramite.descripcion)}
                </p>

                <div class="progress-row section-gap-sm">

                    <div class="progress-track">
                        <div
                            class="progress-fill ${claseProgreso}"
                            style="width: ${Number(tramite.progreso || 0)}%"
                        ></div>
                    </div>

                    <span class="progress-value">${tramite.progreso}%</span>

                </div>

                <div class="tramite-meta">

                    <div>
                        <span>Referencia</span>
                        <strong>${escaparHTML(tramite.solicitudId)}</strong>
                    </div>

                    <div>
                        <span>Responsable</span>
                        <strong>${escaparHTML(tramite.responsable)}</strong>
                    </div>

                    <div>
                        <span>Inicio</span>
                        <strong>${formatearFecha(tramite.fechaInicio)}</strong>
                    </div>

                    <div>
                        <span>Estimado</span>
                        <strong>${formatearFecha(tramite.fechaEstimada)}</strong>
                    </div>

                </div>

                <button
                    class="text-button"
                    data-ver="${indice}"
                >
                    Ver detalle
                </button>

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
}


// ==========================================
// MODAL DETALLE CON TIMELINE
// ==========================================

function abrirDetalle(indice) {

    const tramite =
        obtenerFiltrados()[indice];

    if (!tramite) {
        return;
    }

    const detalle =
        document.getElementById('detalleTramite');

    if (!detalle) {
        return;
    }

    const pasosHTML =
        tramite.etapas.map(paso => `

            <div class="timeline-step ${paso.estado}">

                <div class="timeline-dot"></div>

                <div class="timeline-info">

                    <strong>${escaparHTML(paso.nombre)}</strong>

                    <span>
                        ${paso.estado === 'completada'
                            ? `Completada · ${formatearFecha(paso.fecha)}`
                            : paso.estado === 'activa'
                                ? 'En curso'
                                : 'Pendiente'}
                    </span>

                </div>

            </div>

        `).join('');

    detalle.innerHTML = `

        <div>
            <span>Etapa actual</span>
            <strong>${escaparHTML(tramite.nombre)}</strong>
        </div>

        <div>
            <span>Solicitud asociada</span>
            <strong>${escaparHTML(tramite.solicitudId)}</strong>
        </div>

        <div>
            <span>Estado</span>
            <strong>${escaparHTML(tramite.estado)}</strong>
        </div>

        <div>
            <span>Prioridad</span>
            <strong>${escaparHTML(tramite.prioridad)}</strong>
        </div>

        <div>
            <span>Responsable</span>
            <strong>${escaparHTML(tramite.responsable)}</strong>
        </div>

        <div>
            <span>Fecha estimada de cierre</span>
            <strong>${formatearFecha(tramite.fechaEstimada)}</strong>
        </div>

        <div>
            <span>Etapas del trámite</span>
            <div class="timeline">${pasosHTML}</div>
        </div>

    `;


    document
        .getElementById('modalTramite')
        ?.classList.remove('hidden');
}


function cerrarModal() {

    document
        .getElementById('modalTramite')
        ?.classList.add('hidden');
}


// ==========================================
// HELPERS DE ESTADO
// ==========================================

function normalizarEstado(tramite) {

    return String(tramite.estado || '')
        .toLowerCase()
        .replace(/\s+/g, '_');
}


function claseEstado(estado) {

    switch (estado) {

        case 'pendiente': return 'pending';
        case 'en_proceso': return 'review';
        case 'completado': return 'completed';
        case 'finalizado': return 'done';
        default: return 'review';
    }
}


function etiquetaEstado(estado) {

    switch (estado) {

        case 'pendiente': return 'Pendiente';
        case 'en_proceso': return 'En proceso';
        case 'completado': return 'Completado';
        case 'finalizado': return 'Finalizado';
        default: return 'En proceso';
    }
}


iniciarPanel();
