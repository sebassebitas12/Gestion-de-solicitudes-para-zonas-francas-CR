// ==========================================
// Procomer - LOGOUT COMPARTIDO
// Cierre de sesión con confirmación propia
// de la aplicación (sin confirm() nativo) y
// notificación visual no bloqueante.
// ==========================================

import { logout } from '../../services/auth.service.js';

import {
    encolarNotificacion,
    mostrarConfirmacion,
    estilizarBotonLogout
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
            titulo: 'Cerrar sesión',
            mensaje: '¿Está seguro de que desea cerrar su sesión?',
            textoConfirmar: 'Confirmar',
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

    // Identidad visual única del botón en
    // todos los roles (Administrador, Gerente,
    // Analista y Empresa).
    estilizarBotonLogout(button);


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
