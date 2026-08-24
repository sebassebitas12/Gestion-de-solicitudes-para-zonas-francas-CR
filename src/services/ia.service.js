import { fetchAPI } from './api.js';

function normalizarTexto(valor) {
  return String(valor ?? '').trim().toLocaleLowerCase('es');
}

function validarSolicitud(solicitud) {
  if (!solicitud?.zonaFrancaId) {
    throw new Error('La solicitud debe incluir zonaFrancaId.');
  }

  if (!solicitud.sector) {
    throw new Error('La solicitud debe incluir un sector.');
  }

  if (
    !Number.isFinite(Number(solicitud.inversion)) ||
    !Number.isFinite(Number(solicitud.empleos))
  ) {
    throw new Error('La inversión y los empleos deben ser números válidos.');
  }
}

export function recomendarClasificacion(solicitud, zonaFranca) {
  validarSolicitud(solicitud);

  if (!zonaFranca) {
    throw new Error('No se encontró la zona franca seleccionada.');
  }

  const cumpleInversion =
    Number(solicitud.inversion) >= Number(zonaFranca.inversionMinima);

  const cumpleEmpleos =
    Number(solicitud.empleos) >= Number(zonaFranca.empleosMinimos);

  const cumpleSector = zonaFranca.sectores.some(
    (sector) =>
      normalizarTexto(sector) === normalizarTexto(solicitud.sector)
  );

  let puntaje = 0;

  if (cumpleInversion) puntaje += 40;
  if (cumpleEmpleos) puntaje += 30;
  if (cumpleSector) puntaje += 30;

  let clasificacion;

  if (puntaje >= 75) {
    clasificacion = 'Recomendada';
  } else if (puntaje >= 50) {
    clasificacion = 'Revisar';
  } else {
    clasificacion = 'Rechazada';
  }

  const justificacion = [
    cumpleInversion
      ? `Cumple la inversión mínima de $${zonaFranca.inversionMinima.toLocaleString('en-US')}.`
      : `No cumple la inversión mínima de $${zonaFranca.inversionMinima.toLocaleString('en-US')}.`,
    cumpleEmpleos
      ? `Cumple los ${zonaFranca.empleosMinimos} empleos mínimos.`
      : `No cumple los ${zonaFranca.empleosMinimos} empleos mínimos.`,
    cumpleSector
      ? `El sector ${solicitud.sector} está autorizado en ${zonaFranca.nombre}.`
      : `El sector ${solicitud.sector} no está autorizado en ${zonaFranca.nombre}.`,
  ].join(' ');

  return {
    puntaje,
    clasificacion,
    justificacion,
  };
}

export async function evaluarSolicitud(solicitud) {
  try {
    validarSolicitud(solicitud);

    const zonaFranca = await fetchAPI(
      `/zonas_francas/${encodeURIComponent(solicitud.zonaFrancaId)}`
    );

    return {
      ...recomendarClasificacion(solicitud, zonaFranca),
      zonaFranca,
    };
  } catch (error) {
    throw new Error(`No se pudo evaluar la solicitud: ${error.message}`);
  }
}