// ==========================================
// ZoFranca CR - BASE COMPARTIDA DE LOS
// PANELES DEL MÓDULO EMPRESA
// ==========================================

import { getSesion } from '../../services/auth.service.js';
import { configurarLogout } from '../shared/logout.js';
import { getNotificaciones } from './empresa-data.js';


export function protegerPanelEmpresa() {

    const sesion = getSesion();

    if (
        !sesion ||
        sesion.rol !== 'empresa' ||
        !sesion.empresaId
    ) {

        window.location.href = '../login.html';

        throw new Error(
            'Acceso no autorizado al panel de empresa.'
        );
    }

    return sesion;
}


export function iniciarPanelBase(sesion) {

    configurarLogout('btnCerrarSesion');

    aplicarPreferenciasUsuario(sesion);


    const btnNotificaciones =
        document.querySelector('.notification-button');

    if (btnNotificaciones) {

        btnNotificaciones.addEventListener(
            'click',
            () => {
                window.location.href =
                    'notificaciones.html';
            }
        );
    }


    const btnBuscar =
        document.querySelector('.icon-button[title="Buscar"]');

    if (btnBuscar) {

        btnBuscar.addEventListener(
            'click',
            () => {

                const campoBusqueda =
                    document.querySelector('.filter-search input');

                if (campoBusqueda) {
                    campoBusqueda.focus();
                }
            }
        );
    }


    const btnAyuda =
        document.querySelector('.icon-button[title="Ayuda"]');

    if (btnAyuda) {

        btnAyuda.addEventListener(
            'click',
            () => alert('Centro de ayuda de ZoFranca CR.')
        );
    }


    const btnAjustes =
        document.querySelector('[data-proximamente]');

    if (btnAjustes) {

        btnAjustes.addEventListener(
            'click',
            (evento) => {

                evento.preventDefault();

                alert('Esta sección estará disponible próximamente.');
            }
        );
    }

    return actualizarBadgeNotificaciones(sesion.empresaId);
}


// ==========================================
// PREFERENCIAS LOCALES DEL USUARIO
// ==========================================

function aplicarPreferenciasUsuario(sesion) {

    try {

        const crudo =
            localStorage.getItem(
                'zofranca_preferencias_' + sesion.id
            );

        if (!crudo) {
            return;
        }

        const preferencias =
            JSON.parse(crudo);

        document.documentElement.classList.toggle(
            'anim-reducida',
            Boolean(preferencias.animacionesReducidas)
        );

    } catch (error) {
        /* Preferencias inválidas: se ignoran. */
    }
}


export async function actualizarBadgeNotificaciones(empresaId) {

    const badge =
        document.getElementById('badgeNotificaciones');

    if (!badge) {
        return 0;
    }

    const notificaciones =
        await getNotificaciones(empresaId);

    const sinLeer = notificaciones.filter(
        notificacion => !notificacion.leida
    );

    if (sinLeer.length === 0) {

        badge.hidden = true;

        badge.textContent = '';

    } else {

        badge.hidden = false;

        badge.textContent =
            sinLeer.length > 99
                ? '+99'
                : String(sinLeer.length);
    }

    return sinLeer.length;
}
