// ==========================================
// ZoFranca CR - UI COMPARTIDA
// Sistema de notificaciones toast.
// Autocontenido: inyecta sus propios estilos,
// no requiere cambios en los HTML.
// ==========================================

const ESTILOS_TOAST = `

.zofranca-toast-container {

    position: fixed;

    top: 18px;
    right: 18px;

    z-index: 9999;

    display: flex;

    flex-direction: column;

    gap: 10px;

    pointer-events: none;
}

.zofranca-toast {

    display: flex;

    align-items: center;

    gap: 10px;

    min-width: 240px;

    max-width: 360px;

    padding: 13px 16px;

    border-radius: 10px;

    background: #131b2e;

    color: #ffffff;

    font-family: "Hanken Grotesk", sans-serif;

    font-size: 13.5px;

    line-height: 1.45;

    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);

    opacity: 0;

    transform: translateY(-8px);

    transition:
        opacity 0.25s ease,
        transform 0.25s ease;

    pointer-events: auto;
}

.zofranca-toast.visible {

    opacity: 1;

    transform: translateY(0);
}

.zofranca-toast .material-symbols-outlined {

    font-size: 20px;

    flex-shrink: 0;
}

.zofranca-toast.exito {
    background: #1e8e3e;
}

.zofranca-toast.error {
    background: #ba1a1a;
}

.zofranca-toast.info {
    background: #085ac0;
}

@media (max-width: 650px) {

    .zofranca-toast-container {

        left: 14px;
        right: 14px;
        top: 12px;

    }

    .zofranca-toast {

        max-width: none;

        width: 100%;

    }
}

`;


let contenedor = null;


function asegurarContenedor() {

    if (contenedor && document.body.contains(contenedor)) {
        return contenedor;
    }

    if (
        !document.getElementById('zofranca-toast-styles')
    ) {

        const estilo =
            document.createElement('style');

        estilo.id = 'zofranca-toast-styles';

        estilo.textContent = ESTILOS_TOAST;

        document.head.appendChild(estilo);
    }

    contenedor =
        document.querySelector('.zofranca-toast-container');

    if (!contenedor) {

        contenedor =
            document.createElement('div');

        contenedor.className =
            'zofranca-toast-container';

        contenedor.setAttribute(
            'aria-live',
            'polite'
        );

        document.body.appendChild(contenedor);
    }

    return contenedor;
}


const ICONOS = {
    exito: 'check_circle',
    error: 'error',
    info: 'info'
};


export function mostrarToast(mensaje, tipo = 'info', duracionMs = 3200) {

    const destino =
        asegurarContenedor();

    const toast =
        document.createElement('div');

    toast.className =
        `zofranca-toast ${tipo}`;

    toast.setAttribute('role', 'status');

    toast.innerHTML = `

        <span class="material-symbols-outlined">
            ${ICONOS[tipo] || ICONOS.info}
        </span>

        <span></span>

    `;

    toast.lastElementChild.textContent = mensaje;

    destino.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });


    setTimeout(() => {

        toast.classList.remove('visible');

        setTimeout(() => toast.remove(), 300);

    }, duracionMs);

    return toast;
}
