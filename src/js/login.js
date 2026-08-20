// login.js
import { login } from '../services/auth.service.js';

const RUTAS_POR_ROL = {
  empresa:       './empresa.html',
  analista:      './analista.html',
  administrador: './administrador.html',
  gerente:       './gerente.html',
};

function mostrarAlerta(mensaje) {
  const alerta = document.getElementById('alert-message');
  alerta.textContent = mensaje;
  alerta.className = 'alert-banner alert-error';
  alerta.classList.remove('hidden');
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email   = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const rol     = document.getElementById('rol-usuario').value;

  const btn     = document.getElementById('btn-login');
  const spinner = document.getElementById('spinner-loading');

  btn.disabled = true;
  spinner.classList.remove('hidden');

  try {
    const sesion = await login(email, password, rol);
    window.location.href = RUTAS_POR_ROL[sesion.rol];

  } catch (error) {
    mostrarAlerta('Credenciales incorrectas o rol no permitido.');
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
  }
});