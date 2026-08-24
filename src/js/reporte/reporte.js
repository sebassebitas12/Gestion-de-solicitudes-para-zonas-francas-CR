// reporte.js
import { getSesion } from '../../services/auth.service.js';
import { fetchAPI } from '../../services/api.js';

const session = getSesion();

// --- Alerta ---
function mostrarAlerta(mensaje, tipo = 'error') {
  const alerta = document.getElementById('alert-message');
  alerta.textContent = mensaje;
  alerta.className = `alert-banner alert-${tipo}`;
  alerta.classList.remove('hidden');
  setTimeout(() => alerta.classList.add('hidden'), 5000);
}

// --- Formulario Reporte ---
document.getElementById('form-reporte').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('btn-enviar-reporte');
  const spinner = document.getElementById('spinner-reporte');

  btn.disabled = true;
  spinner.classList.remove('hidden');

  try {
    const datos = {
      empresaId:            session.empresaId,
      empresaNombre:        session.nombre || session.email,
      inversionEjecutada:   parseFloat(document.getElementById('inversion-ejecutada').value),
      empleosReales:        parseInt(document.getElementById('empleos-reales').value),
      exportacionesTotales: parseFloat(document.getElementById('exportaciones-totales').value),
      fechaReporte:         new Date().toISOString(),
    };

    await fetchAPI('/reportes_cumplimiento', {
      method: 'POST',
      body: JSON.stringify(datos),
    });

    mostrarAlerta('Reporte enviado correctamente.', 'success');
    e.target.reset();

  } catch (error) {
    mostrarAlerta('No se pudo enviar el reporte. Intentá de nuevo.', 'error');
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
  }
});