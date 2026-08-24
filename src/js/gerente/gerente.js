import { getSesion, logout } from "../../services/auth.service.js";
import { configurarLogout } from "../shared/logout.js";
import { fetchAPI } from "../../services/api.js";


/* ==========================================
   SESIÓN
========================================== */

const sesion = getSesion();


// Protección básica de la página

if (!sesion) {
    window.location.href = "../login.html";

    throw new Error(
        "Sesión no válida. Redirigiendo al login."
    );
}


// El Gerente debe tener rol de gerente

if (
    sesion &&
    sesion.rol &&
    sesion.rol.toLowerCase() !== "gerente"
) {
    logout();

    window.location.href = "../login.html";

    throw new Error(
        "Acceso restringido al rol gerente."
    );
}


/* ==========================================
   ELEMENTOS
========================================== */

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userAvatar = document.getElementById("userAvatar");

const statSolicitudes = document.getElementById("statSolicitudes");
const statEmpresas = document.getElementById("statEmpresas");
const statTramites = document.getElementById("statTramites");
const statDocumentos = document.getElementById("statDocumentos");

const solicitudesTable =
    document.getElementById("solicitudesTable");

const activityList =
    document.getElementById("activityList");


/* ==========================================
   USUARIO
========================================== */

function cargarUsuario() {

    if (!sesion) {
        return;
    }

    const nombre =
        sesion.nombre ||
        "Gerente";

    const email =
        sesion.email ||
        "gerente@empresa.com";

    if (userName) {
        userName.textContent = nombre;
    }

    if (userEmail) {
        userEmail.textContent = email;
    }

    if (userAvatar) {

        const inicial =
            nombre
                .trim()
                .charAt(0)
                .toUpperCase();

        userAvatar.textContent =
            inicial || "G";
    }
}


/* ==========================================
   SOLICITUDES
========================================== */

let solicitudes = [];


async function cargarSolicitudes() {

    try {

        solicitudes =
            await fetchAPI("/solicitudes");

        if (!Array.isArray(solicitudes)) {
            solicitudes = [];
        }

        renderSolicitudes(solicitudes);

        actualizarEstadisticasSolicitudes();

    } catch (error) {

        console.error(
            "Error cargando solicitudes:",
            error
        );

        renderSolicitudes([]);
    }
}


/* ==========================================
   RENDER TABLA
========================================== */

