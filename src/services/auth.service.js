import { fetchAPI } from "./api.js";

export async function login(email, password, rol) {
    try {
        const usuarios = await fetchAPI("/usuarios");

        const usuario = usuarios.find(
            (usuario) =>
                usuario.email === email &&
                usuario.password === password &&
                usuario.rol === rol &&
                usuario.activo === true
        );

        if (!usuario) {
            throw new Error("Credenciales o rol incorrectos");
        }

        const sesion = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            organizacion: usuario.organizacion,
            empresaId: usuario.empresaId || null
        };

        sessionStorage.setItem("usuario", JSON.stringify(sesion));

        return sesion;

    } catch (error) {
        console.error("Error en login:", error);
        throw error;
    }
}

export function getSesion() {
    const sesion = sessionStorage.getItem("usuario");

    return sesion ? JSON.parse(sesion) : null;
}

export function logout() {
    sessionStorage.removeItem("usuario");
}