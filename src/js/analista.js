// analista.js
const API_URL = 'http://localhost:3001';

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
    alertBox.className = `alert-banner alert-${type}`; // limpia clases previas
    alertBox.classList.remove('hidden');
    setTimeout(() => alertBox.classList.add('hidden'), 5000);
}

// --- Carga de Solicitudes ---
async function cargarSolicitudes() {
    toggleSpinner(true);
    try {
        const response = await fetch(`${API_URL}/solicitudes`);
        if (!response.ok) throw new Error('Error al obtener las solicitudes del servidor.');
        
        allSolicitudes = await response.json();
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
            <td>${sol.empresaNombre || 'N/A'}</td>
            <td>${sol.sector || 'N/A'}</td>
            <td>$${(sol.inversionProyectada || 0).toLocaleString()}</td>
            <td>${sol.empleosProyectados || 0}</td>
            <td><span class="badge badge-${sol.estadoIa || 'revisar'}">${sol.puntajeIa || 'N/A'}</span></td>
            <td>${sol.estado}</td>
            <td><button class="btn btn-secondary btn-sm" onclick="mostrarDetalle(${sol.id})">Evaluar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Filtros Dinámicos ---
function filtrarSolicitudes() {
    const estadoFiltro = document.getElementById('filter-estado').value;
    const sectorFiltro = document.getElementById('filter-sector').value;

    const filtradas = allSolicitudes.filter(sol => {
        const matchEstado = estadoFiltro === 'todas' || sol.estado.toLowerCase() === estadoFiltro;
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
        const response = await fetch(`${API_URL}/solicitudes/${id}`);
        if (!response.ok) throw new Error('Solicitud no encontrada.');
        
        const solicitud = await response.json();

        // Actualizar UI con datos de la IA
        document.getElementById('ia-puntaje').textContent = solicitud.puntajeIa || 0;
        document.getElementById('ia-justificacion').textContent = solicitud.justificacionIa || 'Sin justificación de IA registrada.';
        
        const progressBar = document.getElementById('ia-progress-bar');
        progressBar.style.width = `${solicitud.puntajeIa || 0}%`;

    } catch (error) {
        showAlert('Error al cargar el detalle de la solicitud.', 'error');
    }
}

// --- Decisión Humana ---
async function actualizarEstadoSolicitud(nuevoEstado) {
    if (!selectedSolicitudId) return;

    try {
        const response = await fetch(`${API_URL}/solicitudes/${selectedSolicitudId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: nuevoEstado,
                fechaRevision: new Date().toISOString(),
                analistaResponsable: 'Analista Demo' // En un sistema real, viene del JWT/Session
            })
        });

        if (!response.ok) throw new Error('No se pudo actualizar el estado.');
        
        showAlert(`Solicitud marcada como ${nuevoEstado} exitosamente.`, 'success');
        document.getElementById('ia-evaluation-panel').classList.add('hidden');
        await cargarSolicitudes(); // Recargar tabla
    } catch (error) {
        showAlert('Ocurrió un error al guardar tu decisión.', 'error');
    }
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    cargarSolicitudes();

    document.getElementById('btn-apply-filters')?.addEventListener('click', filtrarSolicitudes);
    document.getElementById('btn-aprobar')?.addEventListener('click', () => actualizarEstadoSolicitud('Aprobada'));
    document.getElementById('btn-revisar')?.addEventListener('click', () => actualizarEstadoSolicitud('Revisar'));
    document.getElementById('btn-rechazar')?.addEventListener('click', () => actualizarEstadoSolicitud('Rechazada'));
});