function renderSolicitudes(data) {

    if (!solicitudesTable) {
        return;
    }

    solicitudesTable.innerHTML = "";

    if (data.length === 0) {

        solicitudesTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    No hay solicitudes disponibles.
                </td>
            </tr>
        `;

        return;
    }


    // Mostrar máximo 5 en el dashboard

    const solicitudesMostrar =
        data.slice(0, 5);


    solicitudesMostrar.forEach(
        (solicitud) => {

            const fila =
                document.createElement("tr");


            const empresa =
                solicitud.empresa ||
                solicitud.organizacion ||
                "Empresa sin nombre";


            const tipo =
                solicitud.tipo ||
                solicitud.tipoSolicitud ||
                "Solicitud";


            const puntaje =
                Number(
                    solicitud.puntajeIA ||
                    solicitud.scoreIA ||
                    0
                );


            const estado =
                solicitud.estadoHumano ||
                solicitud.estado ||
                solicitud.clasificacionIA ||
                "Pendiente";


            const iniciales =
                obtenerIniciales(empresa);


            const claseScore =
                puntaje < 60
                    ? "low"
                    : "";


            const claseEstado =
                obtenerClaseEstado(estado);


            fila.innerHTML = `

                <td>

                    <div class="company-cell">

                        <div class="company-avatar">
                            ${iniciales}
                        </div>

                        <span class="company-name">
                            ${escaparHTML(empresa)}
                        </span>

                    </div>

                </td>


                <td>
                    ${escaparHTML(tipo)}
                </td>


                <td>

                    <div class="score">

                        <div class="score-track">

                            <div
                                class="score-fill ${claseScore}"
                                style="width:${Math.min(
                                    Math.max(puntaje, 0),
                                    100
                                )}%"
                            ></div>

                        </div>

                        <span
                            class="score-number ${claseScore}"
                        >
                            ${puntaje}%
                        </span>

                    </div>

                </td>


                <td>

                    <span
                        class="status-badge ${claseEstado}"
                    >
                        ${escaparHTML(estado)}
                    </span>

                </td>


                <td>

                    <button
                        class="view-button"
                        title="Ver solicitud"
                        data-id="${solicitud.id}"
                    >

                        <span class="material-symbols-outlined">
                            visibility
                        </span>

                    </button>

                </td>
            `;


            const boton =
                fila.querySelector(
                    ".view-button"
                );


            boton.addEventListener(
                "click",
                () => abrirDetalle(solicitud)
            );


            solicitudesTable.appendChild(
                fila
            );
        }
    );
}


/* ==========================================
   ESTADÍSTICAS
========================================== */

function actualizarEstadisticasSolicitudes() {

    const pendientes =
        solicitudes.filter(
            (solicitud) => {

                const estado = (
                    solicitud.estadoHumano ||
                    solicitud.estado ||
                    ""
                ).toLowerCase();

                return (
                    estado.includes("pendiente") ||
                    estado.includes("revisión") ||
                    estado.includes("revision")
                );
            }
        );


    if (statSolicitudes) {
        statSolicitudes.textContent =
            pendientes.length;
    }
}


/* ==========================================
   CARGAR EMPRESAS
========================================== */

async function cargarEmpresas() {

    try {

        const empresas =
            await fetchAPI("/empresas");

        if (statEmpresas) {

            statEmpresas.textContent =
                Array.isArray(empresas)
                    ? empresas.length
                    : 0;
        }

    } catch (error) {

        console.warn(
            "No se pudieron cargar las empresas:",
            error
        );

        if (statEmpresas) {
            statEmpresas.textContent = "0";
        }
    }
}


/* ==========================================
   CARGAR TRÁMITES
   (Derivado de solicitudes activas)
========================================== */

function cargarTramites() {

    const tramitesActivos =
        solicitudes.filter(
            (solicitud) => {

                const estado =
                    String(
                        solicitud.estado || ""
                    ).toLowerCase();

                return (
                    estado === "pendiente" ||
                    estado === "en_revision" ||
                    estado === "en revisión"
                );
            }
        ).length;


    if (statTramites) {
        statTramites.textContent =
            tramitesActivos;
    }
}


/* ==========================================
   CARGAR DOCUMENTOS
   (Alertas de cumplimiento vigentes)
========================================== */

async function cargarDocumentos() {

    try {

        const alertas =
            await fetchAPI("/alertas");

        if (statDocumentos) {
            statDocumentos.textContent =
                Array.isArray(alertas)
                    ? alertas.length
                    : 0;
        }

    } catch (error) {

        console.warn(
            "No se pudieron cargar las alertas:",
            error
        );

        if (statDocumentos) {
            statDocumentos.textContent = "0";
        }
    }
}


/* ==========================================
   INDICADORES
========================================== */

function cargarIndicadores() {

    const total =
        solicitudes.length;

    const procesadas =
        solicitudes.filter(
            (solicitud) => {

                const estado = (
                    solicitud.estadoHumano ||
                    solicitud.estado ||
                    ""
                ).toLowerCase();

                return (
                    estado.includes("recomendada") ||
                    estado.includes("aprobada") ||
                    estado.includes("rechazada") ||
                    estado.includes("completada")
                );
            }
        ).length;


    const porcentajeProcesadas =
        total > 0
            ? Math.round(
                (procesadas / total) * 100
            )
            : 0;


    const progress =
        document.getElementById(
            "progressProcesadas"
        );


    const procesadasTexto =
        document.getElementById(
            "procesadas"
        );


    if (progress) {

        progress.style.width =
            `${porcentajeProcesadas}%`;
    }


    if (procesadasTexto) {

        procesadasTexto.textContent =
            procesadas;
    }


    const recomendadas =
        solicitudes.filter(
            (solicitud) => {

                const estado = (
                    solicitud.clasificacionIA ||
                    solicitud.estadoHumano ||
                    ""
                ).toLowerCase();

                return estado.includes(
                    "recomendada"
                );
            }
        ).length;


    const porcentajeIA =
        total > 0
            ? Math.round(
                (recomendadas / total) * 100
            )
            : 0;


    const iaTexto =
        document.getElementById(
            "recomendadas"
        );


    const progressIA =
        document.getElementById(
            "progressIA"
        );


    if (iaTexto) {
        iaTexto.textContent =
            `${porcentajeIA}%`;
    }


    if (progressIA) {
        progressIA.style.width =
            `${porcentajeIA}%`;
    }
}


/* ==========================================
   ACTIVIDAD
========================================== */

async function cargarActividad() {

    if (!activityList) {
        return;
    }

    let historial = [];


    try {

        historial =
            await fetchAPI("/historial");

    } catch (error) {

        console.warn(
            "No se pudo cargar el historial.",
            error
        );

    }


    let actividades = [];

    if (
        Array.isArray(historial) &&
        historial.length > 0
    ) {

        actividades = historial
            .map((registro) => ({
                icono:
                    obtenerIconoHistorial(
                        registro.tipo,
                        registro.accion
                    ),
                titulo:
                    registro.accion ||
                    "Actividad registrada",
                detalle:
                    registro.descripcion ||
                    formatearFechaCorta(
                        registro.fecha
                    )
            }))
            .sort(
                (a, b) =>
                    new Date(b.fecha || 0) -
                    new Date(a.fecha || 0)
            );
    }


    if (actividades.length === 0) {

        actividades = [
            {
                icono: "history",
                titulo: "Sin actividad registrada",
                detalle: "Aún no hay movimientos en el sistema"
            }
        ];
    }


    activityList.innerHTML = "";


    actividades
        .slice(0, 4)
        .forEach(
            (actividad) => {

                const elemento =
                    document.createElement(
                        "div"
                    );

                elemento.className =
                    "activity-item";


                elemento.innerHTML = `

                    <div class="activity-icon">

                        <span class="material-symbols-outlined">
                            ${
                                actividad.icono ||
                                "history"
                            }
                        </span>

                    </div>

                    <div class="activity-content">

                        <p>
                            ${escaparHTML(
                                actividad.titulo ||
                                actividad.texto ||
                                "Actividad"
                            )}
                        </p>

                        <small>
                            ${escaparHTML(
                                actividad.detalle ||
                                actividad.tiempo ||
                                "Reciente"
                            )}
                        </small>

                    </div>

                `;


                activityList.appendChild(
                    elemento
                );
            }
        );
}


/* ==========================================
   DETALLE DE SOLICITUD
========================================== */

function abrirDetalle(solicitud) {

    const modal =
        document.getElementById(
            "detailModal"
        );

    const modalBody =
        document.getElementById(
            "modalBody"
        );


    if (!modal || !modalBody) {
        return;
    }


    const empresa =
        solicitud.empresa ||
        solicitud.organizacion ||
        "Sin empresa";


    const tipo =
        solicitud.tipo ||
        solicitud.tipoSolicitud ||
        "Sin especificar";


    const puntaje =
        solicitud.puntajeIA ||
        solicitud.scoreIA ||
        0;


    const estado =
        solicitud.estadoHumano ||
        solicitud.estado ||
        solicitud.clasificacionIA ||
        "Pendiente";


    modalBody.innerHTML = `

        <div class="modal-detail">

            <div>
                <span>
                    Empresa
                </span>

                <strong>
                    ${escaparHTML(empresa)}
                </strong>
            </div>


            <div>
                <span>
                    Tipo de solicitud
                </span>

                <strong>
                    ${escaparHTML(tipo)}
                </strong>
            </div>


            <div>
                <span>
                    Puntaje IA
                </span>

                <strong>
                    ${puntaje}%
                </strong>
            </div>


            <div>
                <span>
                    Estado
                </span>

                <strong>
                    ${escaparHTML(estado)}
                </strong>
            </div>

        </div>
    `;


    modal.classList.remove(
        "hidden"
    );
}


/* ==========================================
   MODAL
========================================== */

function cerrarModal() {

    const modal =
        document.getElementById(
            "detailModal"
        );

    if (modal) {
        modal.classList.add(
            "hidden"
        );
    }
}


/* ==========================================
   NAVEGACIÓN
========================================== */

function configurarNavegacion() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        (item) => {

            item.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    const texto =
                        item
                            .querySelector("span:last-child")
                            ?.textContent
                            ?.trim();


                    if (
                        !texto ||
                        texto === "Inicio"
                    ) {
                        return;
                    }


                    alert(
                        `El módulo "${texto}" estará disponible próximamente.`
                    );

                }
            );
        }
    );
}


/* ==========================================
   BÚSQUEDA
========================================== */

function configurarBusqueda() {

    const input =
        document.getElementById(
            "searchInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        () => {

            const texto =
                input.value
                    .trim()
                    .toLowerCase();


            if (!texto) {

                renderSolicitudes(
                    solicitudes
                );

                return;
            }


            const filtradas =
                solicitudes.filter(
                    (solicitud) => {

                        const empresa =
                            String(
                                solicitud.empresa ||
                                solicitud.organizacion ||
                                ""
                            ).toLowerCase();


                        const tipo =
                            String(
                                solicitud.tipo ||
                                solicitud.tipoSolicitud ||
                                ""
                            ).toLowerCase();


                        return (
                            empresa.includes(
                                texto
                            ) ||
                            tipo.includes(
                                texto
                            )
                        );
                    }
                );


            renderSolicitudes(
                filtradas
            );
        }
    );
}


/* ==========================================
   BOTONES
========================================== */

function configurarBotones() {

    configurarLogout("btnLogout");


    document
        .getElementById("btnMenu")
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById("sidebar")
                    ?.classList.toggle(
                        "open"
                    );
            }
        );


    document
        .getElementById("closeModal")
        ?.addEventListener(
            "click",
            cerrarModal
        );


    document
        .querySelector(".modal-overlay")
        ?.addEventListener(
            "click",
            cerrarModal
        );


    document
        .getElementById("btnNuevaSolicitud")
        ?.addEventListener(
            "click",
            () => {

                alert(
                    "La pantalla de Nueva Solicitud se conectará próximamente."
                );
            }
        );


    document
        .getElementById("btnTramites")
        ?.addEventListener(
            "click",
            () => {

                alert(
                    "La sección de Trámites se conectará próximamente."
                );
            }
        );


    document
        .getElementById("btnEmpresas")
        ?.addEventListener(
            "click",
            () => {

                alert(
                    "La sección de Empresas se conectará próximamente."
                );
            }
        );


    document
        .getElementById("btnReporte")
        ?.addEventListener(
            "click",
            () => {

                alert(
                    "El módulo de Reportes se conectará próximamente."
                );
            }
        );


    document
        .getElementById("btnVerSolicitudes")
        ?.addEventListener(
            "click",
            () => {

                document
                    .querySelector(
                        ".solicitudes-panel"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });
            }
        );


    document
        .getElementById("btnNotifications")
        ?.addEventListener(
            "click",
            () => {

                alert(
                    "Aquí se mostrarán las notificaciones del Gerente."
                );
            }
        );


    document
        .getElementById("btnHelp")
        ?.addEventListener(
            "click",
            () => {

                alert(
                    "Centro de ayuda de ZoFranca CR."
                );
            }
        );
}


/* ==========================================
   HELPERS
========================================== */

function obtenerIniciales(nombre) {

    const palabras =
        String(nombre)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (palabras.length === 0) {
        return "EM";
    }


    if (palabras.length === 1) {

        return palabras[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        palabras[0].charAt(0) +
        palabras[1].charAt(0)
    ).toUpperCase();
}


function obtenerClaseEstado(estado) {

    const valor =
        String(estado)
            .toLowerCase();


    if (
        valor.includes("recomend")
    ) {
        return "status-recomendada";
    }


    if (
        valor.includes("revisión") ||
        valor.includes("revision")
    ) {
        return "status-revision";
    }


    if (
        valor.includes("rechaz")
    ) {
        return "status-rechazada";
    }


    return "status-pendiente";
}


function obtenerIconoHistorial(tipo, accion) {

    const tipoNormalizado =
        String(tipo || "")
            .toLowerCase();

    const accionNormalizada =
        String(accion || "")
            .toLowerCase();


    if (
        tipoNormalizado === "alerta" ||
        accionNormalizada.includes("alerta")
    ) {
        return "warning";
    }


    if (
        tipoNormalizado === "decision" &&
        accionNormalizada.includes("rechaz")
    ) {
        return "cancel";
    }


    if (
        tipoNormalizado === "decision" ||
        accionNormalizada.includes("aprob")
    ) {
        return "check_circle";
    }


    if (
        tipoNormalizado === "evaluacion"
    ) {
        return "auto_awesome";
    }


    if (
        tipoNormalizado === "solicitud" ||
        accionNormalizada.includes("envi")
    ) {
        return "assignment_add";
    }


    return "history";
}


function formatearFechaCorta(fecha) {

    if (!fecha) {
        return "";
    }

    const fechaObj =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaObj.getTime()
        )
    ) {
        return String(fecha);
    }


    return fechaObj.toLocaleDateString(
        "es-CR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function escaparHTML(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ==========================================
   INICIALIZACIÓN
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        cargarUsuario();

        configurarNavegacion();

        configurarBusqueda();

        configurarBotones();


        await cargarSolicitudes();

        await cargarEmpresas();

        await cargarTramites();

        await cargarDocumentos();

        cargarIndicadores();

        await cargarActividad();

    }
);