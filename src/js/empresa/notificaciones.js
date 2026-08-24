// ==========================================
// ZoFranca CR - PANEL DE NOTIFICACIONES
// (Módulo Empresa)
// ==========================================

import {
    getNotificaciones,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    escaparHTML,
    formatearFecha
} from './empresa-data.js';

import {
    protegerPanelEmpresa,
    iniciarPanelBase,
    actualizarBadgeNotificaciones
} from './panel-base.js';


let sesionActual = null;

let todasNotificaciones = [];

let filtroActual = '';


const ICONOS_TIPO = {
    Alerta: 'warning',
    Solicitud: 'assignment',
    Documento: 'description',
    Sistema: 'settings',
    Trámite: 'account_tree'
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


    document.querySelectorAll('#tabsNotificaciones .tab')
        .forEach(tab => {

            tab.addEventListener(
                'click',
                () => {

                    filtroActual =
                        tab.dataset.filtro || '';

                    document
                        .querySelectorAll(
                            '#tabsNotificaciones .tab'
                        )
                        .forEach(item =>
                            item.classList.remove('active')
                        );

                    tab.classList.add('active');

                    renderizarNotificaciones();
                }
            );
        });


    document
        .getElementById('btnMarcarTodas')
        ?.addEventListener(
            'click',
            async () => {

                marcarTodasNotificacionesLeidas(
                    sesionActual.empresaId,
                    todasNotificaciones
                );

                await cargarDatos();
            }
        );
}


async function cargarDatos() {

    todasNotificaciones =
        await getNotificaciones(sesionActual.empresaId);

    actualizarBadge();

    renderizarNotificaciones();
}


// ==========================================
// BADGE
// ==========================================

async function actualizarBadge() {

    await actualizarBadgeNotificaciones(
        sesionActual.empresaId
    );
}


// ==========================================
// LISTA DE NOTIFICACIONES
// ==========================================

function obtenerFiltradas() {

    if (!filtroActual) {
        return todasNotificaciones;
    }

    if (filtroActual === 'no_leidas') {

        return todasNotificaciones.filter(
            notificacion => !notificacion.leida
        );
    }

    return todasNotificaciones.filter(
        notificacion =>
            notificacion.tipo === filtroActual
    );
}


function renderizarNotificaciones() {

    const contenedor =
        document.getElementById('contenedorNotificaciones');

    if (!contenedor) {
        return;
    }

    const filtradas =
        obtenerFiltradas();

    const sinLeer =
        todasNotificaciones.filter(
            notificacion => !notificacion.leida
        ).length;


    const contador =
        document.getElementById('contadorNoLeidas');

    if (contador) {
        contador.textContent =
            `${sinLeer} sin leer de ${todasNotificaciones.length}`;
    }


    if (filtradas.length === 0) {

        contenedor.innerHTML = `

            <div class="panel-card">
                <div class="empty-state">
                    <span class="material-symbols-outlined">notifications_off</span>
                    <p>No hay notificaciones para mostrar.</p>
                </div>
            </div>

        `;

        return;
    }


    contenedor.innerHTML = filtradas.map(notificacion => {

        const clasesItem = [
            notificacion.leida ? 'leida' : 'no-leida'
        ].join(' ');

        const icono =
            ICONOS_TIPO[notificacion.tipo] ||
            ICONOS_TIPO.Sistema;

        return `

            <article
                class="notif-item ${clasesItem}"
                data-id="${escaparHTML(notificacion.id)}"
            >

                <div class="notif-icon ${
                    notificacion.tipo === 'Alerta'
                        ? 'alerta'
                        : notificacion.tipo === 'Documento'
                            ? 'documento'
                            : notificacion.tipo === 'Sistema'
                                ? 'sistema'
                                : ''
                }">

                    <span class="material-symbols-outlined">
                        ${icono}
                    </span>

                </div>

                <div class="notif-body">

                    <strong>${escaparHTML(notificacion.titulo)}</strong>

                    <p>${escaparHTML(notificacion.mensaje)}</p>

                </div>

                <div class="notif-side">

                    <span class="notif-time">
                        ${formatearFecha(notificacion.fecha)}
                    </span>

                    <span class="unread-dot"></span>

                    <span class="chip neutral" style="text-transform:none;">
                        ${escaparHTML(notificacion.tipo)}
                    </span>

                </div>

            </article>

        `;
    }).join('');


    contenedor.querySelectorAll('.notif-item')
        .forEach(item => {

            item.addEventListener(
                'click',
                async () => {

                    const id =
                        item.dataset.id;

                    const notificacion =
                        todasNotificaciones.find(
                            candidata => candidata.id === id
                        );

                    if (
                        !notificacion ||
                        notificacion.leida
                    ) {
                        return;
                    }

                    marcarNotificacionLeida(
                        sesionActual.empresaId,
                        id
                    );

                    await cargarDatos();
                }
            );
        });
}


iniciarPanel();
