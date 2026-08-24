// ==========================================
// Procomer - CONFIGURACIÓN
// Página compartida por todos los roles.
// ==========================================

import { getSesion } from '../../services/auth.service.js';
import { configurarLogout } from '../shared/logout.js';
import { mostrarToast } from '../shared/ui.js';


const CLAVE_PREF = 'zofranca_preferencias_';


const MENUS_POR_ROL = {

    empresa: [
        { texto: 'Inicio', icono: 'dashboard', href: '../empresa/empresa.html' },
        { texto: 'Solicitudes', icono: 'assignment', href: '../empresa/solicitudes.html' },
        { texto: 'Trámites', icono: 'account_tree', href: '../empresa/tramites.html' },
        { texto: 'Documentos', icono: 'description', href: '../empresa/documentos.html' },
        { texto: 'Reportes', icono: 'analytics', href: '../empresa/reportes.html' },
        { texto: 'Notificaciones', icono: 'notifications', href: '../empresa/notificaciones.html' }
    ],

    gerente: [
        { texto: 'Inicio', icono: 'dashboard', href: '../gerente/gerente.html' }
    ],

    analista: [
        { texto: 'Inicio', icono: 'dashboard', href: '../analista/analista.html' }
    ],

    administrador: [
        { texto: 'Inicio', icono: 'dashboard', href: '../administrador/administrador.html' }
    ]
};


const INICIOS_POR_ROL = {
    empresa: '../empresa/empresa.html',
    gerente: '../gerente/gerente.html',
    analista: '../analista/analista.html',
    administrador: '../administrador/administrador.html'
};


let sesionActual = null;


// ==========================================
// INICIO
// ==========================================

function iniciarConfiguracion() {

    sesionActual = getSesion();

    if (!sesionActual) {
        window.location.replace('../login.html');
        throw new Error('Sesión no válida.');
    }

    configurarLogout('btnCerrarSesion');

    renderizarIdentidad();

    renderizarMenu();

    configurarPreferencias();

    configurarSeguridad();

    configurarEventos();
}


// ==========================================
// IDENTIDAD
// ==========================================

