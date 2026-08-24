// ==========================================
// Procomer - PANEL DE CUMPLIMIENTOS (Empresa)
// Usa el motor global shared/cumplimientos.js
// ==========================================

import {
    protegerPanelEmpresa,
    iniciarPanelBase
} from './panel-base.js';

import {
    calcularCumplimientos,
    renderizarPanelCumplimiento,
    renderizarItemCumplimiento
} from '../shared/cumplimientos.js';

import { mostrarToast } from '../shared/ui.js';


let sesionActual = null;

let resumenActual = null;

let filtroActual = 'todos';


// ==========================================
// IDENTIDAD EN SIDEBAR / TOPBAR
// ==========================================

function renderizarIdentidad() {

    const nombre =
        sesionActual.organizacion ||
        sesionActual.nombre ||
        'Empresa';

    const inicial =
        nombre.charAt(0).toUpperCase();


    const avatarSidebar =
        document.getElementById('avatarEmpresaSidebar');

    const nombreSidebar =
        document.getElementById('nombreEmpresa');

    const rolSidebar =
        document.getElementById('rolEmpresa');

    const avatarTop =
        document.getElementById('avatarTopbar');

    const nombreTop =
        document.getElementById('nombreTopbar');


    if (avatarSidebar) avatarSidebar.textContent = inicial;
    if (nombreSidebar) nombreSidebar.textContent = nombre;
    if (rolSidebar) rolSidebar.textContent = 'Empresa Solicitante';
    if (avatarTop) avatarTop.textContent = inicial;
    if (nombreTop) nombreTop.textContent = nombre;
}


// ==========================================
// RENDERIZADO
// ==========================================

function escapar(texto) {

    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}


function renderizarDetalle() {

    const contenedor =
        document.getElementById('detalleCumplimientos');

    if (!contenedor || !resumenActual) {
        return;
    }


    const orden = {
        vencido: 0,
        proximo: 1,
        pendiente: 2,
        cumplido: 3
    };

    const items = resumenActual.items
        .filter(item =>
            filtroActual === 'todos' ||
            item.estado === filtroActual
        )
        .sort((a, b) => orden[a.estado] - orden[b.estado]);


    if (items.length === 0) {

        contenedor.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">
                    task_alt
                </span>
                <h3>
                    Sin elementos en este estado
                </h3>
                <p>
                    No hay obligaciones con el estado seleccionado.
                </p>
            </div>
        `;

        return;
    }


    contenedor.innerHTML = `
        <div class="zof-comp-panel">
            <div class="zof-comp-lista">
                ${items.map((item, i) =>
                    renderizarItemCumplimiento(item, i)
                ).join('')}
            </div>
        </div>
    `;
}


// Pinta el total de cada chip de filtro.
function actualizarConteosChips() {

    const conteos = {
        todos: resumenActual.items.length,
        cumplido: 0,
        pendiente: 0,
        proximo: 0,
        vencido: 0
    };

    resumenActual.items.forEach(item => {

        if (conteos[item.estado] !== undefined) {
            conteos[item.estado] += 1;
        }
    });


    document
        .querySelectorAll('#filtrosCumplimientos .filter-chip')
        .forEach(chip => {

            const clave =
                chip.dataset.filtro;

            let contador =
                chip.querySelector('.zof-chip-count');

            if (!contador) {

                contador =
                    document.createElement('span');

                contador.className =
                    'zof-chip-count';

                chip.appendChild(contador);
            }

            contador.textContent =
                String(conteos[clave] ?? 0);
        });
}


async function cargarCumplimientos() {

    try {

        resumenActual =
            await calcularCumplimientos(
                sesionActual.empresaId
            );

        const contenedor =
            document.getElementById('panelCumplimientoResumen');

        contenedor.innerHTML = '';

        contenedor.appendChild(
            renderizarPanelCumplimiento(resumenActual, {
                titulo: `Cumplimiento de ${
                    sesionActual.organizacion || 'la empresa'
                }`
            })
        );

        renderizarDetalle();

        actualizarConteosChips();

    } catch (error) {

        console.error(
            'Error calculando cumplimientos:',
            error
        );

        mostrarToast(
            'No fue posible calcular el cumplimiento. Verifique que el servidor esté activo.',
            'error',
            4200
        );
    }
}


// ==========================================
// EVENTOS
// ==========================================

function configurarEventos() {

    document
        .getElementById('btnActualizarCumplimientos')
        ?.addEventListener('click', () => {

            mostrarToast(
                'Actualizando cumplimiento...',
                'info'
            );

            cargarCumplimientos();
        });


    document.querySelectorAll('[data-filtro]')
        .forEach(chip => {

            chip.addEventListener(
                'click',
                () => {

                    filtroActual =
                        chip.dataset.filtro;

                    document.querySelectorAll('[data-filtro]')
                        .forEach(otro =>
                            otro.classList.remove('active')
                        );

                    chip.classList.add('active');

                    renderizarDetalle();
                }
            );
        });
}


// ==========================================
// INICIO
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        sesionActual = protegerPanelEmpresa();

        iniciarPanelBase(sesionActual);

        renderizarIdentidad();

        configurarEventos();

        await cargarCumplimientos();
    }
);
