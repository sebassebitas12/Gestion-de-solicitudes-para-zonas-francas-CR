// gerente.js
const API_URL = 'http://localhost:3001';

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
        // Promise.all para optimizar el tiempo de carga no bloqueante
        const [solicitudesRes, empresasRes, reportesRes, zonasRes] = await Promise.all([
            fetch(`${API_URL}/solicitudes`),
            fetch(`${API_URL}/empresas`),
            fetch(`${API_URL}/reportesCumplimiento`),
            fetch(`${API_URL}/zonasFrancas`)
        ]);

        if (!solicitudesRes.ok || !empresasRes.ok || !reportesRes.ok || !zonasRes.ok) {
            throw new Error('Fallo en una o más peticiones al servidor.');
        }

        const [solicitudes, empresas, reportes, zonas] = await Promise.all([
            solicitudesRes.json(),
            empresasRes.json(),
            reportesRes.json(),
            zonasRes.json()
        ]);

        // Cálculos de KPIs
        const totalSolicitudes = solicitudes.length;
        const aprobadas = solicitudes.filter(s => s.estado === 'Aprobada');
        const porcentajeAprobadas = totalSolicitudes > 0 ? (aprobadas.length / totalSolicitudes) * 100 : 0;
        
        const inversionCaptada = aprobadas.reduce((sum, s) => sum + (s.inversionProyectada || 0), 0);
        const empleosProyectados = aprobadas.reduce((sum, s) => sum + (s.empleosProyectados || 0), 0);
        const promedioEmpleos = aprobadas.length > 0 ? Math.round(empleosProyectados / aprobadas.length) : 0;

        // Actualizar DOM
        document.getElementById('kpi-total-solicitudes').textContent = totalSolicitudes;
        document.getElementById('kpi-porcentaje-aprobadas').textContent = `${porcentajeAprobadas.toFixed(1)}%`;
        document.getElementById('kpi-inversion-captada').textContent = `$${inversionCaptada.toLocaleString('en-US')}`;
        document.getElementById('kpi-tiempo-respuesta').textContent = `${promedioEmpleos} empleados`; // Reusando el span temporalmente

        // Poblar gráfico simulado (si existiera un canvas, aquí iría Chart.js)
        console.log('Datos listos para graficar por sector:', zonas);

    } catch (error) {
        console.error('Error en cargarMetricsDashboard:', error);
        showAlert('No fue posible consolidar las métricas ejecutivas en este momento.', 'error');
    } finally {
        showSpinner(false);
    }
}

// --- Exportación de Reporte PROCOMER ---
async function exportarReportePROCOMER() {
    const btn = document.getElementById('btn-exportar-procomer');
    btn.classList.add('btn-loading'); // Asume clase CSS para spinner en botón

    try {
        // Simulación de consolidación de datos
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simula delay de procesamiento

        const [solicitudesRes, reportesRes] = await Promise.all([
            fetch(`${API_URL}/solicitudes?estado=Aprobada`),
            fetch(`${API_URL}/reportesCumplimiento`)
        ]);

        const solicitudes = await solicitudesRes.json();
        const reportes = await reportesRes.json();

        const reporteConsolidado = {
            fechaGeneracion: new Date().toISOString(),
            entidad: "PROCOMER - Zonas Francas",
            totalEmpresasActivas: solicitudes.length,
            reportesCumplimientoRecibidos: reportes.length,
            resumenInversiones: solicitudes.map(s => ({
                empresa: s.empresaNombre,
                inversion: s.inversionProyectada
            }))
        };

        // Generar archivo JSON descargable
        const blob = new Blob([JSON.stringify(reporteConsolidado, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
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