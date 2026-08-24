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

            logout();

            // Limpieza adicional de datos temporales de
            // autenticación
            sessionStorage.clear();

            irALogin();

        }
    );

}
