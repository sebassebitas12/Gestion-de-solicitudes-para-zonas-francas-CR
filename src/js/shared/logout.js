// ==========================================
// ZoFranca CR - LOGOUT COMPARTIDO
// ==========================================

import { logout } from '../../services/auth.service.js';

export const LOGIN_URL = '../login.html';


export function irALogin() {

    // replace(): el login sustituye la página actual en el
    // historial, de modo que "atrás" no vuelve al panel
    // protegido.

    window.location.replace(LOGIN_URL);

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

            const confirmar =
                window.confirm(
                    '¿Está seguro de que desea cerrar sesión?'
                );

            if (!confirmar) {
                return;
            }

            logout();

            // Limpieza adicional de datos temporales de
            // autenticación (la sesión es el único dato
            // sensible almacenado del lado del cliente).
            sessionStorage.clear();

            irALogin();

        }
    );

}
