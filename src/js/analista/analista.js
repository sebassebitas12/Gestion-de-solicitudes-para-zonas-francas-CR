// ==========================================
// RRHH IA - PANEL DEL ANALISTA
// ==========================================

import { getSesion, logout } from '../../services/auth.service.js';
import { fetchAPI } from '../../services/api.js';


// ==========================================
// SESIÓN
// ==========================================

const sesion = getSesion();


// ==========================================
// PROTECCIÓN DE LA PÁGINA
// ==========================================

if (!sesion) {

    window.location.href = '../login.html';

}

if (sesion && sesion.rol !== 'analista') {

    logout();

    window.location.href = '../login.html';

}


// ==========================================
// ESTADO LOCAL
// ==========================================

let solicitudes = [];

let solicitudesPendientes = [];

let alertas = [];

let historial = [];


// ==========================================
// ELEMENTOS
// ==========================================

const tbodySolicitudes =
    document.getElementById('tbodySolicitudes');

const activityList =
    document.getElementById('activityList');

const companiesList =
    document.getElementById('companiesList');


// ==========================================
// UTILIDADES
// ==========================================

function escapeHTML(value) {

    if (value === null || value === undefined) {

        return '';

    }

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

}


function obtenerIniciales(nombre) {

    if (!nombre) {

        return 'AN';

    }

    const partes = nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2);

    return partes
        .map(parte => parte.charAt(0).toUpperCase())
        .join('');

}


function formatearMoneda(valor) {

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(valor || 0);

}


function formatearFecha(fecha) {

    if (!fecha) {

        return '-';

    }

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {

        return fecha;

    }

    return fechaObj.toLocaleDateString('es-CR', {

        day: '2-digit',

        month: 'short',

        year: 'numeric'

    });

}


function obtenerEstadoSolicitud(solicitud) {

    if (solicitud.estadoHumano) {

        return solicitud.estadoHumano;

    }

    if (solicitud.estado === 'pendiente') {

        return 'Pendiente';

    }

    if (solicitud.estado === 'aprobada') {

        return 'Aprobada';

    }

    if (solicitud.estado === 'rechazada') {

        return 'Rechazada';

    }

    return 'Pendiente';

}


