import { fetchAPI } from '../../services/api.js';
import {
    getSesion
} from '../../services/auth.service.js';


// ==========================================
// VARIABLES
// ==========================================

let usuarioActual = null;
let empresaActual = null;


// ==========================================
// INICIO
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    iniciarPagina
);


async function iniciarPagina() {

    try {

        // --------------------------------------
        // 1. Obtener sesión
        // --------------------------------------

        usuarioActual = getSesion();


        if (!usuarioActual) {

            window.location.href =
                '../login.html';

            return;
        }


        // --------------------------------------
        // 2. Verificar rol
        // --------------------------------------

        if (
            usuarioActual.rol !==
            'empresa'
        ) {

            alert(
                'No tienes permisos para crear solicitudes.'
            );

            window.location.href =
                '../login.html';

            return;
        }


        // --------------------------------------
        // 3. Verificar empresa
        // --------------------------------------

        if (
            !usuarioActual.empresaId
        ) {

            mostrarMensaje(
                'La sesión no tiene una empresa asociada.',
                'error'
            );

            return;
        }


        // --------------------------------------
        // 4. Cargar empresa
        // --------------------------------------

        await cargarEmpresa();


        // --------------------------------------
        // 5. Eventos
        // --------------------------------------

        configurarEventos();


    } catch (error) {

        console.error(
            'Error iniciando nueva solicitud:',
            error
        );


        mostrarMensaje(
            error.message,
            'error'
        );
    }
}


// ==========================================
// CARGAR EMPRESA
// ==========================================

async function cargarEmpresa() {

    empresaActual =
        await fetchAPI(
            `/empresas/${encodeURIComponent(
                usuarioActual.empresaId
            )}`
        );


    if (!empresaActual) {

        throw new Error(
            'No se encontró la empresa asociada.'
        );
    }


    const nombreEmpresa =
        document.getElementById(
            'nombreEmpresa'
        );


    if (nombreEmpresa) {

        nombreEmpresa.textContent =
            empresaActual.nombre;
    }
}


// ==========================================
// EVENTOS
// ==========================================

function configurarEventos() {

    const formulario =
        document.getElementById(
            'formNuevaSolicitud'
        );


    if (formulario) {

        formulario.addEventListener(
            'submit',
            guardarSolicitud
        );
    }


    const btnCancelar =
        document.getElementById(
            'btnCancelar'
        );


    if (btnCancelar) {

        btnCancelar.addEventListener(
            'click',
            volverDashboard
        );
    }


    const btnVolver =
        document.getElementById(
            'btnVolver'
        );


    if (btnVolver) {

        btnVolver.addEventListener(
            'click',
            volverDashboard
        );
    }


    // Contador de descripción

    const descripcion =
        document.getElementById(
            'descripcion'
        );


    const contador =
        document.getElementById(
            'contadorDescripcion'
        );


    if (
        descripcion &&
        contador
    ) {

        descripcion.addEventListener(
            'input',
            () => {

                contador.textContent =
                    `${descripcion.value.length} / 1000`;
            }
        );
    }
}


// ==========================================
// GUARDAR SOLICITUD
// ==========================================

