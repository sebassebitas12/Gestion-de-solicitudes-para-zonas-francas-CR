// ==========================================
// ZoFranca CR - ACCIONES DE TOPBAR
// Enlaza campana, ayuda y menú contextual en
// los paneles existentes. Autoejecutado al
// importarse (los módulos cargan tras el DOM).
// ==========================================

import { fetchAPI } from '../../services/api.js';

import { solicitarCierreSesion } from './logout.js';

import { mostrarToast } from './ui.js';


async function mostrarAlertasActivas() {

    let cantidad = 0;

    try {
        const alertas =
            await fetchAPI('/alertas');

        cantidad = Array.isArray(alertas)
            ? alertas.filter(
                alerta =>
                    String(alerta.estado || '')
                        .toLowerCase() !== 'resuelta'
              ).length
            : 0;

    } catch (error) {

        mostrarToast(
            'No fue posible consultar las alertas.',
            'error'
        );

        return;
    }

    if (cantidad === 0) {

        mostrarToast(
            'No tienes alertas activas.',
            'exito'
        );

        return;
    }

    mostrarToast(
        `Tienes ${cantidad} alerta${cantidad === 1 ? '' : 's'} activa${cantidad === 1 ? '' : 's'} de cumplimiento.`,
        cantidad > 2 ? 'error' : 'info',
        4000
    );
}


function crearMenuContextual(ancla) {

    document
        .querySelector('.zofranca-menu-flotante')
        ?.remove();

    const menu =
        document.createElement('div');

    menu.className = 'zofranca-menu-flotante';

    menu.innerHTML = `

        <button type="button" data-accion="configuracion">
            <span class="material-symbols-outlined">settings</span>
            Ir a Configuración
        </button>

        <button type="button" data-accion="logout">
            <span class="material-symbols-outlined">logout</span>
            Cerrar sesión
        </button>

    `;

    Object.assign(menu.style, {
        position: 'fixed',
        zIndex: '9998',
        background: '#ffffff',
        border: '1px solid #e0e3e5',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '190px',
        fontFamily: '"Hanken Grotesk", sans-serif'
    });

    menu.querySelectorAll('button').forEach(boton => {

        Object.assign(boton.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 11px',
            border: 'none',
            background: 'transparent',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#191c1e',
            cursor: 'pointer',
            textAlign: 'left'
        });

        boton.addEventListener('mouseenter', () => {
            boton.style.background = '#f2f4f6';
        });

        boton.addEventListener('mouseleave', () => {
            boton.style.background = 'transparent';
        });

    });


    const rect =
        ancla.getBoundingClientRect();

    menu.style.top =
        `${rect.bottom + 8}px`;

    menu.style.left =
        `${Math.max(10, rect.right - 200)}px`;


    menu.querySelector('[data-accion="configuracion"]')
        ?.addEventListener('click', () => {

            menu.remove();

            window.location.href =
                '../configuracion/configuracion.html';
        });

    menu.querySelector('[data-accion="logout"]')
        ?.addEventListener('click', () => {

            menu.remove();

            solicitarCierreSesion();
        });


    document.body.appendChild(menu);

    setTimeout(() => {

        const cerrar = (evento) => {

            if (!menu.contains(evento.target)) {

                menu.remove();

                document.removeEventListener(
                    'click',
                    cerrar
                );

                document.removeEventListener(
                    'keydown',
                    cerrar
                );
            }
        };

        document.addEventListener('click', cerrar);

        document.addEventListener('keydown', cerrar);

    }, 0);
}


export function configurarAccionesTopbar() {

    // Guarda anti-duplicado: si otro módulo ya enlazó
    // el mismo botón, no se vuelve a enlazar.

    function enlazarUnaVez(selector, manejador) {

        const elemento =
            document.querySelector(selector);

        if (!elemento || elemento.dataset.zofTopbar === '1') {
            return;
        }

        elemento.dataset.zofTopbar = '1';

        elemento.addEventListener('click', manejador);
    }


    enlazarUnaVez(
        '[title="Notificaciones"]',
        mostrarAlertasActivas
    );


    enlazarUnaVez(
        '[title="Ayuda"]',
        () => {

            mostrarToast(
                'Centro de ayuda de ZoFranca CR.',
                'info'
            );
        }
    );


    const botonMenu =
        document.querySelector('.admin-icon-small');

    botonMenu?.addEventListener('click', (evento) => {

        evento.stopPropagation();

        const existente =
            document.querySelector('.zofranca-menu-flotante');

        if (existente) {
            existente.remove();
            return;
        }

        crearMenuContextual(botonMenu);
    });
}


configurarAccionesTopbar();
