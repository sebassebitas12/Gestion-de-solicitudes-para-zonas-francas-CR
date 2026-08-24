// ==========================================
// Procomer - CAPA DE DATOS DEL MÓDULO EMPRESA
// API real donde existe (solicitudes, alertas,
// historial, reportes) y datos derivados/mock
// preparados para conectar a una API futura.
// ==========================================

import { fetchAPI } from '../../services/api.js';


// ==========================================
// UTILIDADES COMPARTIDAS
// ==========================================

export function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
        return '';
    }

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


export function formatearFecha(fecha) {

    if (!fecha) {
        return 'Sin fecha';
    }

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {
        return String(fecha);
    }

    return fechaObj.toLocaleDateString(
        'es-CR',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }
    );
}


export function formatearMoneda(valor) {

    const numero = Number(valor || 0);

    return numero.toLocaleString(
        'en-US',
        {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }
    );
}


export function obtenerInicialesNombre(nombre) {

    const palabras =
        String(nombre || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (palabras.length === 0) {
        return 'EM';
    }

    if (palabras.length === 1) {
        return palabras[0].substring(0, 2).toUpperCase();
    }

    return (
        palabras[0].charAt(0) +
        palabras[1].charAt(0)
    ).toUpperCase();
}


function sumarDias(fecha, dias) {

    const fechaObj = new Date(fecha || Date.now());

    if (Number.isNaN(fechaObj.getTime())) {
        return null;
    }

    fechaObj.setDate(fechaObj.getDate() + dias);

    return fechaObj.toISOString();
}


// ==========================================
// DATOS REALES DESDE LA API
// ==========================================

export async function getSolicitudes(empresaId) {

    try {

        const solicitudes =
            await fetchAPI(
                `/solicitudes?empresaId=${encodeURIComponent(empresaId)}`
            );

        if (!Array.isArray(solicitudes)) {
            return [];
        }

        return solicitudes.sort(
            (a, b) =>
                new Date(b.fecha || 0) -
                new Date(a.fecha || 0)
        );

    } catch (error) {

        console.warn(
            'No se pudieron cargar las solicitudes:',
            error
        );

        return [];
    }
}


export async function getAlertasEmpresa(empresaId) {

    try {

        const alertas =
            await fetchAPI(
                `/alertas?empresaId=${encodeURIComponent(empresaId)}`
            );

        if (!Array.isArray(alertas)) {
            return [];
        }

        return alertas;

    } catch (error) {

        console.warn(
            'No se pudieron cargar las alertas:',
            error
        );

        return [];
    }
}


export async function getHistorialEmpresa(empresaId) {

    try {

        const historial =
            await fetchAPI(
                `/historial?empresaId=${encodeURIComponent(empresaId)}`
            );

        if (!Array.isArray(historial)) {
            return [];
        }

        return historial.sort(
            (a, b) =>
                new Date(b.fecha || 0) -
                new Date(a.fecha || 0)
        );

    } catch (error) {

        console.warn(
            'No se pudo cargar el historial:',
            error
        );

        return [];
    }
}


export async function getReportesCumplimiento(empresaId) {

    try {

        const reportes =
            await fetchAPI(
                `/reportes_cumplimiento?empresaId=${encodeURIComponent(empresaId)}`
            );

        if (!Array.isArray(reportes)) {
            return [];
        }

        return reportes;

    } catch (error) {

        console.warn(
            'No se pudieron cargar los reportes de cumplimiento:',
            error
        );

        return [];
    }
}


// ==========================================
// TRÁMITES (derivados de solicitudes reales)
// Cuando exista un recurso /tramites esta
// función se reemplaza por fetchAPI('/tramites').
// ==========================================

const ETAPAS_TRAMITE = [
    { etapa: 'Ingreso de solicitud', progreso: 15 },
    { etapa: 'Revisión de documentación', progreso: 45 },
    { etapa: 'Implementación del régimen', progreso: 70 },
    { etapa: 'Operación y cumplimiento', progreso: 100 }
];


export function derivarTramites(solicitudes) {

    const tramites = [];

    (solicitudes || []).forEach((solicitud) => {

        const estado =
            String(solicitud.estado || '')
                .toLowerCase();

        let indiceEtapa = 0;
        let estadoTramite = 'Pendiente';

        if (estado === 'en_revision' || estado === 'en revisión') {
            indiceEtapa = 1;
            estadoTramite = 'En proceso';
        } else if (estado === 'aprobada') {
            indiceEtapa = 2;
            estadoTramite = 'En proceso';
        } else if (estado === 'rechazada') {
            indiceEtapa = ETAPAS_TRAMITE.length - 1;
            estadoTramite = 'Finalizado';
        } else if (estado === 'completada') {
            indiceEtapa = ETAPAS_TRAMITE.length - 1;
            estadoTramite = 'Completado';
        }


        const tramite = {
            id: `TRA-${solicitud.id}`,
            solicitudId: solicitud.id,
            nombre:
                ETAPAS_TRAMITE[indiceEtapa].etapa,
            descripcion:
                solicitud.descripcion ||
                'Trámite asociado a la solicitud registrada.',
            responsable:
                solicitud.contactoNombre ||
                'Representante legal',
            estado: estadoTramite,
            progreso:
                ETAPAS_TRAMITE[indiceEtapa].progreso,
            fechaInicio: solicitud.fecha || null,
            fechaEstimada: sumarDias(
                solicitud.fecha,
                90
            ),
            etapas: construirEtapas(
                indiceEtapa,
                estadoTramite,
                solicitud.fecha
            )
        };


        if (
            estadoTramite !== 'Finalizado' &&
            Number(solicitud.puntajeIA || 0) < 50
        ) {
            tramite.prioridad = 'Alta';
        } else if (estadoTramite === 'Completado') {
            tramite.prioridad = 'Baja';
        } else {
            tramite.prioridad = 'Media';
        }


        tramites.push(tramite);

    });

    return tramites;
}


function construirEtapas(
    indiceActual,
    estadoTramite,
    fechaBase
) {

    return ETAPAS_TRAMITE.map((config, indice) => {

        let estadoEtapa = 'pendiente';

        if (indice < indiceActual) {
            estadoEtapa = 'completada';
        } else if (indice === indiceActual) {
            estadoEtapa =
                estadoTramite === 'Finalizado'
                    ? 'completada'
                    : 'activa';
        }

        return {
            nombre: config.etapa,
            estado: estadoEtapa,
            fecha: sumarDias(
                fechaBase,
                indice * 30
            )
        };

    });
}


// ==========================================
// DOCUMENTOS
// Los documentos base provienen de las
// solicitudes reales. El catálogo ampliado y
// los documentos subidos viven en localStorage
// hasta que exista un endpoint de archivos.
// ==========================================

const CLAVE_DOCUMENTOS = 'zofranca_documentos_';

const CATALOGO_DEMO = [
    {
        id: 'DOC-DEMO-001',
        nombre: 'Permiso_Operativo_Municipal.pdf',
        tipo: 'Permisos',
        estado: 'Vigente',
        fecha: sumarDias(new Date().toISOString(), -700),
        vencimiento: sumarDias(new Date().toISOString(), 400),
        solicitudId: null
    },
    {
        id: 'DOC-DEMO-002',
        nombre: 'Certificacion_Sostenibilidad.pdf',
        tipo: 'Certificaciones',
        estado: 'Por vencer',
        fecha: sumarDias(new Date().toISOString(), -340),
        vencimiento: sumarDias(new Date().toISOString(), 25),
        solicitudId: null
    },
    {
        id: 'DOC-DEMO-003',
        nombre: 'Contrato_Arrendamiento_ZF.pdf',
        tipo: 'Contratos',
        estado: 'Vigente',
        fecha: sumarDias(new Date().toISOString(), -200),
        vencimiento: sumarDias(new Date().toISOString(), 165),
        solicitudId: null
    },
    {
        id: 'DOC-DEMO-004',
        nombre: 'Declaracion_Inversiones_Q3.pdf',
        tipo: 'Declaraciones',
        estado: 'Vencido',
        fecha: sumarDias(new Date().toISOString(), -140),
        vencimiento: sumarDias(new Date().toISOString(), -40),
        solicitudId: null
    },
    {
        id: 'DOC-DEMO-005',
        nombre: 'Informe_Cumplimiento_Anual.pdf',
        tipo: 'Informes',
        estado: 'En revisión',
        fecha: sumarDias(new Date().toISOString(), -8),
        vencimiento: null,
        solicitudId: null
    }
];

const ICONOS_TIPO = {
    Permisos: 'workspace_premium',
    Certificaciones: 'verified',
    Contratos: 'history_edu',
    Declaraciones: 'summarize',
    Informes: 'description',
    Otros: 'draft'
};

const TIPOS_DOCUMENTO = Object.keys(ICONOS_TIPO);


function adivinarTipo(nombreArchivo) {

    const nombre =
        String(nombreArchivo).toLowerCase();

    if (nombre.includes('permiso')) return 'Permisos';
    if (nombre.includes('certif')) return 'Certificaciones';
    if (nombre.includes('contrato') || nombre.includes('carta')) return 'Contratos';
    if (nombre.includes('declaracion') || nombre.includes('declaración')) return 'Declaraciones';
    if (nombre.includes('informe') || nombre.includes('plan')) return 'Informes';

    return 'Otros';
}


function obtenerDocumentosSubidos(empresaId) {

    try {

        const crudos =
            localStorage.getItem(
                CLAVE_DOCUMENTOS + empresaId
            );

        if (!crudos) {
            return [];
        }

        const parseados = JSON.parse(crudos);

        return Array.isArray(parseados)
            ? parseados
            : [];

    } catch (error) {
        return [];
    }
}


function guardarDocumentosSubidos(empresaId, documentos) {

    localStorage.setItem(
        CLAVE_DOCUMENTOS + empresaId,
        JSON.stringify(documentos)
    );
}


export function agregarDocumento(empresaId, documento) {

    const subidos =
        obtenerDocumentosSubidos(empresaId);

    const nuevo = {
        id:
            'DOC-' +
            Date.now()
                .toString()
                .slice(-8),
        nombre: documento.nombre,
        tipo: documento.tipo || 'Otros',
        estado: 'En revisión',
        fecha: new Date().toISOString(),
        vencimiento: documento.vencimiento || null,
        solicitudId: documento.solicitudId || null,
        subido: true
    };

    subidos.unshift(nuevo);

    guardarDocumentosSubidos(empresaId, subidos);

    return nuevo;
}


export function eliminarDocumento(empresaId, documentoId) {

    const subidos =
        obtenerDocumentosSubidos(empresaId);

    const filtrados = subidos.filter(
        documento => documento.id !== documentoId
    );

    guardarDocumentosSubidos(empresaId, filtrados);

    return filtrados.length !== subidos.length;
}


export function construirDocumentos(solicitudes) {

    const derivados = [];

    (solicitudes || []).forEach((solicitud) => {

        const archivos =
            Array.isArray(solicitud.documentos)
                ? solicitud.documentos
                : [];

        archivos.forEach((nombre, indice) => {

            derivados.push({
                id: `DOC-${solicitud.id}-${indice + 1}`,
                nombre,
                tipo: adivinarTipo(nombre),
                estado: 'Vigente',
                fecha: solicitud.fecha || null,
                vencimiento: null,
                solicitudId: solicitud.id
            });

        });

    });

    return derivados;
}


export async function getDocumentos(empresaId) {

    const solicitudes =
        await getSolicitudes(empresaId);

    const derivados =
        construirDocumentos(solicitudes);

    const subidos =
        obtenerDocumentosSubidos(empresaId);

    return [
        ...subidos,
        ...CATALOGO_DEMO,
        ...derivados
    ];
}


export function getIconoTipo(tipo) {
    return ICONOS_TIPO[tipo] || ICONOS_TIPO.Otros;
}

export function clasificarTipoNombre(nombreArchivo) {
    return adivinarTipo(nombreArchivo);
}

export function getTiposDocumento() {
    return [...TIPOS_DOCUMENTO];
}


export function descargarDocumento(documento) {

    const contenido = [
        'Procomer - Documento',
        '========================',
        `Nombre: ${documento.nombre}`,
        `Tipo: ${documento.tipo}`,
        `Estado: ${documento.estado}`,
        `Fecha: ${formatearFecha(documento.fecha)}`,
        `Vencimiento: ${documento.vencimiento ? formatearFecha(documento.vencimiento) : 'No aplica'}`,
        `Solicitud: ${documento.solicitudId || 'N/A'}`
    ].join('\n');

    const blob = new Blob(
        [contenido],
        { type: 'text/plain;charset=utf-8' }
    );

    const url =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement('a');

    enlace.href = url;

    enlace.download =
        documento.nombre.replace(/\.[^.]+$/, '') + '.txt';

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    URL.revokeObjectURL(url);
}


// ==========================================
// NOTIFICACIONES
// Derivadas de alertas e historial reales.
// El estado leído / no leído se guarda en
// localStorage mientras no exista endpoint.
// ==========================================

const CLAVE_LEIDAS = 'zofranca_notificaciones_leidas_';


function obtenerLeidas(empresaId) {

    try {

        const crudos =
            localStorage.getItem(
                CLAVE_LEIDAS + empresaId
            );

        const parseadas = crudos
            ? JSON.parse(crudos)
            : [];

        return new Set(
            Array.isArray(parseadas) ? parseadas : []
        );

    } catch (error) {
        return new Set();
    }
}


function guardarLeidas(empresaId, leidas) {

    localStorage.setItem(
        CLAVE_LEIDAS + empresaId,
        JSON.stringify([...leidas])
    );
}


export async function getNotificaciones(empresaId) {

    const [alertas, historial] =
        await Promise.all([
            getAlertasEmpresa(empresaId),
            getHistorialEmpresa(empresaId)
        ]);


    const leidas =
        obtenerLeidas(empresaId);


    const notificaciones = [];


    alertas.forEach((alerta) => {

        notificaciones.push({
            id: `NTF-${alerta.id}`,
            tipo: 'Alerta',
            titulo:
                `Cumplimiento ${alerta.severidad || ''} en ${alerta.tipo || 'indicador'}`.trim(),
            mensaje:
                `${alerta.empresa || 'Su empresa'} presenta ${alerta.diferencia < 0 ? 'un déficit' : 'una variación'} de ${alerta.diferencia} en el indicador de ${alerta.tipo}.`,
            fecha: alerta.fecha,
            leida: leidas.has(`NTF-${alerta.id}`)
        });

    });


    historial.slice(0, 10).forEach((registro) => {

        const tipoRegistro =
            String(registro.tipo || '').toLowerCase();

        let tipo = 'Sistema';

        if (tipoRegistro === 'decision') tipo = 'Solicitud';
        else if (tipoRegistro === 'evaluacion') tipo = 'Solicitud';
        else if (tipoRegistro === 'documento') tipo = 'Documento';
        else if (tipoRegistro === 'alerta') tipo = 'Alerta';


        const id = `NTF-HIS-${registro.id}`;

        notificaciones.push({
            id,
            tipo,
            titulo:
                registro.accion ||
                'Actividad registrada',
            mensaje:
                registro.descripcion ||
                'Movimiento registrado en su expediente.',
            fecha: registro.fecha,
            leida: leidas.has(id)
        });

    });


    return notificaciones.sort(
        (a, b) =>
            new Date(b.fecha || 0) -
            new Date(a.fecha || 0)
    );
}


export function marcarNotificacionLeida(empresaId, notificacionId) {

    const leidas =
        obtenerLeidas(empresaId);

    leidas.add(notificacionId);

    guardarLeidas(empresaId, leidas);
}


export function marcarTodasNotificacionesLeidas(empresaId, notificaciones) {

    const leidas =
        obtenerLeidas(empresaId);

    (notificaciones || []).forEach((notificacion) => {
        leidas.add(notificacion.id);
    });

    guardarLeidas(empresaId, leidas);
}
