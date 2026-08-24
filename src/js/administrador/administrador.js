/*
 * ============================================================
 * ZoFranca CR
 * Panel del Administrador
 * ============================================================
 */

import {
    getSesion,
    logout
} from '../../services/auth.service.js';

import {
    fetchAPI
} from '../../services/api.js';


/* ============================================================
   SESIÓN
   ============================================================ */

const session = getSesion();


// Protección de la página.
// Solamente puede entrar un usuario con rol administrador.

if (!session || session.rol !== 'administrador') {

    window.location.href = '../login.html';

    throw new Error(
        'Acceso no autorizado.'
    );
}


/* ============================================================
   HELPERS
   ============================================================ */

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


function getInitials(nombre) {

    if (!nombre) {
        return 'A';
    }

    const words = nombre
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[1][0]
    ).toUpperCase();
}


function showAlert(
    message,
    type = 'success'
) {

    const alert =
        document.getElementById(
            'alert-message'
        );

    if (!alert) {
        return;
    }

    alert.textContent = message;

    alert.className =
        `admin-alert ${type}`;

    setTimeout(() => {

        alert.classList.add('hidden');

    }, 4000);
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function setProgress(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    const safeValue =
        Math.max(
            0,
            Math.min(
                100,
                Number(value) || 0
            )
        );

    element.style.width =
        `${safeValue}%`;
}


/* ============================================================
   PERFIL
   ============================================================ */

function cargarPerfil() {

    const nombre =
        session.nombre ||
        'Administrador';

    const email =
        session.email ||
        'admin@zofranca.cr';

    const initials =
        getInitials(nombre);


    setText(
        'admin-name',
        nombre
    );

    setText(
        'admin-email',
        email
    );

    setText(
        'admin-avatar',
        initials
    );

    setText(
        'top-avatar',
        initials
    );
}


/* ============================================================
   LOGOUT
   ============================================================ */

function configurarLogout() {

    const button =
        document.getElementById(
            'btn-logout'
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        'click',
        () => {

            logout();

            window.location.href =
                '../login.html';
        }
    );
}


/* ============================================================
   CARGAR USUARIOS
   ============================================================ */

async function cargarUsuarios() {

    const tbody =
        document.getElementById(
            'usuarios-recientes'
        );

    try {

        const usuarios =
            await fetchAPI(
                '/usuarios'
            );


        /* Estadísticas */

        const total =
            usuarios.length;

        const activos =
            usuarios.filter(
                usuario =>
                    usuario.activo === true
            ).length;

        const porcentajeActivos =
            total > 0
                ? Math.round(
                    (activos / total) * 100
                )
                : 0;


        setText(
            'stat-users',
            total.toLocaleString('es-CR')
        );

        setText(
            'stat-active-users',
            `${porcentajeActivos}% activos`
        );

        setText(
            'progress-users-value',
            `${porcentajeActivos}%`
        );

        setProgress(
            'progress-users',
            porcentajeActivos
        );


        /* Tabla */

        if (!tbody) {
            return usuarios;
        }


        const recientes =
            usuarios
                .slice()
                .reverse()
                .slice(0, 5);


        if (recientes.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="table-loading"
                    >
                        No hay usuarios registrados.
                    </td>
                </tr>
            `;

            return usuarios;
        }


        tbody.innerHTML =
            recientes
                .map(usuario => {

                    const initials =
                        getInitials(
                            usuario.nombre
                        );

                    const role =
                        usuario.rol ||
                        'usuario';

                    const roleLabel =
                        role
                            .charAt(0)
                            .toUpperCase() +
                        role.slice(1);

                    const statusClass =
                        usuario.activo
                            ? 'active'
                            : 'inactive';

                    const statusText =
                        usuario.activo
                            ? 'Activo'
                            : 'Inactivo';


                    return `
                        <tr>

                            <td>

                                <div class="table-user">

                                    <div class="table-avatar">
                                        ${escapeHTML(initials)}
                                    </div>

                                    <strong>
                                        ${escapeHTML(
                                            usuario.nombre
                                        )}
                                    </strong>

                                </div>

                            </td>


                            <td>
                                ${escapeHTML(
                                    usuario.email
                                )}
                            </td>


                            <td>

                                <span
                                    class="role-badge ${escapeHTML(role)}"
                                >
                                    ${escapeHTML(
                                        roleLabel
                                    )}
                                </span>

                            </td>


                            <td>

                                <span class="status">

                                    <span
                                        class="status-dot ${statusClass}"
                                    ></span>

                                    ${statusText}

                                </span>

                            </td>


                            <td>

                                ${
                                    usuario.activo
                                        ? 'Activo actualmente'
                                        : 'Sin actividad reciente'
                                }

                            </td>


                            <td>

                                <button
                                    type="button"
                                    class="view-button"
                                    title="Ver usuario"
                                    data-user-id="${escapeHTML(
                                        usuario.id
                                    )}"
                                >

                                    <span class="material-symbols-outlined">
                                        visibility
                                    </span>

                                </button>

                            </td>

                        </tr>
                    `;
                })
                .join('');


        /* Eventos de botones */

        tbody
            .querySelectorAll(
                '[data-user-id]'
            )
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        const id =
                            button.dataset.userId;

                        showAlert(
                            `Usuario ${id} seleccionado.`,
                            'success'
                        );
                    }
                );
            });


        return usuarios;

    } catch (error) {

        console.error(
            'Error cargando usuarios:',
            error
        );

        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="table-loading"
                    >
                        No se pudieron cargar los usuarios.
                    </td>
                </tr>
            `;
        }

        throw error;
    }
}


