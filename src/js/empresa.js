import { getSesion, logout } from '../services/auth.service.js';
import { crearSolicitud } from '../services/solicitudes.service.js';
import { fetchAPI } from '../services/api.js';

const session = getSesion();
let zonaFrancaId = null;

document.getElementById('user-email-display').textContent = session.email;

document.getElementById('btn-logout').addEventListener('click', () => {
  logout();
  window.location.href = '../pages/login.html';
});

function mostrarAlerta(mensaje, tipo = 'error') {
  const alerta = document.getElementById('alert-message');

  alerta.textContent = mensaje;
  alerta.className = `alert-banner alert-${tipo}`;
  alerta.classList.remove('hidden');

  setTimeout(() => alerta.classList.add('hidden'), 5000);
}

async function inicializar() {
  try {
    const [empresas, zonasFrancas] = await Promise.all([
      fetchAPI(`/empresas?id=${session.empresaId}`),
      fetchAPI('/zonas_francas'),
    ]);

    const empresa = empresas[0];

    if (!empresa) {
      throw new Error('No se encontró la empresa asociada a la sesión.');
    }

    zonaFrancaId = empresa.zonaFrancaId;

    document.getElementById('empresa-nombre').value = empresa.nombre;

    const selectSector = document.getElementById('empresa-sector');
    const zonaFranca = zonasFrancas.find(
      (zona) => zona.id === zonaFrancaId
    );

    if (!zonaFranca) {
      throw new Error('La zona franca asociada a la empresa no existe.');
    }

    selectSector.innerHTML = '<option value="">Seleccione...</option>';

    zonaFranca.sectores.forEach((sector) => {
      const option = document.createElement('option');
      option.value = sector;
      option.textContent = sector;
      selectSector.appendChild(option);
    });

    if (empresa.sector) {
      selectSector.value = empresa.sector;
    }
  } catch (error) {
    mostrarAlerta(error.message || 'Error al cargar los datos iniciales.');
  }
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    document.querySelectorAll('.tab-btn').forEach((boton) => {
      boton.classList.remove('active');
    });

    btn.classList.add('active');

    document.getElementById('tab-solicitud').classList.add('hidden');
    document.getElementById('tab-reporte').classList.add('hidden');
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
  });
});

document
  .getElementById('form-solicitud')
  .addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('btn-guardar-solicitud');
    const spinner = document.getElementById('spinner-solicitud');

    btn.disabled = true;
    spinner.classList.remove('hidden');

    try {
      if (!zonaFrancaId) {
        throw new Error('No se pudo identificar la zona franca de la empresa.');
      }

      const archivos = document.getElementById('doc-respaldo').files;
      const documentos = Array.from(archivos).map((archivo) => archivo.name);

      await crearSolicitud({
        empresaId: session.empresaId,
        zonaFrancaId,
        empresa: document.getElementById('empresa-nombre').value,
        sector: document.getElementById('empresa-sector').value,
        inversion: parseFloat(
          document.getElementById('inversion-proyectada').value
        ),
        empleos: parseInt(
          document.getElementById('empleos-proyectados').value,
          10
        ),
        exportaciones: 0,
        documentos,
      });

      mostrarAlerta('Solicitud enviada correctamente.', 'success');
      e.target.reset();
    } catch (error) {
      mostrarAlerta(error.message || 'No se pudo enviar la solicitud.');
    } finally {
      btn.disabled = false;
      spinner.classList.add('hidden');
    }
  });

document
  .getElementById('form-reporte')
  .addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('btn-enviar-reporte');
    const spinner = document.getElementById('spinner-reporte');

    btn.disabled = true;
    spinner.classList.remove('hidden');

    try {
      await fetchAPI('/reportes_cumplimiento', {
        method: 'POST',
        body: JSON.stringify({
          empresaId: session.empresaId,
          empresa: session.nombre || session.email,
          inversionReal: parseFloat(
            document.getElementById('inversion-ejecutada').value
          ),
          empleosReales: parseInt(
            document.getElementById('empleos-reales').value,
            10
          ),
          exportacionesReales: parseFloat(
            document.getElementById('exportaciones-totales').value
          ),
          periodo: new Date().toISOString(),
        }),
      });

      mostrarAlerta('Reporte enviado correctamente.', 'success');
      e.target.reset();
    } catch (error) {
      mostrarAlerta('No se pudo enviar el reporte. Intentá de nuevo.');
    } finally {
      btn.disabled = false;
      spinner.classList.add('hidden');
    }
  });

inicializar();