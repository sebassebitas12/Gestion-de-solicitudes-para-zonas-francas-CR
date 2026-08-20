import { fetchAPI } from "./api.js";

export async function obtenerSolicitudes() {
    try {
        return await fetchAPI("/solicitudes");
    } catch (error) {
        console.error("Error al obtener solicitudes:", error);
        throw error;
    }
}

export async function crearSolicitud(solicitud) {
    try {
        return await fetchAPI("/solicitudes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(solicitud)
        });
    } catch (error) {
        console.error("Error al crear solicitud:", error);
        throw error;
    }
}

export async function actualizarSolicitud(id, solicitud) {
    try {
        return await fetchAPI(`/solicitudes/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(solicitud)
        });
    } catch (error) {
        console.error("Error al actualizar solicitud:", error);
        throw error;
    }
}

export async function eliminarSolicitud(id) {
    try {
        return await fetchAPI(`/solicitudes/${id}`, {
            method: "DELETE"
        });
    } catch (error) {
        console.error("Error al eliminar solicitud:", error);
        throw error;
    }
}