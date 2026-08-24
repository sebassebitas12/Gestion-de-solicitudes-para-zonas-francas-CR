// ==========================================
// ZoFranca CR - UI COMPARTIDA GLOBAL
// Sistema unificado de notificaciones web
// (toasts) y diálogos de confirmación.
//
// Autocontenido: inyecta sus propios estilos
// y su contenedor. Funciona en cualquier
// pantalla actual o futura con solo importar
// este módulo (o incluirlo vía <script>).
//
// API pública:
//   showNotification({ type, title, message, duration })
//   mostrarToast(mensaje, tipo, duracionMs)  [compatibilidad]
//   mostrarConfirmacion({ titulo, mensaje, ... }) -> Promise<boolean>
//   encolarNotificacion(notificacion)
// ==========================================


// ==========================================
// CONFIGURACIÓN CENTRAL
// ==========================================

export const CONFIG_NOTIFICACIONES = {

    // Duraciones por tipo (milisegundos).
    duraciones: {
        success: 4000,
        info: 4000,
        warning: 5000,
        error: 6000
    },

    posicion: 'top-right',

    maximoVisible: 5
};


const CLAVES_TIPO = {
    success: 'success',
    exito: 'success',
    info: 'info',
    warning: 'warning',
    advertencia: 'warning',
    error: 'error'
};


const DEFINICIONES = {
    success: {
        icono: 'check_circle',
        titulo: 'Operación completada',
        color: '#1e8e3e',
        rol: 'status'
    },
    info: {
        icono: 'info',
        titulo: 'Información',
        color: '#085ac0',
        rol: 'status'
    },
    warning: {
        icono: 'warning',
        titulo: 'Atención',
        color: '#b45309',
        rol: 'alert'
    },
    error: {
        icono: 'error',
        titulo: 'Error',
        color: '#ba1a1a',
        rol: 'alert'
    }
};