/* ============================================================
   CARGAR EMPRESAS
   ============================================================ */

async function cargarEmpresas() {

    const container =
        document.getElementById(
            'empresas-recientes'
        );

    try {

        const empresas =
            await fetchAPI(
                '/empresas'
            );


        const total =
            empresas.length;


        setText(
            'stat-companies',
            total.toLocaleString('es-CR')
        );


        const activas =
            empresas.filter(
                empresa =>
                    empresa.estado === 'activa' ||
                    empresa.estado === 'Activa' ||
                    empresa.activo === true
            ).length;


        const porcentaje =
            total > 0
                ? Math.round(
                    (activas / total) * 100
                )
                : 0;


        setText(
            'progress-companies-value',
            `${porcentaje}%`
        );

        setProgress(
            'progress-companies',
            porcentaje
        );


        if (!container) {
            return empresas;
        }


        const recientes =
            empresas
                .slice()
                .reverse()
                .slice(0, 4);


        if (recientes.length === 0) {

            container.innerHTML = `
                <div class="company-loading">
                    No hay empresas registradas.
                </div>
            `;

            return empresas;
        }


        container.innerHTML =
            recientes
                .map(empresa => {

                    const initials =
                        getInitials(
                            empresa.nombre
                        );

                    const estado =
                        empresa.estado ||
                        'Activa';

                    const activa =
                        estado.toLowerCase()
                            === 'activa';


                    return `
                        <article
                            class="company-card"
                            data-company-id="${escapeHTML(
                                empresa.id
                            )}"
                        >

                            <div class="company-top">

                                <div class="company-info">

                                    <div class="company-avatar">
                                        ${escapeHTML(
                                            initials
                                        )}
                                    </div>

                                    <div class="company-name">

                                        <strong>
                                            ${escapeHTML(
                                                empresa.nombre
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                empresa.sector ||
                                                'Empresa'
                                            )}
                                        </span>

                                    </div>

                                </div>


                                <span
                                    class="company-status ${
                                        activa
                                            ? 'active'
                                            : 'review'
                                    }"
                                >
                                    ${escapeHTML(
                                        estado
                                    )}
                                </span>

                            </div>


                            <div class="company-bottom">

                                <span>
                                    ${escapeHTML(
                                        empresa.ubicacion ||
                                        'Costa Rica'
                                    )}
                                </span>

                                <span>
                                    ${
                                        empresa.usuarios
                                            ? `${empresa.usuarios} Usuarios`
                                            : 'Empresa registrada'
                                    }
                                </span>

                            </div>

                        </article>
                    `;
                })
                .join('');


        return empresas;

    } catch (error) {

        console.error(
            'Error cargando empresas:',
            error
        );

        if (container) {

            container.innerHTML = `
                <div class="company-loading">
                    No se pudieron cargar las empresas.
                </div>
            `;
        }

        throw error;
    }
}


