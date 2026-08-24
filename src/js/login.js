import { login } from '../services/auth.service.js';


// ==========================================
// RUTAS SEGÚN ROL
// ==========================================

const rutasPorRol = {

    empresa:
        'empresa/empresa.html',

    analista:
        'analista.html',

    administrador:
        'administrador.html',

    gerente:
        'gerente.html'

};


// ==========================================
// SELECTOR DE ROL
// ==========================================

const selectorRol =
    document.getElementById(
        'rol-usuario'
    );


if (selectorRol) {

    selectorRol.required = false;

    selectorRol.disabled = true;

    selectorRol
        .closest('.form-group')
        ?.classList.add('hidden');
}


// ==========================================
// ALERTA
// ==========================================

function mostrarAlerta(
    mensaje,
    tipo = 'error'
) {

    const alerta =
        document.getElementById(
            'alert-message'
        );


    if (!alerta) {

        alert(mensaje);

        return;
    }


    alerta.textContent =
        mensaje;


    alerta.className =
        `alert-banner alert-${tipo}`;


    alerta.classList.remove(
        'hidden'
    );


    setTimeout(
        () => {

            alerta.classList.add(
                'hidden'
            );

        },
        5000
    );
}


// ==========================================
// FORMULARIO LOGIN
// ==========================================

const formulario =
    document.getElementById(
        'login-form'
    );


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
        document.getElementById(
            'btn-login'
        );


    const spinner =
        document.getElementById(
            'spinner-loading'
        );


    if (boton) {

        boton.disabled = true;

    }


    if (spinner) {

        spinner.classList.remove(
            'hidden'
        );

    }


    try {

        const email =
            document.getElementById(
                'email'
            )?.value.trim();


        const password =
            document.getElementById(
                'password'
            )?.value;


        if (!email || !password) {

            throw new Error(
                'Ingrese su correo y contraseña.'
            );
        }


        // ------------------------------
        // AUTENTICAR
        // ------------------------------

        const sesion =
            await login(
                email,
                password
            );


        console.log(
            'Sesión iniciada:',
            sesion
        );


        // ------------------------------
        // OBTENER RUTA
        // ------------------------------

        const ruta =
            rutasPorRol[
                String(
                    sesion.rol
                )
                    .toLowerCase()
                    .trim()
            ];


        if (!ruta) {

            throw new Error(
                `El usuario tiene un rol no configurado: ${sesion.rol}`
            );
        }


        // ------------------------------
        // REDIRECCIÓN
        // ------------------------------

        window.location.href =
            ruta;


    } catch (error) {

        console.error(
            'Error de login:',
            error
        );


        mostrarAlerta(
            error.message
        );


    } finally {

        if (boton) {

            boton.disabled = false;

        }


        if (spinner) {

            spinner.classList.add(
                'hidden'
            );

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
            document.getElementById(
                'password'
            );


        const togglePassword =
            document.getElementById(
                'toggle-password'
            );


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