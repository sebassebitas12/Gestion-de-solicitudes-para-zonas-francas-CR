# ZoFranca CR — Diseño de Interfaz y Estructura Visual
**Desarrolladora:** Bianca  
**Área de Enfoque:** Maquetación Semántica en HTML5, Diseño de Experiencia de Usuario (UI/UX), Hojas de Estilo CSS3, Sistema de Temas y Componentes Visuales.

---

## 1. Resumen Ejecutivo
Desarrollo y diseño integral de la interfaz gráfica y maquetación de todas las vistas de la plataforma **ZoFranca CR**, implementando un sistema de diseño visual corporativo, estético, accesible y responsivo para los diferentes roles del sistema.

---

## 2. Componentes y Vistas Desarrolladas

### A. Estructura y Vistas HTML5 (`src/pages/`)

1. **Autenticación e Ingreso (`src/pages/login.html`):**
   * Estructura de acceso seguro con formulario institucional, selectores visuales de credenciales de prueba y banners de estado.
2. **Módulo de Empresa (`src/pages/empresa/`):**
   * **`empresa.html`:** Dashboard principal con tarjetas de KPIs, gráficos de inversión, barras de progreso y accesos directos.
   * **`nueva-solicitud.html`:** Maquetación del asistente de 4 pasos (*wizard*) para registro de solicitudes con resumen dinámico.
   * **`solicitudes.html`:** Tablas interactivas con estados cromáticos (pendiente, aprobada, rechazada).
   * **`tramites.html`:** Vista de seguimiento secuencial de etapas del proceso de zona franca.
   * **`documentos.html`:** Repositorio documental con dropzones y listas de archivos adjuntos.
   * **`reportes.html`:** Tablero analítico con métricas de exportación y generación de resúmenes.
   * **`notificaciones.html`:** Centro de avisos y alertas con badges informativos.
3. **Módulo del Analista (`src/pages/analista/analista.html`):**
   * Panel de revisión técnica con tablas de dictamen, semáforos de riesgo y ventana modal de evaluación con IA.
4. **Módulo del Gerente (`src/pages/gerente/gerente.html`):**
   * Tablero ejecutivo de alta dirección con indicadores de impacto macroeconómico, filtros de empresa y modal de resolución.
5. **Módulo del Administrador (`src/pages/administrador/administrador.html`):**
   * Maquetación de tablas administrativas de usuarios, empresas y panel de auditoría.
6. **Módulo Transversal de Configuración (`src/pages/configuracion/configuracion.html`):**
   * Pantalla de perfil de usuario, personalización de preferencias, tema visual y seguridad.

---

### B. Sistema de Estilos y Diseño CSS3 (`src/css/`)

1. **Fundamentos y Diseño Global (`src/css/styles.css` & `src/css/decor.css`):**
   * Definición de variables CSS para consistencia de colores institucionales (azules de autoridad, verdes de éxito, rojos de alerta y fondos oscuros).
   * Efectos modernos de profundidad: *Glassmorphism*, sombras difuminadas, degradados suaves y blobs decorativos de fondo.
2. **Tipografía e Iconografía:**
   * Integración de fuentes Google Fonts (**Hanken Grotesk** para legibilidad corporativa y **JetBrains Mono** para identificadores y código).
   * Iconografía vectorial completa mediante **Google Material Symbols Outlined**.
3. **Estilos Específicos por Módulo (`src/css/`):**
   * `empresa/empresa.css` y `empresa/paneles.css`: Estilos de paneles modulares, tablas y tarjetas de estadísticas.
   * `analista/analista.css`: Tematización técnica enfocada en análisis de datos y modales de revisión.
   * `gerente/gerente.css`: Estética ejecutiva con énfasis en métricas de alto impacto.
   * `administrador/administrador.css`: Tablas densas de gestión y paneles de control.
   * `login.css`: Interfaz de bienvenida con animaciones y contraste optimizado.
   * `configuracion/configuracion.css`: Formularios limpios de preferencias y ajustes.

---

## 3. Principios de Diseño Aplicados
* **Responsive Design:** Diseño adaptativo mediante CSS Grid y Flexbox para visualización óptima en pantallas de escritorio, portátiles y dispositivos móviles.
* **Jerarquía Visual y Contraste:** Uso estratégico de pesos tipográficos y badges cromáticos para facilitar la toma de decisiones rápidas de los evaluadores.
* **Componentización:** Reutilización de clases para modales, botones, inputs y tablas a lo largo de todo el proyecto.
