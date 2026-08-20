// empresa.js — fusiona reporte.js
import { getSesion, logout } from '../services/auth.service.js';
import { crearSolicitud } from '../services/solicitudes.service.js';
import { recomendarClasificacion } from '../services/ia.service.js';
import { fetchAPI } from '../services/api.js';

// --- Sesión ---
const session = getSesion();
document.getElementById('user-email-display').textContent = session.email;

// CORRECCIÓN: logout con redirección
document.getElementById('btn-logout').addEventListener('click', () => {
  logout();
  window.location.href = '../pages/login.html';
});

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
      fetchAPI('/zonas_francas'),  // CORRECCIÓN: guión bajo
    ]);

    // CORRECCIÓN: json-server con ?id= retorna array, tomamos [0]
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
    const inversion = parseFloat(document.getElementById('inversion-proyectada').value);
    const empleos   = parseInt(document.getElementById('empleos-proyectados').value);

    // IA evalúa — solo recomienda, nunca decide
    const { puntaje, clasificacion } = await recomendarClasificacion({
      inversion,
      empleos,
      exportaciones: 0,
    });

    // CORRECCIÓN: campos alineados con db.json real
    await crearSolicitud({
      empresaId:        session.empresaId,
      empresa:          document.getElementById('empresa-nombre').value,
      sector:           document.getElementById('empresa-sector').value,
      inversion,
      empleos,
      exportaciones:    0,
      puntajeIA:        puntaje,
      clasificacionIA:  clasificacion,
      justificacionIA:  `Puntaje IA: ${puntaje}/100. Clasificación sugerida: ${clasificacion}. Decisión final pendiente del analista.`,
      estadoHumano:     null,
      fecha:            new Date().toISOString(),
      fechaDecision:    null,
      analistaId:       null,
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

// --- Formulario Reporte (fusionado desde reporte.js) ---
document.getElementById('form-reporte').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('btn-enviar-reporte');
  const spinner = document.getElementById('spinner-reporte');

  btn.disabled = true;
  spinner.classList.remove('hidden');

  try {
    const datos = {
      empresaId:            session.empresaId,
      empresa:              session.nombre || session.email,
      inversionReal:        parseFloat(document.getElementById('inversion-ejecutada').value),
      empleosReales:        parseInt(document.getElementById('empleos-reales').value),
      exportacionesReales:  parseFloat(document.getElementById('exportaciones-totales').value),
      periodo:              new Date().toISOString(),
    };

    // CORRECCIÓN: colección correcta con guión bajo
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

// --- Arrancar ---
inicializar();
