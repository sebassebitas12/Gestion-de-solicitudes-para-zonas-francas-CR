import {
    fetchAPI
} from '../../services/api.js';

import {
    getSesion,
    logout
} from '../../services/auth.service.js';

import {
    configurarLogout
} from '../shared/logout.js';

import {
    derivarTramites,
    getDocumentos,
    getNotificaciones,
    getAlertasEmpresa
} from './empresa-data.js';

import {
    actualizarBadgeNotificaciones
} from './panel-base.js';


// ==========================================
// ESTADO DEL DASHBOARD
// ==========================================

let usuarioActual = null;
let empresaActual = null;
let solicitudes = [];
let actividades = [];
let alertasEmpresa = [];
let documentosEmpresa = [];
let tramitesEmpresa = [];


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
      window.location.href = '../login.html';
      return;
    }

    // --------------------------------------
    // 2. Verificar rol
    // --------------------------------------

    if (usuarioActual.rol !== 'empresa') {
      alert('No tienes permisos para acceder a esta página.');
      logout();
      window.location.href = '../login.html';
      return;
    }

    // --------------------------------------
    // 3. Verificar empresaId
    // --------------------------------------

    if (!usuarioActual.empresaId) {
      alert('La sesión no tiene una empresa asociada.');
      logout();
      window.location.href = '../login.html';
      return;
    }

    // --------------------------------------
    // 4. Cargar información
    // --------------------------------------

    await cargarEmpresa();
    await cargarSolicitudes();
    await cargarActividad();
    await cargarDocumentosEmpresa();
    await cargarNotificaciones();

    tramitesEmpresa = derivarTramites(solicitudes);

    cargarResumenTramites();
    await cargarEstadoGeneral();

    // --------------------------------------
    // 5. Eventos
    // --------------------------------------

    configurarLogout('btnCerrarSesion');

    configurarMenu();

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


  // Accesos desde el dashboard
  navegarA('btnVerTodas', 'solicitudes.html');
  navegarA('btnVerTramites', 'tramites.html');
  navegarA('qaNuevaSolicitud', 'nueva-solicitud.html');
  navegarA('qaSubirDocumento', 'documentos.html');
  navegarA('qaVerNotificaciones', 'notificaciones.html');
  navegarA('qaGenerarReporte', 'reportes.html');


  // Campana de la barra superior
  const btnNotificaciones =
    document.querySelector('.notification-button');

  if (btnNotificaciones) {
    btnNotificaciones.addEventListener(
      'click',
      () => {
        window.location.href =
          'notificaciones.html';
      }
    );
  }
}


function navegarA(idBoton, destino) {

  const boton =
    document.getElementById(idBoton);

  if (!boton) {
    return;
  }

  boton.addEventListener(
    'click',
    () => {
      window.location.href = destino;
    }
  );
}


// ==========================================
// MENÚ LATERAL (SECCIONES PENDIENTES)
// ==========================================

function configurarMenu() {

  const items =
    document.querySelectorAll('.sidebar-menu .menu-item');

  items.forEach((item) => {

    if (item.id === 'btnCerrarSesion') {
      return;
    }


    // Secciones aún sin pantalla propia
    if (item.hasAttribute('data-proximamente')) {

      item.addEventListener(
        'click',
        (event) => {

          event.preventDefault();

          alert(
            'Esta sección estará disponible próximamente.'
          );
        }
      );

      return;
    }


    // Enlaces reales del módulo: navegación normal.
    // Solo se interceptan enlaces muertos ("#").
    item.addEventListener(
      'click',
      (event) => {

        const destino =
          item.getAttribute('href');

        if (
          !destino ||
          destino === '#'
        ) {

          event.preventDefault();

          if (!item.classList.contains('active')) {
            alert(
              'Esta sección estará disponible próximamente.'
            );
          }
        }
      }
    );

  });

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


  const iniciales =
    obtenerInicialesNombre(empresaActual.nombre);

  const avatarSidebar =
    document.getElementById('avatarEmpresaSidebar');

  const avatarTopbar =
    document.getElementById('avatarEmpresaTop');

  if (avatarSidebar) {
    avatarSidebar.textContent = iniciales;
  }

  if (avatarTopbar) {
    avatarTopbar.textContent = iniciales;
  }


  const rolEmpresa =
    document.getElementById('rolEmpresa');

  if (rolEmpresa) {
    rolEmpresa.textContent = 'Empresa Solicitante';
  }
}


