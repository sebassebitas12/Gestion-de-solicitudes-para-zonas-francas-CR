export function recomendarClasificacion(solicitud) {
    return new Promise((resolve) => {
        setTimeout(() => {
            let puntaje = 0;

            if (solicitud.inversion >= 1000000) {
                puntaje += 40;
            }

            if (solicitud.empleos >= 100) {
                puntaje += 30;
            }

            if (solicitud.exportaciones >= 5000000) {
                puntaje += 30;
            }

            let clasificacion;

            if (puntaje >= 70) {
                clasificacion = "Recomendada";
            } else if (puntaje >= 40) {
                clasificacion = "Revisar";
            } else {
                clasificacion = "Rechazada";
            }

            resolve({
                puntaje,
                clasificacion
            });
        }, 1000);
    });
}