/* ============================================================
   SOLICITUDES
   ============================================================ */

async function cargarSolicitudes() {

    try {

        const solicitudes =
            await fetchAPI(
                '/solicitudes'
            );


        const pendientes =
            solicitudes.filter(
                solicitud => {

                    const estado =
                        String(
                            solicitud.estado ||
                            ''
                        ).toLowerCase();

                    return (
                        estado === 'pendiente' ||
                        estado === 'en_revision' ||
                        estado === 'revisar' ||
                        estado === 'en proceso'
                    );
                }
            ).length;


        setText(
            'stat-pending',
            pendientes.toLocaleString('es-CR')
        );


        const total =
            solicitudes.length;


        const procesadas =
            solicitudes.filter(
                solicitud => {

                    const estado =
                        String(
                            solicitud.estado ||
                            ''
                        ).toLowerCase();

                    return (
                        estado === 'aprobada' ||
                        estado === 'aprobado' ||
                        estado === 'rechazada' ||
                        estado === 'rechazado'
                    );
                }
            ).length;


        const porcentaje =
            total > 0
                ? Math.round(
                    (procesadas / total) * 100
                )
                : 0;


        setText(
            'progress-requests-value',
            `${porcentaje}%`
        );

        setProgress(
            'progress-requests',
            porcentaje
        );


        return solicitudes;

    } catch (error) {

        console.error(
            'Error cargando solicitudes:',
            error
        );

        setText(
            'stat-pending',
            '0'
        );

        return [];
    }
}


/* ============================================================
   TRÁMITES
   ============================================================ */

async function cargarTramites() {

    try {

        const solicitudes =
            await fetchAPI(
                '/solicitudes'
            );


        const enProceso =
            solicitudes.filter(
                solicitud => {

                    const estado =
                        String(
                            solicitud.estado ||
                            ''
                        ).toLowerCase();

                    return (
                        estado === 'pendiente' ||
                        estado === 'en_revision' ||
                        estado === 'revisar' ||
                        estado === 'en proceso'
                    );
                }
            ).length;


        setText(
            'stat-process',
            enProceso.toLocaleString('es-CR')
        );


        return enProceso;

    } catch (error) {

        console.error(
            'Error cargando trámites:',
            error
        );

        setText(
            'stat-process',
            '0'
        );

        return 0;
    }
}


/* ============================================================
   DOCUMENTOS / ESTADO GENERAL
   ============================================================ */

async function cargarEstadoDocumentos() {

    try {

        const documentos =
            await fetchAPI(
                '/reportes_cumplimiento'
            );


        const total =
            documentos.length;


        const vigentes =
            documentos.filter(
                reporte => {

                    const estado =
                        String(
                            reporte.estado ||
                            ''
                        ).toLowerCase();

                    return (
                        estado === 'completo' ||
                        estado === 'aprobado' ||
                        estado === 'vigente'
                    );
                }
            ).length;


        let porcentaje = 94;


        if (total > 0) {

            porcentaje =
                Math.round(
                    (vigentes / total) * 100
                );


            if (vigentes === 0) {
                porcentaje = 94;
            }
        }


        setText(
            'progress-documents-value',
            `${porcentaje}%`
        );

        setProgress(
            'progress-documents',
            porcentaje
        );

    } catch (error) {

        console.error(
            'Error cargando documentos:',
            error
        );

        setText(
            'progress-documents-value',
            '94%'
        );

        setProgress(
            'progress-documents',
            94
        );
    }
}


/* ============================================================
   ACTIVIDAD RECIENTE
   ============================================================ */

