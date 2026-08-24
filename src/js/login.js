import { login, getSesion } from '../services/auth.service.js';


// ==========================================
// RUTAS SEGÚN ROL
// ==========================================

const rutasPorRol = {

    empresa:
        'empresa/empresa.html',

    analista:
        'analista/analista.html',

    administrador:
        'administrador/administrador.html',

    gerente:
        'gerente/gerente.html'

};


// ==========================================
// SESIÓN YA INICIADA → REDIRIGIR
// ==========================================

(function redirigirSiAutenticado() {

    const sesion = getSesion();

    if (!sesion?.rol) {
        return;
    }

    const ruta = rutasPorRol[sesion.rol];

    if (ruta) {
        window.location.replace(ruta);
    }

})();


// ==========================================
// SELECTOR DE ROL
// ==========================================

const selectorRol =
    document.getElementById('rol-usuario');

if (selectorRol) {

    selectorRol.required = false;

    selectorRol.disabled = true;

    selectorRol
        .closest('.form-group')
        ?.classList.add('hidden');
}


import { mostrarToast } from './shared/ui.js';

function mostrarAlerta(
    mensaje,
    tipo = 'error'
) {

    const alerta =
        document.getElementById('alert-message');

    if (!alerta) {
        mostrarToast(mensaje, tipo === 'error' ? 'error' : 'exito');
        return;
    }

    alerta.textContent = mensaje;

    alerta.className =
        `alert alert-${tipo}`;

    alerta.classList.remove('hidden');

    setTimeout(() => {

        alerta.classList.add('hidden');

    }, 5000);
}


// ==========================================
// FORMULARIO LOGIN
// ==========================================

const formulario =
    document.getElementById('login-form');

if (formulario) {

    formulario.addEventListener(
        'submit',
        manejarLogin
    );

}


// ==========================================
// MANEJAR LOGIN
// ==========================================

async function manejarLogin(event) {

    event.preventDefault();

    const boton =
        document.getElementById('btn-login');

    const spinner =
        document.getElementById('spinner-loading');


    if (boton) {
        boton.disabled = true;
    }

    if (spinner) {
        spinner.classList.remove('hidden');
    }


    try {

        // --------------------------------------
        // OBTENER DATOS
        // --------------------------------------

        const email =
            document
                .getElementById('email')
                ?.value
                .trim();

        const password =
            document
                .getElementById('password')
                ?.value;


        // --------------------------------------
        // VALIDAR CAMPOS
        // --------------------------------------

        if (!email || !password) {

            throw new Error(
                'Ingrese su correo y contraseña.'
            );

        }


        // --------------------------------------
        // AUTENTICAR
        // --------------------------------------

        const sesion =
            await login(
                email,
                password
            );


        console.log(
            'Sesión iniciada correctamente:',
            sesion
        );


        // --------------------------------------
        // OBTENER ROL
        // --------------------------------------

        const rol =
            String(
                sesion.rol || ''
            )
                .toLowerCase()
                .trim();


        console.log(
            'Rol detectado:',
            rol
        );


        // --------------------------------------
        // BUSCAR RUTA
        // --------------------------------------

        const ruta =
            rutasPorRol[rol];


        if (!ruta) {

            throw new Error(
                `El usuario tiene un rol no configurado: ${sesion.rol}`
            );

        }


        console.log(
            'Redirigiendo a:',
            ruta
        );


        // --------------------------------------
        // REDIRECCIÓN
        // (replace evita que "atrás" regrese
        //  al formulario con sesión activa)
        // --------------------------------------

        window.location.replace(ruta);


    } catch (error) {

        console.error(
            'Error durante el inicio de sesión:',
            error
        );


        mostrarAlerta(
            error.message ||
            'No se pudo iniciar sesión.'
        );


    } finally {

        if (boton) {
            boton.disabled = false;
        }

        if (spinner) {
            spinner.classList.add('hidden');
        }

    }

}


// ==========================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const passwordInput =
            document.getElementById('password');

        const togglePassword =
            document.getElementById('toggle-password');


        if (
            passwordInput &&
            togglePassword
        ) {

            togglePassword.addEventListener(
                'click',
                () => {

                    const esPassword =
                        passwordInput.type ===
                        'password';


                    passwordInput.type =
                        esPassword
                            ? 'text'
                            : 'password';


                    togglePassword.textContent =
                        esPassword
                            ? '○'
                            : '◉';


                    togglePassword.setAttribute(
                        'aria-label',
                        esPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                    );

                }
            );

        }

    }
);