function obtenerInicialesNombre(nombre) {

  const palabras =
    String(nombre || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (palabras.length === 0) {
    return 'EM';
  }

  if (palabras.length === 1) {
    return palabras[0].substring(0, 2).toUpperCase();
  }

  return (
    palabras[0].charAt(0) +
    palabras[1].charAt(0)
  ).toUpperCase();
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
  renderListaDocumentos();
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

  const activas =
    solicitudes.filter(
      (solicitud) => {
        const estado =
          String(solicitud.estado || '')
            .toLowerCase();

        return (
          estado === 'pendiente' ||
          estado === 'en_revision' ||
          estado === 'en revisión'
        );
      }
    ).length;


  actualizarElemento(
    ['solicitudesActivas'],
    activas
  );

  // Compatibilidad con IDs anteriores
  actualizarElemento(
    ['tramitesPendientes', 'tramitesEnProceso'],
    activas
  );

  actualizarElemento(
    ['cantidadDocumentos'],
    documentosEmpresa.length
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
// DOCUMENTOS DE LA EMPRESA (biblioteca)
// ==========================================

async function cargarDocumentosEmpresa() {

  documentosEmpresa =
    await getDocumentos(empresaActual.id);

  actualizarConteoDocumentos();
}


function esDocumentoPendiente(documento) {

  if (documento.estado === 'En revisión') {
    return true;
  }

  if (!documento.vencimiento) {
    return false;
  }

  const vencimiento =
    new Date(documento.vencimiento).setHours(23, 59, 59, 999);

  const hoy =
    new Date().setHours(0, 0, 0, 0);

  const diasRestantes =
    Math.ceil((vencimiento - hoy) / 86400000);

  return diasRestantes <= 30;
}


function actualizarConteoDocumentos() {

  let pendientes = 0;
  let vigentes = 0;

  documentosEmpresa.forEach((documento) => {

    if (
      String(documento.estado || '') === 'Vencido' ||
      esDocumentoPendiente(documento)
    ) {
      pendientes += 1;
    } else {
      vigentes += 1;
    }

  });

  actualizarElemento(
    ['documentosPendientes'],
    pendientes
  );

  actualizarElemento(
    ['documentosVigentes'],
    vigentes
  );
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
// DOCUMENTOS DE LA EMPRESA
// ==========================================

function renderListaDocumentos() {

  const lista =
    document.getElementById('listaDocumentos');

  if (!lista) {
    return;
  }

  lista.innerHTML = '';

  const documentos = [];

  solicitudes.forEach((solicitud) => {

    const archivos =
      Array.isArray(solicitud.documentos)
        ? solicitud.documentos
        : [];

    archivos.forEach((nombre) => {
      documentos.push({
        nombre,
        solicitudId: solicitud.id
      });
    });

  });


  if (documentos.length === 0) {

    lista.innerHTML = `
      <div class="document-item">
        <div>
          <h4>
            No hay documentos registrados.
          </h4>
        </div>
      </div>
    `;

    return;
  }


  documentos.slice(0, 4).forEach((documento) => {

    const item =
      document.createElement('div');

    item.className = 'document-item';

    item.innerHTML = `
      <div>
        <h4>
          ${escaparHTML(documento.nombre)}
        </h4>

        <span class="document-date">
          ${escaparHTML(documento.solicitudId)}
        </span>
      </div>
    `;

    lista.appendChild(item);

  });
}


// ==========================================
// NOTIFICACIONES / ALERTAS
// ==========================================

async function cargarNotificaciones() {

  try {

    alertasEmpresa =
      await getAlertasEmpresa(empresaActual.id);

    if (!Array.isArray(alertasEmpresa)) {
      alertasEmpresa = [];
    }

  } catch (error) {

    console.warn(
      'No se pudieron cargar las alertas:',
      error
    );

    alertasEmpresa = [];
  }


  let sinLeer = 0;

  try {

    const notificaciones =
      await getNotificaciones(empresaActual.id);

    sinLeer =
      notificaciones.filter(
        (notificacion) => !notificacion.leida
      ).length;

  } catch (error) {

    console.warn(
      'No se pudieron cargar las notificaciones:',
      error
    );
  }


  actualizarElemento(
    ['notificacionesPendientes'],
    sinLeer
  );

  actualizarBadgeNotificaciones(empresaActual.id);


  const punto =
    document.querySelector('.notification-dot');

  if (punto) {
    punto.style.display =
      sinLeer > 0
        ? 'block'
        : 'none';
  }
}


// ==========================================
// RESUMEN DE TRÁMITES
// ==========================================

function cargarResumenTramites() {

  const contenedor =
    document.getElementById('resumenTramites');

  if (!contenedor) {
    return;
  }

  const enProceso =
    tramitesEmpresa.filter(
      (tramite) =>
        tramite.estado === 'En proceso'
    );

  const visibles =
    (enProceso.length > 0
      ? enProceso
      : tramitesEmpresa
    ).slice(0, 3);

  if (visibles.length === 0) {

    contenedor.innerHTML = `

      <p style="color: var(--text-secondary); font-size: 13px;">
        No hay trámites registrados.
      </p>

    `;

    return;
  }

  contenedor.innerHTML = visibles.map((tramite) => `

    <div class="tramite-mini">

      <strong>
        ${escaparHTML(tramite.nombre)}
      </strong>

      <div class="progress-row">

        <div class="progress-track">
          <div
            class="progress-fill"
            style="width:${tramite.progreso}%"
          ></div>
        </div>

        <span class="progress-value">${tramite.progreso}%</span>

      </div>

    </div>

  `).join('');
}


// ==========================================
// ESTADO GENERAL DE LA EMPRESA
// ==========================================

async function cargarEstadoGeneral() {

  // Cumplimiento promedio según alertas reales
  const porcentajes =
    alertasEmpresa
      .map(
        (alerta) =>
          Number(alerta.porcentajeCumplimiento)
      )
      .filter((valor) => Number.isFinite(valor));

  const cumplimiento =
    porcentajes.length > 0
      ? Math.round(
          porcentajes.reduce(
            (suma, valor) => suma + valor,
            0
          ) / porcentajes.length
        )
      : 0;

  pintarBarraEstado(
    'textoCumplimiento',
    'barraCumplimiento',
    cumplimiento
  );


  // Documentos vigentes
  const totalDocs =
    documentosEmpresa.length || 1;

  const vigentes =
    Number(
      document
        .getElementById('documentosVigentes')
        ?.textContent || 0
    );

  pintarBarraEstado(
    'textoDocsVigentes',
    'barraDocsVigentes',
    Math.round((vigentes / totalDocs) * 100)
  );


  // Solicitudes aprobadas o completadas
  const aprobadas =
    solicitudes.filter(
      (solicitud) => {
        const estado =
          String(solicitud.estado || '')
            .toLowerCase();

        return (
          estado === 'aprobada' ||
          estado === 'completada'
        );
      }
    ).length;

  const tasaAprobacion =
    solicitudes.length > 0
      ? Math.round(
          (aprobadas / solicitudes.length) * 100
        )
      : 0;

  pintarBarraEstado(
    'textoSolicitudesAprobadas',
    'barraSolicitudesAprobadas',
    tasaAprobacion
  );
}


function pintarBarraEstado(idTexto, idBarra, porcentaje) {

  const texto =
    document.getElementById(idTexto);

  const barra =
    document.getElementById(idBarra);

  const valorSeguro =
    Math.max(0, Math.min(100, Number(porcentaje) || 0));

  if (texto) {
    texto.textContent = `${valorSeguro}%`;
  }

  if (barra) {
    barra.style.width = `${valorSeguro}%`;
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