function obtenerIniciales(nombre) {

    const palabras =
        String(nombre || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (palabras.length === 0) return 'U';

    if (palabras.length === 1) {
        return palabras[0].substring(0, 2).toUpperCase();
    }

    return (
        palabras[0].charAt(0) +
        palabras[1].charAt(0)
    ).toUpperCase();
}


function capitalizarRol(rol) {

    const roles = {
        empresa: 'Empresa Solicitante',
        gerente: 'Gerente',
        analista: 'Analista',
        administrador: 'Administrador'
    };

    return roles[rol] || rol || 'Usuario';
}


function renderizarIdentidad() {

    const iniciales =
        obtenerIniciales(sesionActual.nombre);

    const nombre =
        sesionActual.nombre || 'Usuario';

    const rol =
        capitalizarRol(sesionActual.rol);


    document
        .getElementById('avatarUsuarioSidebar')
        ?.replaceChildren(iniciales);

    document
        .getElementById('avatarUsuarioTop')
        ?.replaceChildren(iniciales);

    document
        .getElementById('avatarPerfil')
        ?.replaceChildren(iniciales);


    const campoNombre =
        document.getElementById('nombreUsuarioSidebar');

    if (campoNombre) campoNombre.textContent = nombre;

    const campoRolSidebar =
        document.getElementById('rolUsuarioSidebar');

    if (campoRolSidebar) campoRolSidebar.textContent = rol;

    const campoPerfil =
        document.getElementById('nombrePerfil');

    if (campoPerfil) campoPerfil.textContent = nombre;

    const campoRolPerfil =
        document.getElementById('rolPerfil');

    if (campoRolPerfil) campoRolPerfil.textContent = rol;


    const email =
        document.getElementById('campoEmail');

    if (email) email.value = sesionActual.email || '';

    const organizacion =
        document.getElementById('campoOrganizacion');

    if (organizacion) {
        organizacion.value =
            sesionActual.organizacion ||
            sesionActual.empresaId ||
            '—';
    }

    const nombreCampo =
        document.getElementById('campoNombre');

    if (nombreCampo) nombreCampo.value = nombre;
}


// ==========================================
// MENÚ SEGÚN ROL
// ==========================================

function renderizarMenu() {

    const menu =
        document.getElementById('menuConfiguracion');

    if (!menu) {
        return;
    }

    const items =
        MENUS_POR_ROL[sesionActual.rol] ||
        MENUS_POR_ROL.empresa;

    menu.innerHTML =

        items.map((item) => `

            <a href="${item.href}" class="menu-item">
                <span class="material-symbols-outlined">${item.icono}</span>
                <span>${item.texto}</span>
            </a>

        `).join('') +

        `

            <a href="#" class="menu-item active" aria-current="page">
                <span class="material-symbols-outlined">settings</span>
                <span>Configuración</span>
            </a>

        `;
}


// ==========================================
// PREFERENCIAS
// ==========================================

function leerPreferencias() {

    try {

        const crudo =
            localStorage.getItem(
                CLAVE_PREF + sesionActual.id
            );

        return {
            animacionesReducidas: false,
            avisosCumplimiento: true,
            resumenSemanal: false,
            ...(crudo ? JSON.parse(crudo) : {})
        };

    } catch (error) {
        return {
            animacionesReducidas: false,
            avisosCumplimiento: true,
            resumenSemanal: false
        };
    }
}


function guardarPreferencias(preferencias) {

    localStorage.setItem(
        CLAVE_PREF + sesionActual.id,
        JSON.stringify(preferencias)
    );
}


export function aplicarAnimacionesReducidas(activas) {

    document.documentElement.classList.toggle(
        'anim-reducida',
        Boolean(activas)
    );
}


function configurarPreferencias() {

    const preferencias =
        leerPreferencias();

    aplicarAnimacionesReducidas(
        preferencias.animacionesReducidas
    );


    const mapa = {
        prefAnimaciones: 'animacionesReducidas',
        prefAvisos: 'avisosCumplimiento',
        prefResumen: 'resumenSemanal'
    };

    Object.entries(mapa).forEach(([id, clave]) => {

        const input =
            document.getElementById(id);

        if (!input) return;

        input.checked =
            Boolean(preferencias[clave]);

        input.addEventListener('change', () => {

            const actuales =
                leerPreferencias();

            actuales[clave] = input.checked;

            guardarPreferencias(actuales);

            if (clave === 'animacionesReducidas') {
                aplicarAnimacionesReducidas(input.checked);
            }

            mostrarToast(
                'Preferencia guardada.',
                'exito',
                1800
            );
        });
    });
}


// ==========================================
// SEGURIDAD
// ==========================================

function marcarError(idError, visible) {

    const error =
        document.getElementById(idError);

    if (error) {
        error.classList.toggle(
            'visible',
            visible
        );
    }

    return !visible;
}


function configurarSeguridad() {

    const formulario =
        document.getElementById('formPassword');

    formulario?.addEventListener(
        'submit',
        async (evento) => {

            evento.preventDefault();

            const actual =
                document.getElementById('passActual')?.value || '';

            const nueva =
                document.getElementById('passNueva')?.value || '';

            const confirmar =
                document.getElementById('passConfirmar')?.value || '';


            let valida = true;

            valida =
                marcarError(
                    'errorActual',
                    actual.length === 0
                ) && valida;

            valida =
                marcarError(
                    'errorNueva',
                    nueva.length < 8
                ) && valida;

            valida =
                marcarError(
                    'errorConfirmar',
                    confirmar !== nueva || nueva.length === 0
                ) && valida;

            if (!valida) {
                return;
            }


            // La actualización real requiere endpoint seguro.
            // Se deja preparada la llamada para la API:
            // await fetchAPI('/usuarios/' + id, { method: 'PATCH', body: ... })

            formulario.reset();

            mostrarToast(
                'Validación superada. El cambio se aplicará cuando el backend exponga el servicio de contraseñas.',
                'info',
                4200
            );
        }
    );
}


// ==========================================
// EVENTOS GENERALES
// ==========================================

function configurarEventos() {

    const btnVolver =
        document.getElementById('btnVolverInicio');

    btnVolver?.addEventListener('click', () => {

        window.location.href =
            INICIOS_POR_ROL[sesionActual.rol] ||
            INICIOS_POR_ROL.empresa;
    });


    document
        .getElementById('btnAyuda')
        ?.addEventListener(
            'click',
            () => mostrarToast(
                'Centro de ayuda de Procomer.',
                'info'
            )
        );
}


iniciarConfiguracion();
