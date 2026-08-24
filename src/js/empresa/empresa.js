import {
    fetchAPI
} from '../../services/api.js';

import {
    getSesion,
    logout
} from '../../services/auth.service.js';


// ==========================================
// ESTADO DEL DASHBOARD
// ==========================================

let usuarioActual = null;
let empresaActual = null;
let solicitudes = [];
let actividades = [];


// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', iniciarDashboard);

async function iniciarDashboard() {
  try {
    // --------------------------------------
    // 1. Verificar sesión
    // --------------------------------------

    usuarioActual = getSesion();

    if (!usuarioActual) {
      window.location.href = 'login.html';
      return;
    }

    // --------------------------------------
    // 2. Verificar rol
    // --------------------------------------

    if (usuarioActual.rol !== 'empresa') {
      alert('No tienes permisos para acceder a esta página.');
      logout();
      window.location.href = 'login.html';
      return;
    }

    // --------------------------------------
    // 3. Verificar empresaId
    // --------------------------------------

    if (!usuarioActual.empresaId) {
      alert('La sesión no tiene una empresa asociada.');
      logout();
      window.location.href = 'login.html';
      return;
    }

    // --------------------------------------
    // 4. Cargar información
    // --------------------------------------

    await cargarEmpresa();
    await cargarSolicitudes();
    await cargarActividad();

    // --------------------------------------
    // 5. Eventos
    // --------------------------------------

    configurarEventos();

  } catch (error) {
    console.error('Error iniciando dashboard:', error);

    mostrarError(
      'No fue posible cargar el dashboard. ' +
      error.message
    );
  }
}


// ==========================================
// CONFIGURAR EVENTOS
// ==========================================

function configurarEventos() {

  const btnNuevaSolicitud =
    document.getElementById('btnNuevaSolicitud');

  if (btnNuevaSolicitud) {
    btnNuevaSolicitud.addEventListener(
      'click',
      nuevaSolicitud
    );
  }


  const btnCerrarSesion =
    document.getElementById('btnCerrarSesion');

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener(
      'click',
      cerrarSesion
    );
  }
}


// ==========================================
// EMPRESA
// ==========================================

async function cargarEmpresa() {

  empresaActual = await fetchAPI(
    `/empresas/${encodeURIComponent(usuarioActual.empresaId)}`
  );

  if (!empresaActual) {
    throw new Error(
      'No se encontró la información de la empresa.'
    );
  }

  renderizarEmpresa();
}


// ==========================================
// MOSTRAR INFORMACIÓN DE EMPRESA
// ==========================================

function renderizarEmpresa() {

  const nombreEmpresa =
    document.getElementById('nombreEmpresa');

  const saludoEmpresa =
    document.getElementById('saludoEmpresa');


  if (nombreEmpresa) {
    nombreEmpresa.textContent =
      empresaActual.nombre;
  }


  if (saludoEmpresa) {

    let nombre = empresaActual.nombre;

    nombre = nombre
      .replace(' S.A.', '')
      .replace(' S.A', '');

    saludoEmpresa.textContent = nombre;
  }
}


// ==========================================
// SOLICITUDES
// ==========================================

async function cargarSolicitudes() {

  solicitudes = await fetchAPI(
    `/solicitudes?empresaId=${encodeURIComponent(
      empresaActual.id
    )}`
  );

  if (!Array.isArray(solicitudes)) {
    solicitudes = [];
  }

  // Ordenar de la más reciente a la más antigua
  solicitudes.sort(
    (a, b) =>
      new Date(b.fecha || 0) -
      new Date(a.fecha || 0)
  );

  renderizarSolicitudes();
  actualizarEstadisticas();
}


// ==========================================
// RENDERIZAR SOLICITUDES
// ==========================================

function renderizarSolicitudes() {

  const tabla =
    document.getElementById('tablaSolicitudes');

  if (!tabla) {
    return;
  }

  tabla.innerHTML = '';


  if (solicitudes.length === 0) {

    tabla.innerHTML = `
      <tr>
        <td colspan="5">
          No hay solicitudes registradas.
        </td>
      </tr>
    `;

    return;
  }


  solicitudes.forEach((solicitud) => {

    const fila =
      document.createElement('tr');

    const estadoClase =
      obtenerClaseEstado(solicitud.estado);

    const estadoTexto =
      obtenerTextoEstado(solicitud.estado);


    fila.innerHTML = `
      <td>
        <strong>
          ${escaparHTML(solicitud.id)}
        </strong>
      </td>

      <td>
        ${escaparHTML(
          obtenerTipoSolicitud(solicitud)
        )}
      </td>

      <td>
        ${formatearFecha(solicitud.fecha)}
      </td>

      <td>
        <span class="status ${estadoClase}">
          ${escaparHTML(estadoTexto)}
        </span>
      </td>

      <td>
        <button
          type="button"
          class="icon-button"
          title="Ver solicitud"
          data-solicitud-id="${escaparHTML(
            solicitud.id
          )}"
        >
          <span class="material-symbols-outlined">
            visibility
          </span>
        </button>
      </td>
    `;


    const boton =
      fila.querySelector('.icon-button');

    if (boton) {

      boton.addEventListener(
        'click',
        () => {
          verSolicitud(solicitud.id);
        }
      );
    }


    tabla.appendChild(fila);
  });
}


