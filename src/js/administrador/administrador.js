// administrador.js
import { getSesion, logout } from '../../services/auth.service.js';
import { fetchAPI } from '../../services/api.js';

// --- Sesión ---
const session = getSesion();

// CORRECCIÓN: logout con redirección
document.getElementById('btn-logout').addEventListener('click', () => {
  logout();
  window.location.href = '../pages/login.html';
});

// --- Helpers de UI ---
function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alert-message');
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.className = `alert-banner alert-${type}`;
  alertBox.classList.remove('hidden');
  setTimeout(() => alertBox.classList.add('hidden'), 5000);
}

// --- CRUD Zonas Francas ---
async function listarZonasFrancas() {
  try {
    // CORRECCIÓN: /zonas_francas con guión bajo
    const zonas = await fetchAPI('/zonas_francas');
    const container = document.getElementById('lista-zonas-francas');
    if (!container) return;

    container.innerHTML = '';
    if (zonas.length === 0) {
      container.innerHTML = '<p>No hay zonas francas registradas aún.</p>';
      return;
    }

    zonas.forEach(zona => {
      const div = document.createElement('div');
      div.className = 'card card-body mt-2';
      div.innerHTML = `
        <h4>${zona.nombre}</h4>
        <p><strong>Ubicación:</strong> ${zona.ubicacion || 'N/A'}</p>
        <p><strong>Sectores:</strong> ${(zona.sectores || []).join(', ')}</p>
        <p><strong>Empresas activas:</strong> ${zona.empresasActivas || 0} / ${zona.capacidadEmpresas || 0}</p>
        <button class="btn btn-danger btn-sm" data-id="${zona.id}">Eliminar</button>
      `;
      div.querySelector('button').addEventListener('click', () => eliminarZonaFranca(zona.id));
      container.appendChild(div);
    });
  } catch (error) {
    showAlert('No se pudieron cargar las Zonas Francas configuradas.', 'error');
  }
}

async function guardarZonaFranca(event) {
  event.preventDefault();
  const form = event.target;

  const data = {
    nombre:            form['nombre-zona'].value,
    inversionMinima:   parseFloat(form['min-inversion'].value),
    empleosMinimos:    parseInt(form['min-empleos'].value),
    sectores:          Array.from(form['sectores-autorizados'].selectedOptions).map(opt => opt.value),
    ubicacion:         'Costa Rica',
    capacidadEmpresas: 50,
    empresasActivas:   0,
    estado:            'activa',
  };

  try {
    // CORRECCIÓN: /zonas_francas con guión bajo
    await fetchAPI('/zonas_francas', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    showAlert('Zona Franca registrada correctamente.', 'success');
    form.reset();
    listarZonasFrancas();
  } catch (error) {
    showAlert('Falló el registro de la Zona Franca.', 'error');
  }
}

async function eliminarZonaFranca(id) {
  if (!confirm('¿Estás seguro de eliminar esta Zona Franca?')) return;

  try {
    // CORRECCIÓN: /zonas_francas con guión bajo
    await fetchAPI(`/zonas_francas/${id}`, { method: 'DELETE' });
    showAlert('Zona Franca eliminada.', 'success');
    listarZonasFrancas();
  } catch (error) {
    showAlert('No se pudo eliminar el registro.', 'error');
  }
}

// --- Detección de Alertas de Incumplimiento ---
async function obtenerAlertasIncumplimiento() {
  const contenedor = document.getElementById('contenedor-alertas');
  contenedor.innerHTML = '<p>Buscando incumplimientos...</p>';

  try {
    // CORRECCIÓN: /reportes_cumplimiento con guión bajo en ambas colecciones
    const [reportes, solicitudes] = await Promise.all([
      fetchAPI('/reportes_cumplimiento'),
      fetchAPI('/solicitudes'),
    ]);

    // Filtrar solo solicitudes aprobadas (estadoHumano = "Recomendada")
    const aprobadas = solicitudes.filter(s =>
      s.estadoHumano === 'Recomendada' || s.estadoHumano === 'aprobada'
    );

    const alertas = [];

    reportes.forEach(reporte => {
      const solicitudOriginal = aprobadas.find(s => s.empresaId === reporte.empresaId);
      if (!solicitudOriginal) return;

      const esInversionBaja = reporte.inversionReal < (solicitudOriginal.inversion * 0.8);
      const esEmpleoBajo    = reporte.empleosReales < (solicitudOriginal.empleos * 0.8);

      if (esInversionBaja || esEmpleoBajo) {
        alertas.push({
          empresa: reporte.empresa,
          tipo:    (esInversionBaja && esEmpleoBajo) ? 'danger' : 'warning',
          mensaje: `Inversión real: $${(reporte.inversionReal || 0).toLocaleString()} / Empleos reales: ${reporte.empleosReales || 0}`,
        });
      }
    });

    contenedor.innerHTML = '';
    if (alertas.length === 0) {
      contenedor.innerHTML = '<div class="alert-banner alert-success">Todo en orden. No hay incumplimientos detectados.</div>';
      return;
    }

    alertas.forEach(alerta => {
      const card = document.createElement('div');
      card.className = `card card-alert card-alert-${alerta.tipo} mb-2`;
      card.innerHTML = `
        <div class="card-body">
          <h5>${alerta.empresa}</h5>
          <p>${alerta.mensaje}</p>
        </div>
      `;
      contenedor.appendChild(card);
    });

  } catch (error) {
    contenedor.innerHTML = '';
    showAlert('Error al procesar las alertas de incumplimiento.', 'error');
  }
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
  listarZonasFrancas();
  obtenerAlertasIncumplimiento();

  document.getElementById('form-criterios')?.addEventListener('submit', guardarZonaFranca);
});
