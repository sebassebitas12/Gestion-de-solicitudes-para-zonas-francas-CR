import { fetchAPI } from './api.js';

export async function login(email, password) {
  try {
    const usuarios = await fetchAPI('/usuarios');

    const usuario = usuarios.find(
      (item) =>
        item.email === email &&
        item.password === password &&
        item.activo === true
    );

    if (!usuario) {
      throw new Error('Correo o contraseña incorrectos.');
    }

    const sesion = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      organizacion: usuario.organizacion,
      empresaId: usuario.empresaId || null,
    };

    sessionStorage.setItem('usuario', JSON.stringify(sesion));

    return sesion;
  } catch (error) {
    throw new Error(`No se pudo iniciar sesión: ${error.message}`);
  }
}

export function getSesion() {
  const sesion = sessionStorage.getItem('usuario');
  return sesion ? JSON.parse(sesion) : null;
}

export function logout() {
  sessionStorage.removeItem('usuario');
}