const ESTILOS_UI = `

.zofranca-toast-container {

    position: fixed;

    top: 18px;
    right: 18px;

    z-index: 10000;

    display: flex;

    flex-direction: column;

    gap: 10px;

    width: min(360px, calc(100vw - 36px));

    pointer-events: none;
}


.zofranca-toast {

    --zof-color: #085ac0;

    position: relative;

    overflow: hidden;

    display: flex;

    align-items: flex-start;

    gap: 11px;

    padding: 13px 14px 16px;

    border-radius: 12px;

    border: 1px solid #e3e7eb;

    border-left: 4px solid var(--zof-color);

    background: #ffffff;

    font-family: "Hanken Grotesk", sans-serif;

    box-shadow: 0 10px 28px rgba(19, 27, 46, 0.16);

    opacity: 0;

    transform: translateX(24px);

    animation:
        zofranca-toast-entrada 0.32s cubic-bezier(0.21, 1.02, 0.55, 1) forwards;

    pointer-events: auto;
}


.zofranca-toast.zof-saliendo {

    animation:
        zofranca-toast-salida 0.26s ease forwards;
}


@keyframes zofranca-toast-entrada {

    from {
        opacity: 0;
        transform: translateX(24px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}


@keyframes zofranca-toast-salida {

    from {
        opacity: 1;
        transform: translateX(0);
    }

    to {
        opacity: 0;
        transform: translateX(24px);
    }
}


.zofranca-toast .zof-icono {

    flex-shrink: 0;

    color: var(--zof-color);

    font-size: 21px;

    line-height: 1;

    margin-top: 1px;
}


.zofranca-toast .zof-contenido {

    flex: 1;

    min-width: 0;
}


.zofranca-toast .zof-titulo {

    margin: 0 0 2px;

    font-size: 13.5px;

    font-weight: 800;

    letter-spacing: 0.01em;

    color: #131b2e;
}


.zofranca-toast .zof-mensaje {

    margin: 0;

    font-size: 12.8px;

    line-height: 1.5;

    color: #55606c;

    white-space: pre-line;

    word-break: break-word;
}


.zofranca-toast .zof-cerrar {

    flex-shrink: 0;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    width: 24px;
    height: 24px;

    margin: -2px -4px 0 0;

    padding: 0;

    border: none;

    border-radius: 6px;

    background: transparent;

    color: #8592a1;

    cursor: pointer;
}


.zofranca-toast .zof-cerrar:hover {

    background: #f1f4f7;

    color: #131b2e;
}


.zofranca-toast .zof-cerrar:focus-visible {

    outline: 2px solid var(--zof-color);

    outline-offset: 1px;
}


.zofranca-toast .zof-cerrar .material-symbols-outlined {

    font-size: 16px;
}


.zofranca-toast .zof-progreso {

    position: absolute;

    left: 0;

    bottom: 0;

    height: 3px;

    width: 100%;

    transform-origin: left center;

    background: var(--zof-color);

    opacity: 0.85;

    transform: scaleX(1);
}


.zofranca-toast.zof-pausado .zof-progreso {

    animation-play-state: paused !important;
}


@keyframes zofranca-progreso {

    from { transform: scaleX(1); }

    to { transform: scaleX(0); }
}


/* Modal de confirmación propio */

.zofranca-modal-overlay {

    position: fixed;

    inset: 0;

    z-index: 9999;

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 20px;

    background: rgba(19, 27, 46, 0.45);

    backdrop-filter: blur(2px);

    font-family: "Hanken Grotesk", sans-serif;

    opacity: 0;

    transition: opacity 0.22s ease;
}


.zofranca-modal-overlay.visible {

    opacity: 1;
}


.zofranca-modal-caja {

    width: min(420px, 100%);

    padding: 22px 22px 18px;

    border-radius: 14px;

    border: 1px solid #e3e7eb;

    background: #ffffff;

    box-shadow: 0 18px 48px rgba(19, 27, 46, 0.28);

    transform: translateY(10px) scale(0.98);

    transition: transform 0.22s ease;
}


.zofranca-modal-overlay.visible .zofranca-modal-caja {

    transform: translateY(0) scale(1);
}


.zofranca-modal-icono {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    width: 42px;
    height: 42px;

    margin-bottom: 12px;

    border-radius: 50%;

    background: #fdf0d7;

    color: #b45309;
}


.zofranca-modal-icono.peligro {

    background: #fdeaea;

    color: #ba1a1a;
}


.zofranca-modal-titulo {

    margin: 0 0 6px;

    font-size: 16px;

    font-weight: 800;

    color: #131b2e;
}


.zofranca-modal-descripcion {

    margin: 0 0 18px;

    font-size: 13.5px;

    line-height: 1.55;

    color: #55606c;

    white-space: pre-line;
}


.zofranca-modal-acciones {

    display: flex;

    justify-content: flex-end;

    gap: 10px;
}


.zofranca-boton-secundario {

    padding: 9px 16px;

    border-radius: 9px;

    border: 1px solid #d7dde3;

    background: #ffffff;

    font-family: inherit;

    font-size: 13px;

    font-weight: 700;

    color: #33404e;

    cursor: pointer;
}


.zofranca-boton-secundario:hover {

    background: #f4f6f8;
}


.zofranca-boton-primario {

    padding: 9px 18px;

    border-radius: 9px;

    border: none;

    background: #131b2e;

    font-family: inherit;

    font-size: 13px;

    font-weight: 700;

    color: #ffffff;

    cursor: pointer;
}


.zofranca-boton-primario.peligro {

    background: #ba1a1a;
}


.zofranca-boton-primario:hover {

    filter: brightness(1.15);
}


.zofranca-boton-primario:focus-visible,
.zofranca-boton-secundario:focus-visible {

    outline: 2px solid #5b94fd;

    outline-offset: 2px;
}


@media (max-width: 650px) {

    .zofranca-toast-container {

        top: 12px;
        right: 12px;

        width: calc(100vw - 24px);
    }
}

`;


let contenedor = null;


// ==========================================
// COLA PERSISTENTE (entre páginas)
// Permite que una notificación sobreviva una
// redirección (ej. "Sesión cerrada" en login,
// "Acceso no autorizado" al ser expulsado).
// ==========================================

const CLAVE_COLA =
    'zofranca_notificaciones_pendientes';


export function encolarNotificacion(notificacion) {

    try {

        const crudo =
            sessionStorage.getItem(CLAVE_COLA);

        const cola = crudo ? JSON.parse(crudo) : [];

        cola.push(notificacion);

        sessionStorage.setItem(
            CLAVE_COLA,
            JSON.stringify(cola.slice(-6))
        );

    } catch (error) {
        /* Almacenamiento no disponible. */
    }
}


function vaciarColaPendiente() {

    let cola = [];

    try {

        const crudo =
            sessionStorage.getItem(CLAVE_COLA);

        if (crudo) {

            cola = JSON.parse(crudo) || [];
            sessionStorage.removeItem(CLAVE_COLA);
        }

    } catch (error) {
        return;
    }

    cola.forEach((item, indice) => {

        setTimeout(
            () => showNotification(item),
            indice * 350
        );
    });
}