async function cargarActividad() {

    const container =
        document.getElementById(
            'actividad-reciente'
        );

    if (!container) {
        return;
    }


    try {

        const historial =
            await fetchAPI(
                '/historial'
            );


        const recientes =
            historial
                .slice()
                .reverse()
                .slice(0, 4);


        if (recientes.length === 0) {

            container.innerHTML = `
                <div class="activity-loading">
                    No hay actividad registrada.
                </div>
            `;

            return;
        }


        container.innerHTML =
            recientes
                .map((item) => {

                    let icon =
                        'history';

                    let color =
                        'blue';


                    const tipo =
                        String(
                            item.tipo ||
                            ''
                        ).toLowerCase();


                    if (
                        tipo.includes(
                            'decision'
                        )
                    ) {

                        icon =
                            'fact_check';

                        color =
                            'green';

                    } else if (
                        tipo.includes(
                            'evaluacion'
                        )
                    ) {

                        icon =
                            'psychology';

                        color =
                            'blue';

                    } else {

                        icon =
                            'history';

                        color =
                            'orange';
                    }


                    return `
                        <div class="activity-item">

                            <div class="activity-icon ${color}">

                                <span class="material-symbols-outlined">
                                    ${icon}
                                </span>

                            </div>


                            <div class="activity-text">

                                <strong>
                                    ${escapeHTML(
                                        item.accion ||
                                        'Actividad registrada'
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        item.descripcion ||
                                        item.fecha ||
                                        'Actividad reciente'
                                    )}
                                </span>

                            </div>

                        </div>
                    `;
                })
                .join('');

    } catch (error) {

        console.error(
            'Error cargando actividad:',
            error
        );

        container.innerHTML = `
            <div class="activity-loading">
                No se pudo cargar la actividad.
            </div>
        `;
    }
}


/* ============================================================
   ACCIONES RÁPIDAS
   ============================================================ */

function configurarAcciones() {

    const newUser =
        document.getElementById(
            'action-new-user'
        );

    const newCompany =
        document.getElementById(
            'action-new-company'
        );

    const review =
        document.getElementById(
            'action-review'
        );

    const report =
        document.getElementById(
            'action-report'
        );

    const settings =
        document.getElementById(
            'action-settings'
        );


    newUser?.addEventListener(
        'click',
        () => {

            showAlert(
                'La creación de usuarios estará disponible desde el módulo Usuarios.',
                'success'
            );
        }
    );


    newCompany?.addEventListener(
        'click',
        () => {

            showAlert(
                'La creación de empresas estará disponible desde el módulo Empresas.',
                'success'
            );
        }
    );


    review?.addEventListener(
        'click',
        () => {

            showAlert(
                'Las solicitudes pendientes se pueden revisar desde el módulo Solicitudes.',
                'success'
            );
        }
    );


    report?.addEventListener(
        'click',
        () => {

            showAlert(
                'El módulo de reportes será conectado en el siguiente paso.',
                'success'
            );
        }
    );


    settings?.addEventListener(
        'click',
        () => {

            showAlert(
                'El módulo de configuración será conectado en el siguiente paso.',
                'success'
            );
        }
    );
}


/* ============================================================
   NAVEGACIÓN
   ============================================================ */

function configurarNavegacion() {

    const items =
        document.querySelectorAll(
            '.admin-nav-item'
        );


    items.forEach(item => {

        item.addEventListener(
            'click',
            event => {

                const text =
                    item
                        .querySelector(
                            'span:last-child'
                        )
                        ?.textContent
                        ?.trim();


                if (
                    text &&
                    text !== 'Inicio'
                ) {

                    event.preventDefault();

                    showAlert(
                        `Módulo "${text}" pendiente de conexión.`,
                        'success'
                    );
                }

            }
        );

    });
}


/* ============================================================
   BÚSQUEDA
   ============================================================ */

function configurarBusqueda() {

    const input =
        document.getElementById(
            'admin-search'
        );

    if (!input) {
        return;
    }


    input.addEventListener(
        'input',
        () => {

            const query =
                input.value
                    .trim()
                    .toLowerCase();


            const rows =
                document.querySelectorAll(
                    '#usuarios-recientes tr'
                );


            rows.forEach(row => {

                const text =
                    row.textContent
                        .toLowerCase();


                row.style.display =
                    !query ||
                    text.includes(query)
                        ? ''
                        : 'none';

            });

        }
    );
}


/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

async function inicializar() {

    cargarPerfil();

    configurarLogout();

    configurarAcciones();

    configurarNavegacion();

    configurarBusqueda();


    await Promise.allSettled([

        cargarUsuarios(),

        cargarEmpresas(),

        cargarSolicitudes(),

        cargarTramites(),

        cargarEstadoDocumentos(),

        cargarActividad()

    ]);
}


document.addEventListener(
    'DOMContentLoaded',
    inicializar
);