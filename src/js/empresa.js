// empresa.js
import { getSession, logout } from '../services/auth.service.js';
import { postSolicitud } from '../services/solicitudes.service.js';
import { evaluarSolicitud } from '../services/ia.service.js';

// --- Sesión ---
const session = getSession();
document.getElementById('user-email-display').textContent = session.email;
document.getElementById('btn-logout').addEventListener('click', logout);

// --- Tabs ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.getElementById('tab-solicitud').classList.add('hidden');
    document.getElementById('tab-reporte').classList.add('hidden');
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
  });
});

// --- Alerta ---
function mostrarAlerta(mensaje, tipo = 'error') {
  const alerta = document.getElementById('alert-message');
  alerta.textContent = mensaje;
  alerta.className = `alert-banner alert-${tipo}`;
  alerta.classList.remove('hidden');
  setTimeout(() => alerta.classList.add('hidden'), 5000);
}

// --- Formulario Solicitud ---
document.getElementById('form-solicitud').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('btn-guardar-solicitud');
  const spinner = document.getElementById('spinner-solicitud');

  btn.disabled = true;
  spinner.classList.remove('hidden');

  try {
    const datos = {
      empresaId:           session.empresaId,
      empresaNombre:       document.getElementById('empresa-nombre').value,
      sector:              document.getElementById('empresa-sector').value,
      inversionProyectada: parseFloat(document.getElementById('inversion-proyectada').value),
      empleosProyectados:  parseInt(document.getElementById('empleos-proyectados').value),
      fechaEnvio:          new Date().toISOString(),
    };

    // IA evalúa — solo recomienda, no decide
    const { puntaje, justificacion, estadoIa } = await evaluarSolicitud(datos);

    await postSolicitud({
      ...datos,
      puntajeIa:      puntaje,
      justificacionIa: justificacion,
      estadoIa,
      estado:         'Pendiente',
      fechaRevision:  null,
      analistaResponsable: null,
    });

    mostrarAlerta('Solicitud enviada correctamente.', 'success');
    e.target.reset();

  } catch (error) {
    mostrarAlerta('No se pudo enviar la solicitud. Intentá de nuevo.', 'error');
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
  }
});