// analista.js
import { getSesion, logout } from '../../services/auth.service.js';
import { fetchAPI } from '../../services/api.js';

// --- Sesión ---
const session = getSesion();

// CORRECCIÓN: logout con redirección
document.getElementById('btn-logout').addEventListener('click', () => {
  logout();
  window.location.href = '../pages/login.html';
});

// Estado local para caché y filtrado
let allSolicitudes = [];
let selectedSolicitudId = null;

// --- Helpers de UI ---
function toggleSpinner(show) {
  const spinner = document.getElementById('spinner-loading');
  if (spinner) spinner.classList.toggle('hidden', !show);
}

function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alert-message');
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.className = `alert-banner alert-${type}`;
  alertBox.classList.remove('hidden');
  setTimeout(() => alertBox.classList.add('hidden'), 5000);
}

// --- Carga de Solicitudes ---
async function cargarSolicitudes() {
  toggleSpinner(true);
  try {
    // CORRECCIÓN: usando fetchAPI del service en vez de fetch directo
    allSolicitudes = await fetchAPI('/solicitudes');
    renderTablaSolicitudes(allSolicitudes);
  } catch (error) {
    console.error('Error en cargarSolicitudes:', error);
    showAlert('No pudimos cargar las solicitudes. Verifica tu conexión e inténtalo de nuevo.', 'error');
  } finally {
    toggleSpinner(false);
  }
}

// --- Renderizado de Tabla ---
function renderTablaSolicitudes(data) {
  const tbody = document.getElementById('tbody-solicitudes');
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay solicitudes que coincidan con los filtros.</td></tr>`;
    return;
  }

  data.forEach(sol => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sol.empresa || 'N/A'}</td>
      <td>${sol.sector || 'N/A'}</td>
      <td>$${(sol.inversion || 0).toLocaleString()}</td>
      <td>${sol.empleos || 0}</td>
      <td><span class="badge badge-${(sol.clasificacionIA || 'revisar').toLowerCase()}">${sol.puntajeIA || 'N/A'}</span></td>
      <td>${sol.estadoHumano || 'Pendiente'}</td>
      <td><button class="btn btn-secondary btn-sm" data-id="${sol.id}">Evaluar</button></td>
    `;
    // CORRECCIÓN: event listener en vez de onclick inline (compatible con modules)
    tr.querySelector('button').addEventListener('click', () => mostrarDetalle(sol.id));
    tbody.appendChild(tr);
  });
}

// --- Filtros Dinámicos ---
function filtrarSolicitudes() {
  const estadoFiltro = document.getElementById('filter-estado').value;
  const sectorFiltro = document.getElementById('filter-sector').value;

  const filtradas = allSolicitudes.filter(sol => {
    // CORRECCIÓN: comparar contra clasificacionIA (campo real del db.json)
    const estadoReal = (sol.clasificacionIA || '').toLowerCase();
    const matchEstado = estadoFiltro === 'todas' || estadoReal === estadoFiltro;
    const matchSector = sectorFiltro === 'todos' || sol.sector === sectorFiltro;
    return matchEstado && matchSector;
  });

  renderTablaSolicitudes(filtradas);
}

// --- Evaluación de IA (Human-in-the-Loop) ---
async function mostrarDetalle(id) {
  selectedSolicitudId = id;
  const panel = document.getElementById('ia-evaluation-panel');
  panel.classList.remove('hidden');

  try {
    const solicitud = await fetchAPI(`/solicitudes/${id}`);

    // CORRECCIÓN: campos correctos del db.json
    document.getElementById('ia-puntaje').textContent = solicitud.puntajeIA || 0;
    document.getElementById('ia-justificacion').textContent =
      solicitud.justificacionIA || 'Sin justificación de IA registrada.';

    const progressBar = document.getElementById('ia-progress-bar');
    progressBar.style.width = `${solicitud.puntajeIA || 0}%`;

  } catch (error) {
    showAlert('Error al cargar el detalle de la solicitud.', 'error');
  }
}

// --- Decisión Humana ---
async function actualizarEstadoSolicitud(nuevoEstado) {
  if (!selectedSolicitudId) return;

  try {
    // CORRECCIÓN: estadoHumano es el campo de decisión del analista
    await fetchAPI(`/solicitudes/${selectedSolicitudId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        estadoHumano:   nuevoEstado,
        fechaDecision:  new Date().toISOString(),
        analistaId:     session.id,
      }),
    });

    showAlert(`Solicitud marcada como "${nuevoEstado}" exitosamente.`, 'success');
    document.getElementById('ia-evaluation-panel').classList.add('hidden');
    await cargarSolicitudes();
  } catch (error) {
    showAlert('Ocurrió un error al guardar tu decisión.', 'error');
  }
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
  cargarSolicitudes();

  document.getElementById('btn-apply-filters')?.addEventListener('click', filtrarSolicitudes);
  // CORRECCIÓN: estados en español minúscula alineados con db.json
  document.getElementById('btn-aprobar')?.addEventListener('click',  () => actualizarEstadoSolicitud('Recomendada'));
  document.getElementById('btn-revisar')?.addEventListener('click',  () => actualizarEstadoSolicitud('Revisar'));
  document.getElementById('btn-rechazar')?.addEventListener('click', () => actualizarEstadoSolicitud('Rechazada'));
});