// ==========================================
// NOTIFICACIONES
// ==========================================

function asegurarContenedor() {

    if (contenedor && document.body.contains(contenedor)) {
        return contenedor;
    }

    if (
        !document.getElementById('zofranca-ui-styles')
    ) {

        const estilo =
            document.createElement('style');

        estilo.id = 'zofranca-ui-styles';

        estilo.textContent = ESTILOS_UI;

        document.head.appendChild(estilo);
    }

    contenedor =
        document.querySelector('.zofranca-toast-container');

    if (!contenedor) {

        contenedor =
            document.createElement('div');

        contenedor.className =
            'zofranca-toast-container';

        contenedor.setAttribute(
            'aria-live',
            'polite'
        );

        contenedor.setAttribute(
            'aria-label',
            'Notificaciones de la aplicación'
        );

        document.body.appendChild(contenedor);
    }

    return contenedor;
}


function cerrarToast(toast, temporizadores) {

    if (toast.dataset.cerrando === 'true') {
        return;
    }

    toast.dataset.cerrando = 'true';

    temporizadores.forEach(t => clearTimeout(t));

    toast.classList.add('zof-saliendo');

    toast.classList.remove('zof-pausado');

    setTimeout(
        () => toast.remove(),
        280
    );
}


export function showNotification(opciones = {}) {


    const claveTipo =
        CLAVES_TIPO[opciones.type || opciones.tipo] || 'info';

    const definicion =
        DEFINICIONES[claveTipo];

    const duracion =
        Number(opciones.duration) > 0
            ? Number(opciones.duration)
            : CONFIG_NOTIFICACIONES.duraciones[claveTipo];

    const destino =
        asegurarContenedor();


    // Límite simultáneo: las más antiguas se retiran.
    while (
        destino.children.length >=
        CONFIG_NOTIFICACIONES.maximoVisible
    ) {
        destino.firstElementChild.remove();
    }


    const toast =
        document.createElement('div');

    toast.className = 'zofranca-toast';

    toast.style.setProperty('--zof-color', definicion.color);

    toast.setAttribute('role', definicion.rol);


    const titulo =
        opciones.title || opciones.titulo || definicion.titulo;

    const mensaje =
        opciones.message ||
        opciones.mensaje ||
        '';

    const temporalizadores = [];


    toast.innerHTML = `

        <span class="material-symbols-outlined zof-icono" aria-hidden="true">
            ${definicion.icono}
        </span>

        <div class="zof-contenido">

            <p class="zof-titulo"></p>

            ${mensaje ? '<p class="zof-mensaje"></p>' : ''}

        </div>

        <button
            type="button"
            class="zof-cerrar"
            aria-label="Cerrar notificación"
        >
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        <span class="zof-progreso" aria-hidden="true"></span>

    `;


    toast.querySelector('.zof-titulo').textContent = titulo;

    if (mensaje) {

        toast.querySelector('.zof-mensaje').textContent = mensaje;
    }


    const botonCerrar =
        toast.querySelector('.zof-cerrar');

    botonCerrar.addEventListener(
        'click',
        () => cerrarToast(toast, temporalizadores)
    );


    // Barra de progreso sincronizada con la duración.

    const progreso =
        toast.querySelector('.zof-progreso');

    progreso.style.animation =
        `zofranca-progreso ${duracion}ms linear forwards`;


    // Pausa al pasar el cursor / foco (no se va mientras
    // el usuario la está leyendo).

    function pausar() {

        toast.classList.add('zof-pausado');

        const restante =
            duracion - (Date.now() - inicio);

        temporizadores.forEach(t => clearTimeout(t));

        temporizadores.length = 0;

        toast.dataset.restante = String(Math.max(restante, 600));
    }


    function reanudar() {

        if (toast.dataset.cerrando === 'true') {
            return;
        }

        toast.classList.remove('zof-pausado');

        const restante =
            Number(toast.dataset.restante) || duracion;

        temporizadores.push(

            setTimeout(
                () => cerrarToast(toast, temporizadores),
                restante
            )
        );
    }


    let inicio = Date.now();

    toast.addEventListener('mouseenter', pausar);
    toast.addEventListener('mouseleave', reanudar);


    temporizadores.push(

        setTimeout(
            () => cerrarToast(toast, temporalizadores),
            duracion
        )
    );


    destino.appendChild(toast);

    vaciarColaSiCorresponde();

    return toast;
}


