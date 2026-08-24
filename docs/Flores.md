# ZoFranca CR — Aporte Técnico y Desarrollo Funcional
**Desarrollador:** Sebastián Flores  
**Área de Enfoque:** Arquitectura de Software, Lógica JavaScript (ES Modules), Integración de Servicios, Motor de IA y Gestión de Estado.

---

## 1. Resumen Ejecutivo
Desarrollo integral de la lógica del cliente y la capa de servicios para la plataforma **ZoFranca CR**, garantizando la reactividad, el flujo de autenticación, el procesamiento inteligente de solicitudes y la comunicación asíncrona con el backend simulado (`json-server`).

---

## 2. Componentes y Módulos Desarrollados

### A. Capa de Servicios y Comunicación de Datos (`src/services/`)
* **`api.js` (Cliente HTTP Centralizado):**
  * Wrapper modular sobre la Fetch API con tipado de cabeceras automáticas (`Content-Type`, `Accept`).
  * Manejo robusto de errores HTTP con captura de respuestas JSON y fallback amigable ante desconexiones del servidor.
* **`auth.service.js` (Control de Acceso y Sesiones):**
  * Mecanismo de persistencia de sesión en `localStorage` (`zofranca_sesion`).
  * Validación de credenciales contra `/usuarios`, verificación de estado activo y roles autorizados.
* **`ia.service.js` (Motor de Evaluación Inteligente):**
  * Algoritmo de validación de umbrales normativos según la Ley de Zonas Francas de Costa Rica (Ley 7210).
  * Matriz de ponderación multidimensional: Inversión mínima (+40 pts), Empleos directos (+30 pts), Compatibilidad de sector económico (+30 pts).
  * Asignación automatizada de `puntajeIA` (0-100), `clasificacionIA` (*Recomendada*, *Revisar*, *Rechazada*) y generación de justificaciones técnicas automáticas.
* **`solicitudes.service.js` (CRUD y Orquestación):**
  * Control del ciclo de vida de solicitudes: creación, consulta, actualización de estados y sincronización de dictámenes.

---

### B. Lógica de Negocio y Controladores de Vistas (`src/js/`)

#### 1. Autenticación y Seguridad Global (`src/js/login.js` & `src/js/shared/`)
* Enrutamiento dinámico post-login según rol (`empresa`, `analista`, `gerente`, `administrador`).
* Protección perimetral de rutas y control de sesiones activas.
* Sistema de notificaciones flotantes asíncronas no bloqueantes (`mostrarToast` en `ui.js`).
* Módulo compartido de cierre de sesión seguro (`logout.js`).

#### 2. Módulo de Empresa (`src/js/empresa/`)
* **`empresa.js` & `empresa-data.js`:**
  * Cálculo dinámico de KPIs: inversión acumulada, empleos directos, estado de trámites y alertas.
  * Extracción y derivación de trámites en tiempo real a partir del estado de las solicitudes.
* **`nueva-solicitud.js`:**
  * Flujo wizard multipaso para la creación de solicitudes de régimen de zona franca.
  * Integración en tiempo real con el motor de IA para precalificación instantánea.
* **`documentos.js` & `tramites.js` & `reportes.js`:**
  * Gestión del repositorio documental (carga, eliminación y filtros por tipo/estado).
  * Filtros dinámicos reactivos y exportación de reportes de desempeño.

#### 3. Módulo del Analista (`src/js/analista/analista.js`)
* Bandeja de entrada técnica con semáforos de riesgo y clasificación de IA.
* Modal de evaluación asistida por IA con dictamen humano vinculante (Aprobar, Prevenir, Rechazar).
* Repositorio interactivo de verificación y validación de documentos adjuntos.
* Generador de reportes de evaluación técnica e informes de conformidad.

#### 4. Módulo del Gerente (`src/js/gerente/gerente.js`)
* Tablero ejecutivo de alta dirección con métricas macroeconómicas de inversión y empleo.
* Módulo de resolución y firma digital de expedientes legales de zona franca.
* Filtros cruzados por sector, empresa y generación de reportes ejecutivos.

#### 5. Módulo del Administrador y Configuración (`src/js/administrador/` & `src/js/configuracion/`)
* Panel de administración de usuarios, auditoría del sistema y catálogo de zonas francas.
* Módulo transversal de preferencias de usuario, cambio de credenciales y personalización.

---

## 3. Principios de Ingeniería Aplicados
* **Modularidad ES6:** Separación estricta de responsabilidades (SoC), importación limpia de módulos y cero dependencias de librerías externas pesadas.
* **Asincronía y Manejo de Errores:** Promesas, `async/await` estructurados y control de excepciones en todas las peticiones de red.
* **UX No Bloqueante:** Sustitución integral de alertas nativas del navegador por componentes flotantes modernos e interactivos.