async function guardarSolicitud(
    event
) {

    event.preventDefault();


    limpiarMensaje();


    const boton =
        document.getElementById(
            'btnGuardar'
        );


    const textoGuardar =
        document.getElementById(
            'textoGuardar'
        );


    const iconoGuardar =
        document.getElementById(
            'iconoGuardar'
        );


    // --------------------------------------
    // Obtener valores
    // --------------------------------------

    const sector =
        document.getElementById(
            'sector'
        ).value.trim();


    const pais =
        document.getElementById(
            'pais'
        ).value.trim();


    const inversion =
        Number(
            document.getElementById(
                'inversion'
            ).value
        );


    const empleos =
        Number(
            document.getElementById(
                'empleos'
            ).value
        );


    const exportaciones =
        Number(
            document.getElementById(
                'exportaciones'
            ).value
        );


    const zonaFranca =
        document.getElementById(
            'zonaFranca'
        ).value.trim();


    const descripcion =
        document.getElementById(
            'descripcion'
        ).value.trim();


    const documentosTexto =
        document.getElementById(
            'documentos'
        ).value.trim();


    // --------------------------------------
    // Validaciones
    // --------------------------------------

    if (!sector) {

        mostrarMensaje(
            'Seleccione un sector.',
            'error'
        );

        return;
    }


    if (!pais) {

        mostrarMensaje(
            'Seleccione un país.',
            'error'
        );

        return;
    }


    if (
        !Number.isFinite(inversion) ||
        inversion < 0
    ) {

        mostrarMensaje(
            'Ingrese una inversión válida.',
            'error'
        );

        return;
    }


    if (
        !Number.isInteger(empleos) ||
        empleos < 0
    ) {

        mostrarMensaje(
            'Ingrese una cantidad válida de empleos.',
            'error'
        );

        return;
    }


    if (
        !Number.isFinite(exportaciones) ||
        exportaciones < 0
    ) {

        mostrarMensaje(
            'Ingrese un monto válido de exportaciones.',
            'error'
        );

        return;
    }


    if (
        descripcion.length < 10
    ) {

        mostrarMensaje(
            'La descripción debe tener al menos 10 caracteres.',
            'error'
        );

        return;
    }


    // --------------------------------------
    // Preparar documentos
    // --------------------------------------

    const documentos =
        documentosTexto
            ? documentosTexto
                .split(',')
                .map(
                    documento =>
                        documento.trim()
                )
                .filter(Boolean)
            : [];


    // --------------------------------------
    // Generar ID
    // --------------------------------------

    const id =
        generarIdSolicitud();


    // --------------------------------------
    // Fecha
    // --------------------------------------

    const fecha =
        new Date().toISOString();


    // --------------------------------------
    // Objeto a guardar
    // --------------------------------------

    const nuevaSolicitud = {

        id,

        empresaId:
            empresaActual.id,

        empresa:
            empresaActual.nombre,

        sector,

        pais,

        inversion,

        empleos,

        exportaciones,

        zonaFranca,

        descripcion,

        documentos,

        estado:
            'pendiente',

        puntajeIA:
            0,

        clasificacionIA:
            'pendiente',

        fecha
    };


    // --------------------------------------
    // Estado botón
    // --------------------------------------

    if (boton) {
        boton.disabled = true;
    }


    if (textoGuardar) {
        textoGuardar.textContent =
            'Guardando...';
    }


    if (iconoGuardar) {
        iconoGuardar.textContent =
            'hourglass_top';
    }


    try {

        // ----------------------------------
        // POST
        // ----------------------------------

        const resultado =
            await fetchAPI(
                '/solicitudes',
                {
                    method: 'POST',

                    body:
                        JSON.stringify(
                            nuevaSolicitud
                        )
                }
            );


        console.log(
            'Solicitud creada:',
            resultado
        );


        // ----------------------------------
        // ÉXITO
        // ----------------------------------

        mostrarMensaje(
            `Solicitud ${id} creada correctamente.`,
            'success'
        );


        if (textoGuardar) {
            textoGuardar.textContent =
                'Solicitud creada';
        }


        if (iconoGuardar) {
            iconoGuardar.textContent =
                'check_circle';
        }


        // ----------------------------------
        // Esperar y regresar
        // ----------------------------------

        setTimeout(
            () => {

                window.location.href =
                    'empresa.html';

            },
            1500
        );


    } catch (error) {

        console.error(
            'Error creando solicitud:',
            error
        );


        mostrarMensaje(
            'No se pudo crear la solicitud. ' +
            error.message,
            'error'
        );


        if (boton) {
            boton.disabled = false;
        }


        if (textoGuardar) {
            textoGuardar.textContent =
                'Crear solicitud';
        }


        if (iconoGuardar) {
            iconoGuardar.textContent =
                'send';
        }
    }
}


// ==========================================
// GENERAR ID
// ==========================================

function generarIdSolicitud() {

    const año =
        new Date()
            .getFullYear();


    const numero =
        String(
            Date.now()
        ).slice(-6);


    return `SOL-${año}-${numero}`;
}


// ==========================================
// VOLVER AL DASHBOARD
// ==========================================

function volverDashboard() {

    window.location.href =
        'empresa.html';
}


// ==========================================
// MENSAJES
// ==========================================

function mostrarMensaje(
    texto,
    tipo
) {

    const mensaje =
        document.getElementById(
            'mensaje'
        );


    if (!mensaje) {
        return;
    }


    mensaje.hidden = false;

    mensaje.className =
        `message ${tipo}`;

    mensaje.textContent =
        texto;


    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


function limpiarMensaje() {

    const mensaje =
        document.getElementById(
            'mensaje'
        );


    if (!mensaje) {
        return;
    }


    mensaje.hidden = true;

    mensaje.textContent = '';

    mensaje.className =
        'message';
}