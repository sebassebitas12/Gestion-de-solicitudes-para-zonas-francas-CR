// ==========================================
// ZoFranca CR - LOGOUT COMPARTIDO
// Cierre de sesión con confirmación propia
// de la aplicación (sin confirm() nativo) y
// notificación visual no bloqueante.
// ==========================================

import { logout } from '../../services/auth.service.js';

import {
    encolarNotificacion,
    mostrarConfirmacion
} from './ui.js';

export const LOGIN_URL = '../login.html';


export function irALogin() {

    // replace(): el login sustituye la página actual en el
    // historial, de modo que "atrás" no vuelve al panel
    // protegido.

    window.location.replace(LOGIN_URL);

}


// ------------------------------------------
// Flujo completo de cierre de sesión.
// 1) Confirmación con diálogo propio.
// 2) Limpieza de sesión.
// 3) Notificación "Sesión cerrada correctamente"
//    (se muestra en el login tras redirigir).
// ------------------------------------------

export async function solicitarCierreSesion() {

    const aceptar =
        await mostrarConfirmacion({
            titulo: '¿Cerrar sesión?',
            mensaje: 'Se cerrará tu sesión actual y volverás a la pantalla de inicio.',
            textoConfirmar: 'Cerrar sesión',
            textoCancelar: 'Cancelar'
        });

    if (!aceptar) {
        return;
    }


    logout();

    // Limpieza adicional de datos temporales de
    // autenticación (la sesión es el único dato
    // sensible almacenado del lado del cliente).
    sessionStorage.clear();


    encolarNotificacion({
        type: 'success',
        title: 'Sesión cerrada',
        message: 'Sesión cerrada correctamente.'
    });


    irALogin();
}


export function configurarLogout(buttonId) {

    const button =
        document.getElementById(buttonId);

    if (!button) {
        return;
    }


    button.addEventListener(
        'click',
        (event) => {

            if (event) {
                event.preventDefault();
            }

            solicitarCierreSesion();
        }
    );

}