// ==========================================
// TIPO DE SOLICITUD
// ==========================================

function obtenerTipoSolicitud(solicitud) {

  // Tu db.json no tiene un campo "tipo".
  // Usamos la descripción para no inventar
  // un tipo que no existe.

  if (solicitud.descripcion) {
    return solicitud.descripcion;
  }

  return 'Solicitud de zona franca';
}


// ==========================================
// ESTADÍSTICAS
// ==========================================

function actualizarEstadisticas() {

  const total =
    solicitudes.length;


  const pendientes =
    solicitudes.filter(
      (solicitud) =>
        solicitud.estado === 'pendiente'
    ).length;


  const aprobadas =
    solicitudes.filter(
      (solicitud) =>
        solicitud.estado === 'aprobada'
    ).length;


  const rechazadas =
    solicitudes.filter(
      (solicitud) =>
        solicitud.estado === 'rechazada'
    ).length;


  // Intentamos diferentes IDs para que
  // podamos adaptarnos al HTML existente.

  actualizarElemento(
    [
      'totalSolicitudes',
      'statSolicitudes',
      'total-solicitudes'
    ],
    total
  );


  actualizarElemento(
    [
      'solicitudesPendientes',
      'statPendientes',
      'solicitudes-pendientes'
    ],
    pendientes
  );


  actualizarElemento(
    [
      'solicitudesAprobadas',
      'statAprobadas',
      'solicitudes-aprobadas'
    ],
    aprobadas
  );


  actualizarElemento(
    [
      'solicitudesRechazadas',
      'statRechazadas',
      'solicitudes-rechazadas'
    ],
    rechazadas
  );
}


function actualizarElemento(ids, valor) {

  for (const id of ids) {

    const elemento =
      document.getElementById(id);

    if (elemento) {

      elemento.textContent = valor;

      return;
    }
  }
}


// ==========================================
// VER SOLICITUD
// ==========================================

async function verSolicitud(id) {

  try {

    const solicitud =
      await fetchAPI(
        `/solicitudes/${encodeURIComponent(id)}`
      );


    if (!solicitud) {
      throw new Error(
        'No se encontró la solicitud.'
      );
    }


    mostrarDetalleSolicitud(solicitud);

  } catch (error) {

    console.error(
      'Error cargando solicitud:',
      error
    );


    mostrarError(
      'No fue posible cargar la solicitud. ' +
      error.message
    );
  }
}


// ==========================================
// DETALLE DE SOLICITUD
// ==========================================

function mostrarDetalleSolicitud(solicitud) {

  const documentos =
    Array.isArray(solicitud.documentos)
      ? solicitud.documentos
      : [];


  let mensaje =
    `Solicitud: ${solicitud.id}\n\n` +

    `Empresa: ${
      solicitud.empresa ||
      empresaActual?.nombre ||
      'No disponible'
    }\n` +

    `Sector: ${
      solicitud.sector ||
      'No especificado'
    }\n` +

    `País: ${
      solicitud.pais ||
      'No especificado'
    }\n` +

    `Estado: ${
      obtenerTextoEstado(
        solicitud.estado
      )
    }\n` +

    `Fecha: ${
      formatearFecha(
        solicitud.fecha
      )
    }\n\n` +

    `Inversión: ${
      formatearMoneda(
        solicitud.inversion
      )
    }\n` +

    `Empleos: ${
      solicitud.empleos ?? 0
    }\n` +

    `Exportaciones: ${
      formatearMoneda(
        solicitud.exportaciones
      )
    }`;


  if (documentos.length > 0) {

    mensaje +=
      `\n\nDocumentos:\n` +
      documentos.join('\n');
  }


  if (solicitud.puntajeIA !== undefined) {

    mensaje +=
      `\n\nPuntaje IA: ${
        solicitud.puntajeIA
      }`;
  }


  if (solicitud.clasificacionIA) {

    mensaje +=
      `\nClasificación IA: ${
        solicitud.clasificacionIA
      }`;
  }


  alert(mensaje);
}


