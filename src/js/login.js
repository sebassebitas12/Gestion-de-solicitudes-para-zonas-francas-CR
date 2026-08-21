import { login } from '../services/auth.service.js';

const rutasPorRol = {
  empresa: 'empresa.html',
  analista: 'analista.html',
  administrador: 'administrador.html',
  gerente: 'gerente.html',
};

const selectorRol = document.getElementById('rol-usuario');

if (selectorRol) {
  selectorRol.required = false;
  selectorRol.disabled = true;
  selectorRol.closest('.form-group')?.classList.add('hidden');
}

function mostrarAlerta(mensaje, tipo = 'error') {
  const alerta = document.getElementById('alert-message');

  alerta.textContent = mensaje;
  alerta.className = `alert-banner alert-${tipo}`;
  alerta.classList.remove('hidden');

  setTimeout(() => alerta.classList.add('hidden'), 5000);
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const boton = document.getElementById('btn-login');
  const spinner = document.getElementById('spinner-loading');

  boton.disabled = true;
  spinner.classList.remove('hidden');

  try {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const sesion = await login(email, password);
    const ruta = rutasPorRol[sesion.rol];

    if (!ruta) {
      throw new Error('El usuario no tiene un rol válido.');
    }

    window.location.href = `../pages/${ruta}`;
  } catch (error) {
    mostrarAlerta(error.message);
  } finally {
    boton.disabled = false;
    spinner.classList.add('hidden');
  }
});