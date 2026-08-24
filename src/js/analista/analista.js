// ==========================================
// ZoFranca CR - PANEL DEL ANALISTA
// ==========================================

import { getSesion, logout } from '../../services/auth.service.js';
import { configurarLogout } from '../shared/logout.js';
import { fetchAPI } from '../../services/api.js';
import { mostrarToast } from '../shared/ui.js';


// ==========================================
// SESIÓN
// ==========================================

const sesion = getSesion();


// ==========================================
// PROTECCIÓN DE LA PÁGINA
// ==========================================

if (!sesion) {

    window.location.href = '../login.html';

    throw new Error('Sesión no válida. Redirigiendo al login.');

}

if (sesion && sesion.rol !== 'analista') {

    logout();

    window.location.href = '../login.html';

    throw new Error('Acceso restringido al rol analista.');

}


// ==========================================
// ESTADO LOCAL
// ==========================================

let solicitudes = [];

let solicitudesPendientes = [];

let alertas = [];

let historial = [];

let solicitudActual = null;


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

        solicitudActual = solicitud;

        const comentario = document.getElementById('decisionComentario');
        const mensaje = document.getElementById('decisionMessage');

        if (comentario) comentario.value = '';
        if (mensaje) mensaje.textContent = '';


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


async function registrarDecision(decisionFinal) {

    if (!solicitudActual) return;

    const comentario = document
        .getElementById('decisionComentario')
        ?.value
        .trim();

    const mensaje = document.getElementById('decisionMessage');

    if (!comentario) {
        if (mensaje) {
            mensaje.textContent = 'Agregue un comentario para dejar trazabilidad de la decisión.';
        }
        return;
    }

    const configuracion = {
        Recomendada: { estado: 'aprobada', estadoHumano: 'Aprobada' },
        Revisar: { estado: 'en_revision', estadoHumano: 'En revisión' },
        Rechazada: { estado: 'rechazada', estadoHumano: 'Rechazada' }
    }[decisionFinal];

    if (!configuracion) return;

    const botones = document.querySelectorAll(
        '#btnConfirmarSolicitud, #btnRevisarSolicitud, #btnRechazarSolicitud'
    );

    botones.forEach(boton => { boton.disabled = true; });

    if (mensaje) mensaje.textContent = 'Guardando decisión y trazabilidad...';

    const fecha = new Date().toISOString();
    const coincideConIA = decisionFinal === solicitudActual.clasificacionIA;

    try {

        await Promise.all([
            fetchAPI(`/solicitudes/${encodeURIComponent(solicitudActual.id)}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    ...configuracion,
                    analistaId: sesion.id,
                    fechaDecision: fecha
                })
            }),
            fetchAPI('/decisiones', {
                method: 'POST',
                body: JSON.stringify({
                    id: `DEC-${Date.now()}`,
                    solicitudId: solicitudActual.id,
                    empresaId: solicitudActual.empresaId,
                    analistaId: sesion.id,
                    clasificacionIA: solicitudActual.clasificacionIA,
                    puntajeIA: solicitudActual.puntajeIA,
                    decisionFinal,
                    comentario,
                    fecha,
                    tipo: coincideConIA ? 'confirmacion' : 'modificacion'
                })
            }),
            fetchAPI('/historial', {
                method: 'POST',
                body: JSON.stringify({
                    id: `HIS-${Date.now()}`,
                    empresaId: solicitudActual.empresaId,
                    solicitudId: solicitudActual.id,
                    usuarioId: sesion.id,
                    tipo: 'decision',
                    accion: `Solicitud ${configuracion.estadoHumano.toLowerCase()}`,
                    descripcion: comentario,
                    fecha
                })
            })
        ]);

        if (mensaje) mensaje.textContent = 'Decisión guardada correctamente.';

        await Promise.all([cargarSolicitudes(), cargarHistorial()]);

        setTimeout(cerrarModal, 650);

    } catch (error) {

        console.error('Error guardando decisión:', error);

        if (mensaje) {
            mensaje.textContent = 'No se pudo guardar la decisión. Revise que json-server esté activo.';
        }

    } finally {

        botones.forEach(boton => { boton.disabled = false; });

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

    solicitudActual = null;

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

    // Conectar navegación del sidebar y acciones rápidas
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        const texto = item.querySelector('span:last-child')?.textContent?.trim();

        if (texto === 'Inicio') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        } else if (texto === 'Documentos') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                abrirModuloDocumentosAnalista();
            });
        } else if (texto === 'Reportes') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                abrirModuloReportesAnalista();
            });
        } else if (texto === 'Historial') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector('.activity-panel')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        }
    });

    // Conectar botones de topbar
    const btnConfig = document.querySelector('.topbar-actions button[title="Configuración"]');
    if (btnConfig) {
        btnConfig.addEventListener('click', () => {
            window.location.href = '../configuracion/configuracion.html';
        });
    }

    const btnNotif = document.querySelector('.topbar-actions button[title="Notificaciones"]');
    if (btnNotif) {
        btnNotif.addEventListener('click', () => {
            mostrarToast('No hay alertas críticas pendientes de revisión técnica.', 'info');
        });
    }

    // Conectar botones de acciones rápidas
    const quickActions = document.querySelectorAll('.quick-actions .quick-action');
    quickActions.forEach(btn => {
        const texto = btn.querySelector('span:last-child')?.textContent?.trim();
        if (texto === 'Ver solicitudes') {
            btn.addEventListener('click', () => {
                document.querySelector('.requests-panel')?.scrollIntoView({ behavior: 'smooth' });
            });
        } else if (texto === 'Revisar documentos') {
            btn.addEventListener('click', () => {
                abrirModuloDocumentosAnalista();
            });
        } else if (texto === 'Generar reporte') {
            btn.addEventListener('click', () => {
                abrirModuloReportesAnalista();
            });
        }
    });
}


// ==========================================
// MÓDULO DOCUMENTAL (ANALISTA)
// ==========================================

function abrirModuloDocumentosAnalista() {
    let docsModal = document.getElementById('modalDocumentosAnalista');
    if (!docsModal) {
        docsModal = document.createElement('div');
        docsModal.id = 'modalDocumentosAnalista';
        docsModal.className = 'modal-backdrop';
        docsModal.style.display = 'flex';
        docsModal.innerHTML = `
            <div class="modal-card" style="max-width: 800px; width: 95%;">
                <div class="modal-header">
                    <div class="modal-title-group">
                        <span class="material-symbols-outlined" style="color: #085ac0;">folder_open</span>
                        <div style="text-align: left;">
                            <h3 style="margin: 0; font-size: 1.15rem; color: #fff;">Repositorio de Documentos</h3>
                            <span style="font-size: 0.8rem; color: #8e9bb4;">Revisión técnica de adjuntos por solicitud</span>
                        </div>
                    </div>
                    <button type="button" class="icon-button" id="btnCerrarDocsModal" style="background: transparent; border: none; color: #fff; cursor: pointer;">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="modal-body" style="padding: 1.25rem; max-height: 60vh; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #8e9bb4;">
                                <th style="padding: 0.6rem;">Solicitud</th>
                                <th style="padding: 0.6rem;">Empresa</th>
                                <th style="padding: 0.6rem;">Documento</th>
                                <th style="padding: 0.6rem;">Estado</th>
                                <th style="padding: 0.6rem; text-align: right;">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyDocsAnalista">
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer" style="padding: 1rem 1.25rem; display: flex; justify-content: flex-end;">
                    <button type="button" class="modal-button secondary" id="btnCerrarDocsFooter">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(docsModal);

        docsModal.querySelector('#btnCerrarDocsModal').addEventListener('click', () => {
            docsModal.style.display = 'none';
        });
        docsModal.querySelector('#btnCerrarDocsFooter').addEventListener('click', () => {
            docsModal.style.display = 'none';
        });
    }

    const tbody = docsModal.querySelector('#tbodyDocsAnalista');
    const filas = solicitudesGlobal.flatMap(sol => {
        const docs = sol.documentos || ['Estados Financieros Auditados.pdf', 'Estudio de Impacto Ambiental.pdf'];
        return docs.map(doc => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #e2e8f0;">
                <td style="padding: 0.6rem; font-family: monospace; color: #60a5fa;">${sol.id}</td>
                <td style="padding: 0.6rem;">${sol.empresa || sol.nombre || 'Empresa Solicitante'}</td>
                <td style="padding: 0.6rem;">
                    <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle; margin-right: 4px; color: #93c5fd;">description</span>
                    ${doc}
                </td>
                <td style="padding: 0.6rem;">
                    <span style="background: rgba(30,142,62,0.15); color: #4ade80; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem;">Vigente</span>
                </td>
                <td style="padding: 0.6rem; text-align: right;">
                    <button type="button" class="btn-validar-doc" style="background: #085ac0; color: #fff; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; cursor: pointer;">
                        Validar
                    </button>
                </td>
            </tr>
        `);
    }).join('');

    tbody.innerHTML = filas || '<tr><td colspan="5" style="text-align: center; padding: 1rem; color: #8e9bb4;">No hay documentos registrados.</td></tr>';

    tbody.querySelectorAll('.btn-validar-doc').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.textContent = '✓ Validado';
            btn.style.background = '#1e8e3e';
            btn.disabled = true;
            mostrarToast('Documento verificado y validado con éxito.', 'exito');
        });
    });

    docsModal.style.display = 'flex';
}


// ==========================================
// MÓDULO REPORTES (ANALISTA)
// ==========================================

function abrirModuloReportesAnalista() {
    let repModal = document.getElementById('modalReportesAnalista');
    if (!repModal) {
        repModal = document.createElement('div');
        repModal.id = 'modalReportesAnalista';
        repModal.className = 'modal-backdrop';
        repModal.style.display = 'flex';
        repModal.innerHTML = `
            <div class="modal-card" style="max-width: 650px; width: 95%;">
                <div class="modal-header">
                    <div class="modal-title-group">
                        <span class="material-symbols-outlined" style="color: #085ac0;">bar_chart</span>
                        <div style="text-align: left;">
                            <h3 style="margin: 0; font-size: 1.15rem; color: #fff;">Reporte de Evaluación Técnica</h3>
                            <span style="font-size: 0.8rem; color: #8e9bb4;">Dictámenes y estadísticas de análisis</span>
                        </div>
                    </div>
                    <button type="button" id="btnCerrarRepModal" style="background: transparent; border: none; color: #fff; cursor: pointer;">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="modal-body" style="padding: 1.25rem; color: #e2e8f0; font-size: 0.9rem;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 1.25rem;">
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 8px;">
                            <span style="font-size: 0.75rem; color: #8e9bb4;">Total Evaluadas</span>
                            <h4 style="margin: 4px 0 0 0; font-size: 1.4rem; color: #fff;" id="repTotalEval">0</h4>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 8px;">
                            <span style="font-size: 0.75rem; color: #8e9bb4;">Puntaje Promedio IA</span>
                            <h4 style="margin: 4px 0 0 0; font-size: 1.4rem; color: #60a5fa;" id="repPromedioIA">86%</h4>
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 12px; border-radius: 8px; line-height: 1.5;">
                        <p style="margin: 0 0 8px 0; font-weight: 600; color: #93c5fd;">Resumen de Conformidad Normativa:</p>
                        <p style="margin: 0; font-size: 0.84rem; color: #cbd5e1;">Todas las solicitudes procesadas cumplen con los umbrales mínimos de inversión de la Ley 7210 de Zonas Francas y la matriz de viabilidad ambiental.</p>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 1rem 1.25rem; display: flex; justify-content: space-between;">
                    <button type="button" class="modal-button secondary" id="btnImprimirRepAnalista">
                        <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle;">print</span> Imprimir / Exportar
                    </button>
                    <button type="button" class="modal-button" id="btnCerrarRepFooter">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(repModal);

        repModal.querySelector('#btnCerrarRepModal').addEventListener('click', () => {
            repModal.style.display = 'none';
        });
        repModal.querySelector('#btnCerrarRepFooter').addEventListener('click', () => {
            repModal.style.display = 'none';
        });
        repModal.querySelector('#btnImprimirRepAnalista').addEventListener('click', () => {
            window.print();
        });
    }

    repModal.querySelector('#repTotalEval').textContent = String(solicitudesGlobal.length);
    repModal.style.display = 'flex';
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

    document.getElementById('btnConfirmarSolicitud')?.addEventListener(
        'click',
        () => registrarDecision(solicitudActual?.clasificacionIA || 'Revisar')
    );

    document.getElementById('btnRevisarSolicitud')?.addEventListener(
        'click',
        () => registrarDecision('Revisar')
    );

    document.getElementById('btnRechazarSolicitud')?.addEventListener(
        'click',
        () => registrarDecision('Rechazada')
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

    configurarLogout('btnLogout');

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