// ==========================================
// ACTIVIDAD / HISTORIAL
// ==========================================

async function cargarActividad() {

  actividades = await fetchAPI(
    `/historial?empresaId=${encodeURIComponent(
      empresaActual.id
    )}`
  );


  if (!Array.isArray(actividades)) {
    actividades = [];
  }


  actividades.sort(
    (a, b) =>
      new Date(b.fecha || 0) -
      new Date(a.fecha || 0)
  );


  renderizarActividad();
}


// ==========================================
// RENDERIZAR ACTIVIDAD
// ==========================================

function renderizarActividad() {

  const lista =
    document.getElementById(
      'listaActividad'
    );

  if (!lista) {
    return;
  }


  lista.innerHTML = '';


  if (actividades.length === 0) {

    lista.innerHTML = `
      <div class="activity-item">
        <div class="activity-content">
          <p>
            No hay actividad reciente.
          </p>
        </div>
      </div>
    `;

    return;
  }


  actividades
    .slice(0, 5)
    .forEach((actividad) => {

      const elemento =
        document.createElement('div');

      elemento.classList.add(
        'activity-item'
      );


      const icono =
        obtenerIconoActividad(
          actividad.tipo
        );


      elemento.innerHTML = `
        <div class="activity-icon blue">
          <span class="material-symbols-outlined">
            ${icono}
          </span>
        </div>

        <div class="activity-content">

          <p>
            ${escaparHTML(
              actividad.accion ||
              actividad.descripcion ||
              'Actividad registrada'
            )}
          </p>

          <span class="activity-time">
            ${formatearFechaHora(
              actividad.fecha
            )}
          </span>

        </div>
      `;


      lista.appendChild(elemento);
    });
}


// ==========================================
// ICONOS DE ACTIVIDAD
// ==========================================

function obtenerIconoActividad(tipo) {

  switch (tipo) {

    case 'decision':
      return 'check_circle';

    case 'evaluacion':
      return 'psychology';

    case 'alerta':
      return 'warning';

    case 'documento':
      return 'upload_file';

    default:
      return 'history';
  }
}


// ==========================================
// NUEVA SOLICITUD
// ==========================================

function nuevaSolicitud() {

  window.location.href =
    'nueva-solicitud.html';
}


// ==========================================
// CERRAR SESIÓN
// ==========================================

function cerrarSesion(event) {

  if (event) {
    event.preventDefault();
  }


  const confirmar =
    confirm(
      '¿Está seguro de que desea cerrar sesión?'
    );


  if (!confirmar) {
    return;
  }


  logout();

  window.location.href =
    'login.html';
}


// ==========================================
// UTILIDADES
// ==========================================

function obtenerClaseEstado(estado) {

  switch (
    String(estado || '').toLowerCase()
  ) {

    case 'aprobada':
      return 'completed';

    case 'pendiente':
      return 'pending';

    case 'rechazada':
      return 'danger';

    case 'en_revision':
    case 'en revisión':
      return 'review';

    default:
      return 'pending';
  }
}


function obtenerTextoEstado(estado) {

  const estados = {
    aprobada: 'Aprobada',
    pendiente: 'Pendiente',
    rechazada: 'Rechazada',
    en_revision: 'En revisión',
    'en revisión': 'En revisión'
  };


  return (
    estados[
      String(estado || '').toLowerCase()
    ] ||
    estado ||
    'Sin estado'
  );
}


function formatearFecha(fecha) {

  if (!fecha) {
    return 'Sin fecha';
  }


  const fechaObj =
    new Date(fecha);


  if (
    Number.isNaN(
      fechaObj.getTime()
    )
  ) {
    return fecha;
  }


  return fechaObj.toLocaleDateString(
    'es-CR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  );
}


function formatearFechaHora(fecha) {

  if (!fecha) {
    return 'Sin fecha';
  }


  const fechaObj =
    new Date(fecha);


  if (
    Number.isNaN(
      fechaObj.getTime()
    )
  ) {
    return fecha;
  }


  return fechaObj.toLocaleString(
    'es-CR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}


function formatearMoneda(valor) {

  const numero =
    Number(valor || 0);


  return numero.toLocaleString(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }
  );
}


function escaparHTML(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }


  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function mostrarError(mensaje) {

  console.error(mensaje);

  alert(mensaje);
}