function vaciarColaSiCorresponde() {
    /* Reservado para futuras políticas de visualización. */
}


// Compatibilidad con las llamadas existentes:
// mostrarToast(mensaje, tipo, duracionMs)

export function mostrarToast(mensaje, tipo = 'info', duracionMs) {

    return showNotification({
        type: tipo,
        message: mensaje,
        duration: duracionMs
    });
}


// ==========================================
// CONFIRMACIÓN SIN BLOQUEAR
// Reemplazo propio de confirm() nativo.
// Devuelve Promise<boolean>.
// ==========================================

export function mostrarConfirmacion(opciones = {}) {

    asegurarContenedor();

    return new Promise(resolver => {

        const elementoPrevio =
            document.activeElement;

        const overlay =
            document.createElement('div');

        overlay.className = 'zofranca-modal-overlay';

        overlay.setAttribute('role', 'dialog');

        overlay.setAttribute('aria-modal', 'true');

        const idTitulo =
            'zof-titulo-' + Date.now();

        overlay.setAttribute('aria-labelledby', idTitulo);


        const peligro =
            Boolean(opciones.peligro);

        const titulo =
            opciones.titulo ||
            opciones.title ||
            '¿Confirmar acción?';

        const descripcion =
            opciones.mensaje ||
            opciones.message ||
            'Esta acción se aplicará de inmediato.';

        const textoConfirmar =
            opciones.textoConfirmar || 'Confirmar';

        const textoCancelar =
            opciones.textoCancelar || 'Cancelar';

        const iconoModal =
            peligro ? 'delete_forever' : 'help';


        overlay.innerHTML = `

            <div class="zofranca-modal-caja">

                <span class="zofranca-modal-icono${peligro ? ' peligro' : ''}" aria-hidden="true">
                    <span class="material-symbols-outlined">${iconoModal}</span>
                </span>

                <h3 class="zofranca-modal-titulo" id="${idTitulo}"></h3>

                <p class="zofranca-modal-descripcion"></p>

                <div class="zofranca-modal-acciones">

                    <button type="button" class="zofranca-boton-secundario" data-zof-cancelar></button>

                    <button type="button" class="zofranca-boton-primario${peligro ? ' peligro' : ''}" data-zof-confirmar></button>

                </div>

            </div>

        `;


        overlay.querySelector('.zofranca-modal-titulo').textContent = titulo;

        overlay.querySelector('.zofranca-modal-descripcion').textContent = descripcion;

        overlay.querySelector('[data-zof-cancelar]').textContent = textoCancelar;

        overlay.querySelector('[data-zof-confirmar]').textContent = textoConfirmar;


        function finalizar(resultado) {

            document.removeEventListener('keydown', alTeclar);

            overlay.classList.remove('visible');

            setTimeout(() => overlay.remove(), 220);

            if (
                elementoPrevio &&
                typeof elementoPrevio.focus === 'function'
            ) {
                elementoPrevio.focus();
            }

            resolver(resultado);
        }


        function alTeclar(evento) {

            if (evento.key === 'Escape') {
                evento.stopPropagation();
                finalizar(false);
                return;
            }

            if (evento.key !== 'Tab') {
                return;
            }

            const enfocables = Array.from(
                overlay.querySelectorAll('button')
            );

            const primero = enfocables[0];

            const ultimo = enfocables[enfocables.length - 1];

            if (
                evento.shiftKey &&
                document.activeElement === primero
            ) {
                evento.preventDefault();
                ultimo.focus();
                return;
            }

            if (
                !evento.shiftKey &&
                document.activeElement === ultimo
            ) {
                evento.preventDefault();
                primero.focus();
            }
        }


        overlay.querySelector('[data-zof-cancelar]')
            .addEventListener('click', () => finalizar(false));

        overlay.querySelector('[data-zof-confirmar]')
            .addEventListener('click', () => finalizar(true));


        overlay.addEventListener('click', evento => {

            if (evento.target === overlay) {
                finalizar(false);
            }
        });


        document.addEventListener('keydown', alTeclar);

        document.body.appendChild(overlay);

        requestAnimationFrame(() =>
            overlay.classList.add('visible')
        );

        overlay.querySelector('[data-zof-confirmar]').focus();
    });
}


// ==========================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================

if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        () => {
            asegurarContenedor();
            vaciarColaPendiente();
        }
    );

} else {

    asegurarContenedor();
    vaciarColaPendiente();
}
