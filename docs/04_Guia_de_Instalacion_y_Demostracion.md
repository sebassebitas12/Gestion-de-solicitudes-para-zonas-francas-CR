# 04 — Guía de Instalación, Ejecución y Demostración

Guía rápida para levantar el proyecto localmente y realizar una demostración completa de todas las funcionalidades en vivo.

---

## 1. Requisitos Previos
* **Node.js:** Versión 18 o superior instalada.
* **NPM:** Gestor de paquetes incluido con Node.js.

---

## 2. Puesta en Marcha (2 Terminales)

Abre dos terminales en la carpeta raíz del proyecto (`Laboratorio3`):

### Terminal 1: Backend de Datos (API REST)
```powershell
npm run server
```
* Inicia `json-server` en el puerto `3001` consumiendo [db.json](file:///c:/Documentos/Laboratorio3/db.json).

### Terminal 2: Servidor Web Frontend (Vite)
```powershell
npm run dev
```
* Inicia el servidor web local (generalmente en `http://localhost:5173`).

---

## 3. Tabla de Credenciales de Demostración

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Empresa Solicitante** | `contacto@technova.cr` | `empresa123` |
| **Analista Técnico** | `ana.chaves@procomer.go.cr` | `analista123` |
| **Gerente de Operaciones** | `carlos.mendez@procomer.go.cr` | `gerente123` |
| **Administrador del Sistema** | `laura.vargas@procomer.go.cr` | `admin123` |

---

## 4. Guion de Demostración Paso a Paso (5 Minutos)

### Paso 1: Inicio de Sesión y Creación de Solicitud (Empresa)
1. Inicia sesión con `contacto@technova.cr` / `empresa123`.
2. Muestra el **Dashboard de Empresa** (métricas de inversión, estado de trámites).
3. Haz clic en **"+ Nueva Solicitud"**:
   * Selecciona Sector: *Tecnología*, Zona Franca: *Zona Franca Coyol*.
   * Ingresa Inversión: `$300,000` y Empleos: `80`.
   * Adjunta documentos y presiona **"Crear Solicitud"**.

### Paso 2: Evaluación Técnica con IA (Analista)
1. Cierra sesión e ingresa como Analista: `ana.chaves@procomer.go.cr` / `analista123`.
2. Observa en la tabla la nueva solicitud con su **Puntaje IA (100 pts - Recomendada)**.
3. Abre el modal de la solicitud para mostrar el **Análisis de IA** y confirma la aprobación con un comentario técnico.
4. Muestra el modal de **Revisar Documentos** y valida los expedientes técnicos.

### Paso 3: Resolución Ejecutiva (Gerente)
1. Cierra sesión e ingresa como Gerente: `carlos.mendez@procomer.go.cr` / `gerente123`.
2. Muestra los indicadores macroeconómicos de inversión y empleos acumulados.
3. Abre el módulo de **Documentos/Acuerdos Legales** y muestra el **Reporte Ejecutivo**.

### Paso 4: Auditoría y Configuración (Administrador)
1. Ingresa como Administrador: `laura.vargas@procomer.go.cr` / `admin123`.
2. Muestra el panel de usuarios, catálogo de zonas francas y la bitácora de actividad reciente.
