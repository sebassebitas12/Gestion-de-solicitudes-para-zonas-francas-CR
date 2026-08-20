// administrador.js
const API_URL = 'http://localhost:3001';

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
        const response = await fetch(`${API_URL}/zonasFrancas`);
        if (!response.ok) throw new Error('Error al cargar zonas francas.');
        
        const zonas = await response.json();
        const container = document.getElementById('lista-zonas-francas');
        if (!container) return;

        container.innerHTML = '';
        zonas.forEach(zona => {
            const div = document.createElement('div');
            div.className = 'card card-body mt-2';
            div.innerHTML = `
                <h4>${zona.nombre}</h4>
                <p><strong>Inversión Mínima:</strong> $${zona.inversionMinima.toLocaleString()}</p>
                <p><strong>Empleos Mínimos:</strong> ${zona.empleosMinimos}</p>
                <button class="btn btn-danger btn-sm" onclick="eliminarZonaFranca(${zona.id})">Eliminar</button>
            `;
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
        nombre: form['nombre-zona'].value,
        inversionMinima: parseFloat(form['min-inversion'].value),
        empleosMinimos: parseInt(form['min-empleos'].value),
        sectores: Array.from(form['sectores-autorizados'].selectedOptions).map(opt => opt.value)
    };

    try {
        const response = await fetch(`${API_URL}/zonasFrancas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error al guardar.');
        
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
        const response = await fetch(`${API_URL}/zonasFrancas/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar.');
        
        showAlert('Zona Franca eliminada.', 'success');
        listarZonasFrancas();
    } catch (error) {
        showAlert('No se pudo eliminar el registro.', 'error');
    }
}

// --- Detección de Alertas ---
async function obtenerAlertasIncumplimiento() {
    const contenedor = document.getElementById('contenedor-alertas');
    contenedor.innerHTML = '<p>Buscando incumplimientos...</p>';

    try {
        // Obtenemos reportes y solicitudes aprobadas en paralelo
        const [reportesRes, solicitudesRes] = await Promise.all([
            fetch(`${API_URL}/reportesCumplimiento`),
            fetch(`${API_URL}/solicitudes?estado=Aprobada`)
        ]);

        if (!reportesRes.ok || !solicitudesRes.ok) throw new Error('Error obteniendo datos para alertas.');

        const reportes = await reportesRes.json();
        const solicitudes = await solicitudesRes.json();

        const alertas = [];
        
        // Lógica de comparación
        reportes.forEach(reporte => {
            const solicitudOriginal = solicitudes.find(s => s.empresaId === reporte.empresaId);
            if (!solicitudOriginal) return;

            // Umbrales de prueba: 80% de lo prometido
            const esInversionBaja = reporte.inversionEjecutada < (solicitudOriginal.inversionProyectada * 0.8);
            const esEmpleoBajo = reporte.empleosReales < (solicitudOriginal.empleosProyectados * 0.8);

            if (esInversionBaja || esEmpleoBajo) {
                alertas.push({
                    empresa: reporte.empresaNombre,
                    tipo: esInversionBaja && esEmpleoBajo ? 'danger' : 'warning',
                    mensaje: `Inversión ejecutada: $${reporte.inversionEjecutada} / Empleos reales: ${reporte.empleosReales}`
                });
            }
        });

        // Renderizar alertas
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