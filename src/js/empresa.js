// empresa.js
import { getSesion, logout } from '../services/auth.service.js';
import { crearSolicitud } from '../services/solicitudes.service.js';
import { recomendarClasificacion } from '../services/ia.service.js';
import { fetchAPI } from '../services/api.js';

// --- Sesión ---
const session = getSesion();
document.getElementById('user-email-display').textContent = session.email;
document.getElementById('btn-logout').addEventListener('click', logout);

// --- Alerta ---
function mostrarAlerta(mensaje, tipo = 'error') {
  const alerta = document.getElementById('alert-message');
  alerta.textContent = mensaje;
  alerta.className = `alert-banner alert-${tipo}`;
  alerta.classList.remove('hidden');
  setTimeout(() => alerta.classList.add('hidden'), 5000);
}

// --- Carga inicial con Promise.all ---
async function inicializar() {
  try {
    const [empresas, zonasFrancas] = await Promise.all([
      fetchAPI(`/empresas?id=${session.empresaId}`),
      fetchAPI('/zonas_francas'),
    ]);

    const empresa = empresas[0];
    if (empresa) {
      document.getElementById('empresa-nombre').value = empresa.nombre;
    }

    const selectSector = document.getElementById('empresa-sector');
    const sectoresUnicos = [...new Set(zonasFrancas.flatMap(z => z.sectores))];

    selectSector.innerHTML = '<option value="">Seleccione...</option>';
    sectoresUnicos.forEach(sector => {
      const option = document.createElement('option');
      option.value = sector;
      option.textContent = sector.charAt(0).toUpperCase() + sector.slice(1);
      selectSector.appendChild(option);
    });

  } catch (error) {
    mostrarAlerta('Error al cargar los datos iniciales.', 'error');
  }
}

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
    // Mapeamos a los campos que espera ia.service.js
    const { puntaje, clasificacion } = await recomendarClasificacion({
      inversion:     datos.inversionProyectada,
      empleos:       datos.empleosProyectados,
      exportaciones: 0,
    });

    await crearSolicitud({
      ...datos,
      puntajeIa:           puntaje,
      estadoIa:            clasificacion,
      justificacionIa:     `Puntaje IA: ${puntaje}/100. Clasificación: ${clasificacion}.`,
      estado:              'Pendiente',
      fechaRevision:       null,
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

// --- Arrancar ---
inicializar();