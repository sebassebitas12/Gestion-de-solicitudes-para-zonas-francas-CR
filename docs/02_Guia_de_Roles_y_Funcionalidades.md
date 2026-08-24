# 02 — Guía de Roles y Funcionalidades

ZoFranca CR implementa un modelo de control de acceso basado en roles (*RBAC*). A continuación se detallan las funcionalidades disponibles para cada perfil de usuario.

---

## 1. Rol: Empresa Solicitante
* **Página principal:** `src/pages/empresa/empresa.html`
* **Credenciales de prueba:** `contacto@technova.cr` / `empresa123`

### Funcionalidades:
1. **Panel Principal (Dashboard):**
   * Visualización de indicadores clave: Inversión total, empleos generados, trámites en curso y documentos vigentes.
   * Barra de estado de trámites y solicitudes recientes con acceso a detalle.
2. **Creación de Solicitudes (`nueva-solicitud.html`):**
   * Asistente en 4 pasos: Datos generales, plan de inversión/empleo, adjuntos documentales y envío con pre-evaluación con IA.
3. **Seguimiento de Solicitudes y Trámites (`solicitudes.html`, `tramites.html`):**
   * Filtros por estado (*pendiente, aprobada, rechazada*) y detalle de cada etapa procesal.
4. **Repositorio de Documentos (`documentos.html`):**
   * Carga de nuevos archivos, clasificación por tipo y visualización del estado de revisión.
5. **Reportes y Notificaciones (`reportes.html`, `notificaciones.html`):**
   * Generación y exportación de resúmenes de desempeño y centro de avisos institucionales.

---

## 2. Rol: Analista Técnico
* **Página principal:** `src/pages/analista/analista.html`
* **Credenciales de prueba:** `ana.chaves@procomer.go.cr` / `analista123`

### Funcionalidades:
1. **Bandeja de Solicitudes Pendientes:**
   * Tabla con semáforo de prioridad, puntaje de IA y datos clave de cada empresa solicitante.
2. **Evaluación Asistida por IA:**
   * Visualización del puntaje normativo y justificación generada por el motor inteligente.
   * Emisión de dictamen humano vinculante: *Confirmar Decisión*, *Enviar a Revisión* o *Rechazar*.
3. **Repositorio Documental Técnico:**
   * Modal para inspeccionar y validar los requisitos y anexos presentados por las empresas.
4. **Reportes de Evaluación:**
   * Resumen analítico de conformidad de solicitudes con opción de impresión directa (`window.print()`).

---

## 3. Rol: Gerente de Operaciones
* **Página principal:** `src/pages/gerente/gerente.html`
* **Credenciales de prueba:** `carlos.mendez@procomer.go.cr` / `gerente123`

### Funcionalidades:
1. **Tablero de Control Macroeconómico:**
   * Métricas de inversión total acumulada en dólares, proyección global de empleos y tasa de aprobación.
2. **Resolución y Firma Legal:**
   * Bandeja de expedientes técnicos listos para aprobación ejecutiva final.
   * Acceso a la documentación legal y acuerdos de otorgamiento de zona franca.
3. **Reportes Ejecutivos:**
   * Resumen de impacto por sector industrial y parques de zona franca.

---

## 4. Rol: Administrador del Sistema
* **Página principal:** `src/pages/administrador/administrador.html`
* **Credenciales de prueba:** `laura.vargas@procomer.go.cr` / `admin123`

### Funcionalidades:
1. **Gestión de Usuarios:**
   * Supervisión de cuentas activas, asignación de roles y estados de acceso.
2. **Mantenimiento de Catálogos:**
   * Zonas Francas autorizadas en el país y directorio de empresas registradas.
3. **Auditoría Global:**
   * Monitoreo en tiempo real del registro de eventos e historial del sistema.

---

## 5. Módulo Transversal: Configuración
* **Página:** `src/pages/configuracion/configuracion.html`
* Accesible para todos los usuarios autenticados para gestión de perfil, preferencias de interfaz y seguridad.