function obtenerClaseEstado(estado) {

    const normalizado =
        String(estado || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    if (
        normalizado.includes('aprob')
        || normalizado.includes('recomend')
    ) {

        return 'status-approved';

    }

    if (
        normalizado.includes('revis')
    ) {

        return 'status-review';

    }

    if (
        normalizado.includes('rechaz')
    ) {

        return 'status-rejected';

    }

    return 'status-pending';

}


function obtenerClasePuntaje(puntaje) {

    if (puntaje >= 75) {

        return 'score-high';

    }

    if (puntaje >= 50) {

        return 'score-medium';

    }

    return 'score-low';

}


function tiempoRelativo(fecha) {

    if (!fecha) {

        return '';

    }

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {

        return '';

    }

    const ahora = new Date();

    const diferencia =
        Math.max(0, ahora - fechaObj);

    const minutos =
        Math.floor(diferencia / 60000);

    if (minutos < 60) {

        return `Hace ${Math.max(1, minutos)} min`;

    }

    const horas =
        Math.floor(minutos / 60);

    if (horas < 24) {

        return `Hace ${horas} h`;

    }

    const dias =
        Math.floor(horas / 24);

    if (dias === 1) {

        return 'Ayer';

    }

    return `Hace ${dias} días`;

}


// ==========================================
// CARGAR INFORMACIÓN DEL USUARIO
// ==========================================

function cargarUsuario() {

    if (!sesion) {

        return;

    }

    const nombre =
        sesion.nombre || 'Analista';

    const iniciales =
        obtenerIniciales(nombre);

    const sidebarNombre =
        document.getElementById('sidebarNombre');

    const sidebarRol =
        document.getElementById('sidebarRol');

    const sidebarAvatar =
        document.getElementById('sidebarAvatar');

    const welcomeTitle =
        document.getElementById('welcomeTitle');

    if (sidebarNombre) {

        sidebarNombre.textContent = nombre;

    }

    if (sidebarRol) {

        sidebarRol.textContent = 'Analista';

    }

    if (sidebarAvatar) {

        sidebarAvatar.textContent = iniciales;

    }

    if (welcomeTitle) {

        const primerNombre =
            nombre.split(' ')[0];

        const hora =
            new Date().getHours();

        let saludo = 'Buenos días';

        if (hora >= 12 && hora < 19) {

            saludo = 'Buenas tardes';

        } else if (hora >= 19) {

            saludo = 'Buenas noches';

        }

        welcomeTitle.textContent =
            `${saludo}, ${primerNombre}`;

    }

}


// ==========================================
// CARGAR SOLICITUDES
// ==========================================

async function cargarSolicitudes() {

    try {

        solicitudes =
            await fetchAPI('/solicitudes');

        solicitudesPendientes =
            solicitudes.filter(
                solicitud =>
                    solicitud.estado === 'pendiente'
            );

        renderMetricas();

        renderSolicitudes();

        renderEmpresas();

    } catch (error) {

        console.error(
            'Error cargando solicitudes:',
            error
        );

        if (tbodySolicitudes) {

            tbodySolicitudes.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-cell">
                        No se pudieron cargar las solicitudes.
                    </td>
                </tr>
            `;

        }

    }

}


// ==========================================
// MÉTRICAS
// ==========================================

function renderMetricas() {

    const pendientes =
        solicitudes.filter(
            solicitud =>
                solicitud.estado === 'pendiente'
        ).length;

    const revision =
        solicitudes.filter(
            solicitud =>
                String(solicitud.clasificacionIA || '')
                    .toLowerCase() === 'revisar'
        ).length;

    const aprobadas =
        solicitudes.filter(
            solicitud =>
                solicitud.estado === 'aprobada'
        ).length;

    const metricPendientes =
        document.getElementById('metricPendientes');

    const metricRevision =
        document.getElementById('metricRevision');

    const metricAprobadas =
        document.getElementById('metricAprobadas');

    const metricAtencion =
        document.getElementById('metricAtencion');

    if (metricPendientes) {

        metricPendientes.textContent =
            pendientes;

    }

    if (metricRevision) {

        metricRevision.textContent =
            revision;

    }

    if (metricAprobadas) {

        metricAprobadas.textContent =
            aprobadas;

    }

    if (metricAtencion) {

        metricAtencion.textContent =
            alertas.length;

    }

}


// ==========================================
// TABLA DE SOLICITUDES
// ==========================================

function renderSolicitudes(filtro = '') {

    if (!tbodySolicitudes) {

        return;

    }

    const texto =
        filtro.trim().toLowerCase();

    let datos =
        solicitudesPendientes;

    if (texto) {

        datos =
            datos.filter(solicitud => {

                const contenido = [

                    solicitud.id,

                    solicitud.empresa,

                    solicitud.sector,

                    solicitud.clasificacionIA,

                    solicitud.estadoHumano

                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                return contenido.includes(texto);

            });

    }


    if (datos.length === 0) {

        tbodySolicitudes.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell">
                    No hay solicitudes pendientes.
                </td>
            </tr>
        `;

        return;

    }


    tbodySolicitudes.innerHTML = '';


    datos.forEach(solicitud => {

        const estado =
            obtenerEstadoSolicitud(solicitud);

        const estadoClase =
            obtenerClaseEstado(estado);

        const puntaje =
            Number(solicitud.puntajeIA || 0);

        const scoreClase =
            obtenerClasePuntaje(puntaje);

        const fila =
            document.createElement('tr');


        fila.innerHTML = `

            <td>
                ${escapeHTML(solicitud.id)}
            </td>

            <td>
                ${escapeHTML(solicitud.empresa || 'Sin empresa')}
            </td>

            <td>
                ${escapeHTML(solicitud.sector || 'Sin sector')}
            </td>

            <td>

                <span class="score-badge ${scoreClase}">
                    ${puntaje}
                </span>

            </td>

            <td>
                ${escapeHTML(
                    formatearFecha(solicitud.fecha)
                )}
            </td>

            <td>

                <span class="status-badge ${estadoClase}">

                    <span class="status-dot"></span>

                    ${escapeHTML(estado)}

                </span>

            </td>

            <td>

                <button
                    class="table-action"
                    type="button"
                    title="Ver solicitud"
                    data-id="${escapeHTML(solicitud.id)}"
                >

                    <span class="material-symbols-outlined">
                        visibility
                    </span>

                </button>

            </td>

        `;


        const button =
            fila.querySelector('.table-action');


        button.addEventListener(
            'click',
            () => abrirSolicitud(solicitud.id)
        );


        tbodySolicitudes.appendChild(fila);

    });

}


// ==========================================
// EMPRESAS CON SOLICITUDES PENDIENTES
// ==========================================

function renderEmpresas() {

    if (!companiesList) {

        return;

    }

    const agrupadas =
        new Map();


    solicitudesPendientes.forEach(solicitud => {

        const empresa =
            solicitud.empresa || 'Empresa sin nombre';

        if (!agrupadas.has(empresa)) {

            agrupadas.set(
                empresa,
                {
                    empresa,
                    sector: solicitud.sector || 'Sin sector',
                    cantidad: 0,
                    prioridadAlta: false
                }
            );

        }

        const registro =
            agrupadas.get(empresa);

        registro.cantidad++;

        if (
            Number(solicitud.puntajeIA || 0) < 50
        ) {

            registro.prioridadAlta = true;

        }

    });


    companiesList.innerHTML = '';


    if (agrupadas.size === 0) {

        companiesList.innerHTML = `
            <div class="activity-loading">
                No hay empresas con solicitudes pendientes.
            </div>
        `;

        return;

    }


    Array.from(agrupadas.values())
        .slice(0, 5)
        .forEach(registro => {

            const iniciales =
                obtenerIniciales(registro.empresa);

            const item =
                document.createElement('div');

            item.className =
                'company-item';


            item.innerHTML = `

                <div class="company-info">

                    <div class="company-avatar">
                        ${escapeHTML(iniciales)}
                    </div>

                    <div>

                        <p class="company-name">
                            ${escapeHTML(registro.empresa)}
                        </p>

                        <p class="company-sector">
                            Sector: ${escapeHTML(registro.sector)}
                        </p>

                    </div>

                </div>


                <span class="company-status ${
                    registro.prioridadAlta
                        ? 'priority'
                        : ''
                }">

                    ${
                        registro.prioridadAlta
                            ? 'Prioridad alta'
                            : `${registro.cantidad} ${
                                registro.cantidad === 1
                                    ? 'solicitud'
                                    : 'solicitudes'
                            }`
                    }

                </span>

            `;


            companiesList.appendChild(item);

        });

}


// ==========================================
// CARGAR ALERTAS
// ==========================================

async function cargarAlertas() {

    try {

        alertas =
            await fetchAPI('/alertas');

        renderMetricas();

        const notificationDot =
            document.getElementById('notificationDot');

        if (notificationDot) {

            notificationDot.style.display =
                alertas.length > 0
                    ? 'block'
                    : 'none';

        }

    } catch (error) {

        console.error(
            'Error cargando alertas:',
            error
        );

        alertas = [];

        renderMetricas();

    }

}


// ==========================================
// CARGAR HISTORIAL
// ==========================================

async function cargarHistorial() {

    try {

        historial =
            await fetchAPI('/historial');

        renderActividad();

    } catch (error) {

        console.error(
            'Error cargando historial:',
            error
        );

        if (activityList) {

            activityList.innerHTML = `
                <div class="activity-loading">
                    No se pudo cargar la actividad.
                </div>
            `;

        }

    }

}


// ==========================================
// ACTIVIDAD
// ==========================================

function renderActividad() {

    if (!activityList) {

        return;

    }

    const datos =
        [...historial]
            .sort(
                (a, b) =>
                    new Date(b.fecha) -
                    new Date(a.fecha)
            )
            .slice(0, 5);


    activityList.innerHTML = '';


    if (datos.length === 0) {

        activityList.innerHTML = `
            <div class="activity-loading">
                No hay actividad reciente.
            </div>
        `;

        return;

    }


    datos.forEach(item => {

        const activity =
            document.createElement('div');

        activity.className =
            'activity-item';


        let icono = 'history';

        let claseIcono = '';

        const tipo =
            String(item.tipo || '')
                .toLowerCase();

        const accion =
            String(item.accion || '')
                .toLowerCase();


        if (tipo === 'decision') {

            if (accion.includes('aprob')) {

                icono = 'check_circle';

                claseIcono = 'success';

            } else if (accion.includes('rechaz')) {

                icono = 'cancel';

                claseIcono = 'alert';

            } else {

                icono = 'gavel';

            }

        } else if (tipo === 'evaluacion') {

            icono = 'auto_awesome';

        } else if (tipo === 'alerta') {

            icono = 'warning';

            claseIcono = 'alert';

        }


        activity.innerHTML = `

            <div class="activity-icon ${claseIcono}">

                <span class="material-symbols-outlined">
                    ${icono}
                </span>

            </div>


            <div class="activity-content">

                <strong>
                    ${escapeHTML(
                        item.accion || 'Actividad'
                    )}
                </strong>

                <p>
                    ${escapeHTML(
                        item.descripcion || ''
                    )}
                </p>

                <span class="activity-time">
                    ${tiempoRelativo(item.fecha)}
                </span>

            </div>

        `;


        activityList.appendChild(activity);

    });

}


// ==========================================
// MODAL
// ==========================================

async function abrirSolicitud(id) {

    try {

        const solicitud =
            await fetchAPI(
                `/solicitudes/${encodeURIComponent(id)}`
            );


        document.getElementById(
            'modalSolicitudId'
        ).textContent =
            solicitud.id || '-';


        document.getElementById(
            'modalEmpresa'
        ).textContent =
            solicitud.empresa || '-';


        document.getElementById(
            'modalSector'
        ).textContent =
            solicitud.sector || '-';


        document.getElementById(
            'modalInversion'
        ).textContent =
            formatearMoneda(
                solicitud.inversion
            );


        document.getElementById(
            'modalEmpleos'
        ).textContent =
            solicitud.empleos || 0;


        document.getElementById(
            'modalPuntaje'
        ).textContent =
            solicitud.puntajeIA ?? '-';


        document.getElementById(
            'modalClasificacion'
        ).textContent =
            solicitud.clasificacionIA || '-';


        document.getElementById(
            'modalJustificacion'
        ).textContent =
            solicitud.justificacionIA ||
            'No existe una justificación registrada para esta solicitud.';


        const modal =
            document.getElementById(
                'solicitudModal'
            );


        modal.classList.remove('hidden');


    } catch (error) {

        console.error(
            'Error cargando solicitud:',
            error
        );

    }

}


// ==========================================
// CERRAR MODAL
// ==========================================

function cerrarModal() {

    const modal =
        document.getElementById(
            'solicitudModal'
        );

    if (modal) {

        modal.classList.add('hidden');

    }

}


// ==========================================
// BÚSQUEDA
// ==========================================

function configurarBusqueda() {

    const input =
        document.getElementById(
            'searchGlobal'
        );

    if (!input) {

        return;

    }


    input.addEventListener(
        'input',
        event => {

            renderSolicitudes(
                event.target.value
            );

        }
    );

}


// ==========================================
// CERRAR SESIÓN
// ==========================================

function configurarLogout() {

    const button =
        document.getElementById(
            'btnLogout'
        );

    if (!button) {

        return;

    }


    button.addEventListener(
        'click',
        () => {

            const confirmar =
                window.confirm(
                    '¿Está seguro de que desea cerrar sesión?'
                );

            if (!confirmar) {

                return;

            }

            logout();

            window.location.href =
                '../login.html';

        }
    );

}


// ==========================================
// NAVEGACIÓN VISUAL
// ==========================================

function configurarNavegacion() {

    const navSolicitudes =
        document.getElementById(
            'navSolicitudes'
        );

    const btnVerSolicitudes =
        document.getElementById(
            'btnVerSolicitudes'
        );

    const quickSolicitudes =
        document.getElementById(
            'quickSolicitudes'
        );


    const acciones = [

        navSolicitudes,

        btnVerSolicitudes,

        quickSolicitudes

    ];


    acciones.forEach(elemento => {

        if (!elemento) {

            return;

        }


        elemento.addEventListener(
            'click',
            event => {

                event.preventDefault();

                document
                    .querySelector('.requests-panel')
                    ?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

            }
        );

    });

}


// ==========================================
// MODAL EVENTS
// ==========================================

function configurarModal() {

    const closeButton =
        document.getElementById(
            'btnCloseModal'
        );

    const closeFooter =
        document.getElementById(
            'btnCloseModalFooter'
        );

    const modal =
        document.getElementById(
            'solicitudModal'
        );


    closeButton?.addEventListener(
        'click',
        cerrarModal
    );


    closeFooter?.addEventListener(
        'click',
        cerrarModal
    );


    modal?.addEventListener(
        'click',
        event => {

            if (
                event.target === modal
            ) {

                cerrarModal();

            }

        }
    );


    document.addEventListener(
        'keydown',
        event => {

            if (event.key === 'Escape') {

                cerrarModal();

            }

        }
    );

}


// ==========================================
// INICIALIZACIÓN
// ==========================================

async function inicializar() {

    cargarUsuario();

    configurarLogout();

    configurarBusqueda();

    configurarNavegacion();

    configurarModal();


    await Promise.all([

        cargarSolicitudes(),

        cargarAlertas(),

        cargarHistorial()

    ]);

}


// ==========================================
// DOM READY
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    inicializar
);