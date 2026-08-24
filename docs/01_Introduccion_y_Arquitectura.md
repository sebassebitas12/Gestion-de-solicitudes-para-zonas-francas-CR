# 01 — Introducción y Arquitectura del Sistema

## 1. Visión General de ZoFranca CR
**ZoFranca CR** es una plataforma web integral desarrollada para digitalizar, optimizar y automatizar el ciclo de vida de las solicitudes del régimen de zonas francas en Costa Rica (bajo el marco de la Ley 7210). Conecta en un entorno centralizado a las empresas inversionistas con las entidades de evaluación técnica (Analistas) y resolución de alto nivel (Gerencia).

---

## 2. Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend Core** | HTML5 Semántico + JavaScript ES Modules | Estructura y lógica modular sin frameworks pesados. |
| **Estilos y UI** | CSS3 Vanilla + CSS Variables + Flexbox/Grid | Diseño responsivo, efectos de profundidad (*Glassmorphism*) y tema oscuro moderno. |
| **Tipografía e Iconos** | Hanken Grotesk + JetBrains Mono + Material Symbols | Identidad visual corporativa y legibilidad técnica. |
| **Backend de Datos** | `json-server` (`db.json`) | API REST simulada que expone endpoints CRUD en `http://localhost:3001`. |
| **Empaquetador/Servidor** | Vite | Recarga rápida en desarrollo (*HMR*) y servidor web local. |

---

## 3. Estructura del Repositorio

```text
Laboratorio3/
├── index.html                   # Redirección de entrada al login
├── package.json                 # Configuración de dependencias y scripts
├── db.json                      # Base de datos JSON para json-server
├── docs/                        # Documentación técnica y secuencial del proyecto
│   ├── 01_Introduccion_y_Arquitectura.md
│   ├── 02_Guia_de_Roles_y_Funcionalidades.md
│   ├── 03_Flujo_de_Solicitudes_e_IA.md
│   ├── 04_Guia_de_Instalacion_y_Demostracion.md
│   ├── Flores.md
│   └── Bianca.md
└── src/
    ├── css/                     # Hojas de estilo por módulo y estilos globales
    ├── js/                      # Lógica JS modular organizada por rol
    ├── pages/                   # Vistas HTML organizadas por rol
    └── services/                # Capa de comunicación HTTP, Auth e Inteligencia Artificial
```

---

## 4. Modelo de Datos Central (`db.json`)

* **`/usuarios`:** Credenciales, roles (`empresa`, `analista`, `gerente`, `administrador`), organización y estado activo.
* **`/zonas_francas`:** Catálogo de parques industriales con umbrales de inversión mínima, empleos requeridos y sectores autorizados.
* **`/empresas`:** Registro mercantil de compañías solicitantes vinculadas a usuarios.
* **`/solicitudes`:** Expedientes que contienen inversión, empleos, documentos, puntaje IA, justificación y estado.
* **`/historial`:** Bitácora de auditoría de acciones, evaluaciones y decisiones tomadas en el sistema.
