import { fetchAPI } from './api.js';
import { evaluarSolicitud } from './ia.service.js';

export async function obtenerSolicitudes() {
  try {
    return await fetchAPI('/solicitudes');
  } catch (error) {
    throw new Error(`No se pudieron cargar las solicitudes: ${error.message}`);
  }
}

export async function crearSolicitud(datos) {
  try {
    const { puntaje, clasificacion, justificacion } =
      await evaluarSolicitud(datos);

    const fechaActual = new Date().toISOString();

    const nuevaSolicitud = {
      ...datos,
      documentos: Array.isArray(datos.documentos) ? datos.documentos : [],
      puntajeIA: puntaje,
      clasificacionIA: clasificacion,
      justificacionIA: justificacion,
      estado: 'pendiente',
      estadoHumano: 'Pendiente',
      analistaId: null,
      fecha: fechaActual,
      fechaEvaluacionIA: fechaActual,
      fechaDecision: null,
    };

    return await fetchAPI('/solicitudes', {
      method: 'POST',
      body: JSON.stringify(nuevaSolicitud),
    });
  } catch (error) {
    throw new Error(`No se pudo crear la solicitud: ${error.message}`);
  }
}

export async function actualizarSolicitud(id, cambios) {
  try {
    return await fetchAPI(`/solicitudes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(cambios),
    });
  } catch (error) {
    throw new Error(`No se pudo actualizar la solicitud: ${error.message}`);
  }
}

export async function evaluarYGuardarSolicitud(id) {
  try {
    const solicitud = await fetchAPI(
      `/solicitudes/${encodeURIComponent(id)}`
    );

    const { puntaje, clasificacion, justificacion } =
      await evaluarSolicitud(solicitud);

    return await actualizarSolicitud(id, {
      puntajeIA: puntaje,
      clasificacionIA: clasificacion,
      justificacionIA: justificacion,
      fechaEvaluacionIA: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(
      `No se pudo guardar la evaluación de IA: ${error.message}`
    );
  }
}

export async function evaluarSolicitudesPendientes() {
  try {
    const solicitudes = await obtenerSolicitudes();

    const pendientes = solicitudes.filter(
      (solicitud) =>
        solicitud.estado === 'pendiente' ||
        solicitud.estadoHumano === 'Pendiente'
    );

    return await Promise.all(
      pendientes.map((solicitud) => evaluarYGuardarSolicitud(solicitud.id))
    );
  } catch (error) {
    throw new Error(
      `No se pudieron procesar las solicitudes pendientes: ${error.message}`
    );
  }
}