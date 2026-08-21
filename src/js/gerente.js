// gerente.js
import { getSesion, logout } from '../services/auth.service.js';
import { fetchAPI } from '../services/api.js';

// --- Sesión ---
const session = getSesion();

// CORRECCIÓN: logout con redirección
document.getElementById('btn-logout').addEventListener('click', () => {
  logout();
  window.location.href = '../pages/login.html';
});

function showSpinner(show) {
  document.querySelectorAll('.spinner-container').forEach(el => el.classList.toggle('hidden', !show));
}

function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alert-message');
  alertBox.textContent = message;
  alertBox.className = `alert-banner alert-${type}`;
  alertBox.classList.remove('hidden');
}

// --- Carga Paralela y KPIs ---
async function cargarMetricsDashboard() {
  showSpinner(true);
  try {
    // CORRECCIÓN: /reportes_cumplimiento y /zonas_francas con guión bajo
    const [solicitudes, empresas, reportes, zonas] = await Promise.all([
      fetchAPI('/solicitudes'),
      fetchAPI('/empresas'),
      fetchAPI('/reportes_cumplimiento'),
      fetchAPI('/zonas_francas'),
    ]);

    // CORRECCIÓN: estadoHumano === 'Recomendada' (minúscula, campo real del db.json)
    const aprobadas = solicitudes.filter(s =>
      s.estadoHumano === 'Recomendada' || s.estadoHumano === 'aprobada'
    );

    const totalSolicitudes    = solicitudes.length;
    const porcentajeAprobadas = totalSolicitudes > 0
      ? ((aprobadas.length / totalSolicitudes) * 100).toFixed(1)
      : 0;

    // CORRECCIÓN: campos reales del db.json (inversion, empleos)
    const inversionCaptada  = aprobadas.reduce((sum, s) => sum + (s.inversion || 0), 0);
    const empleosProyectados = aprobadas.reduce((sum, s) => sum + (s.empleos || 0), 0);
    const promedioEmpleos   = aprobadas.length > 0
      ? Math.round(empleosProyectados / aprobadas.length)
      : 0;

    // Actualizar DOM
    document.getElementById('kpi-total-solicitudes').textContent   = totalSolicitudes;
    document.getElementById('kpi-porcentaje-aprobadas').textContent = `${porcentajeAprobadas}%`;
    document.getElementById('kpi-inversion-captada').textContent   = `$${inversionCaptada.toLocaleString('en-US')}`;
    document.getElementById('kpi-tiempo-respuesta').textContent    = `${promedioEmpleos} empleados`;

    // Resumen de inversión por empresa
    renderResumenInversion(aprobadas);

    console.log('Datos listos para graficar por sector:', zonas);

  } catch (error) {
    console.error('Error en cargarMetricsDashboard:', error);
    showAlert('No fue posible consolidar las métricas ejecutivas en este momento.', 'error');
  } finally {
    showSpinner(false);
  }
}

// --- Resumen de inversión en el DOM ---
function renderResumenInversion(aprobadas) {
  const contenedor = document.getElementById('resumen-inversion');
  if (!contenedor) return;

  if (aprobadas.length === 0) {
    contenedor.innerHTML = '<p>No hay solicitudes aprobadas aún.</p>';
    return;
  }

  contenedor.innerHTML = aprobadas.map(s => `
    <div class="summary-item">
      <span class="summary-empresa">${s.empresa || 'N/A'}</span>
      <span class="summary-valor">$${(s.inversion || 0).toLocaleString('en-US')}</span>
    </div>
  `).join('');
}

// --- Exportación de Reporte PROCOMER ---
async function exportarReportePROCOMER() {
  const btn = document.getElementById('btn-exportar-procomer');
  btn.classList.add('btn-loading');

  try {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // CORRECCIÓN: /reportes_cumplimiento con guión bajo
    const [solicitudes, reportes] = await Promise.all([
      fetchAPI('/solicitudes'),
      fetchAPI('/reportes_cumplimiento'),
    ]);

    const aprobadas = solicitudes.filter(s =>
      s.estadoHumano === 'Recomendada' || s.estadoHumano === 'aprobada'
    );

    const reporteConsolidado = {
      fechaGeneracion:               new Date().toISOString(),
      entidad:                       'PROCOMER - Zonas Francas',
      totalEmpresasActivas:          aprobadas.length,
      reportesCumplimientoRecibidos: reportes.length,
      // CORRECCIÓN: campos reales del db.json
      resumenInversiones: aprobadas.map(s => ({
        empresa:   s.empresa,
        inversion: s.inversion,
        empleos:   s.empleos,
      })),
    };

    const blob = new Blob([JSON.stringify(reporteConsolidado, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Reporte_Procomer_${new Date().getFullYear()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showAlert('Reporte PROCOMER generado y descargado exitosamente.', 'success');

  } catch (error) {
    showAlert('Falló la exportación del reporte ejecutivo.', 'error');
  } finally {
    btn.classList.remove('btn-loading');
  }
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
  cargarMetricsDashboard();
  document.getElementById('btn-exportar-procomer')?.addEventListener('click', exportarReportePROCOMER);
});
