# 🏭 ZoFranca CR — Gestión de Solicitudes para Zonas Francas

> Laboratorio #3 Extendido | Programación Front End con IA Aplicada

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Versión](https://img.shields.io/badge/versión-0.1.0-blue)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)

---

## 📋 Descripción

**ZoFranca CR** es una aplicación web para la gestión de solicitudes de zonas francas en Costa Rica. Permite a empresas, analistas, administradores y gerentes gestionar el ciclo completo de solicitudes de manera digitalizada, con apoyo de inteligencia artificial para la validación y recomendación de resoluciones.

---

## 👩‍💻 Equipo de desarrollo

| Integrante | GitHub | Rol |
|---|---|---|
| Sebastián Chavarría | [@sebassebitas12](https://github.com/sebassebitas12) | Desarrollador Frontend |
| Bianca Robles Hurtado | [@bianca-github](https://github.com) | Desarrolladora Frontend |

---

## 🧰 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES2022+) |
| Backend simulado | [json-server](https://github.com/typicode/json-server) en puerto `3001` |
| Inteligencia Artificial | Promise simulada (Opción B) / API real (Opción A) |
| Asincronía | `Promise`, `async/await`, `Promise.all`, `try/catch` |
| Control de versiones | Git + GitHub (ramas por funcionalidad) |

---

## 📁 Estructura del proyecto

```
Gestion-de-solicitudes-para-zonas-francas-CR/
└── proyecto#3/
    ├── index.html              ← Login / pantalla principal
    ├── db.json                 ← Base de datos de json-server
    ├── package.json
    ├── .gitignore
    └── src/
        ├── main.js             ← Punto de entrada JavaScript
        ├── style.css           ← Estilos globales
        ├── pages/
        │   ├── empresa.html
        │   ├── analista.html
        │   ├── administrador.html
        │   └── gerente.html
        ├── js/
        │   ├── api.js          ← Funciones base fetch → json-server
        │   ├── auth.js         ← Login y manejo de sesión por rol
        │   ├── ordenes.js      ← CRUD de órdenes/solicitudes
        │   └── ia.js           ← Módulo IA (recomendación)
        └── css/
            └── components.css  ← Estilos de componentes reutilizables
```

---

## 🚀 Instalación y ejecución local

### Prerequisitos

- Node.js v18 o superior
- npm v9 o superior

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/sebassebitas12/Gestion-de-solicitudes-para-zonas-francas-CR.git
cd Gestion-de-solicitudes-para-zonas-francas-CR/proyecto#3

# 2. Instalar dependencias
npm install

# 3. Iniciar json-server (backend simulado) en una terminal
npx json-server --watch db.json --port 3001

# 4. Abrir index.html en el navegador
# (o usar Live Server si usás VS Code)
```

> ⚠️ El json-server debe estar corriendo en el puerto `3001` antes de abrir la aplicación.

---

## 🌿 Estrategia de ramas (Git Flow simplificado)

```
main          ← producción (protegida, solo merge por PR aprobado)
└── develop   ← integración de features

    ├── feature/mockups
    ├── feature/db-json
    ├── feature/autenticacion
    ├── feature/carga-ordenes
    ├── feature/ia-recomendacion
    └── feature/dashboard
```

### Reglas de contribución

- ❌ Nadie hace `push` directo a `main`
- ✅ Todo cambio entra por Pull Request hacia `develop`
- ✅ Cada PR debe tener al menos **1 aprobación** de la otra integrante
- ✅ Ambas integrantes deben tener commits propios identificables

### Convención de commits

```
feat(scope): descripción en español
fix(scope): descripción en español
docs(scope): descripción en español
style(scope): descripción en español
refactor(scope): descripción en español
chore(scope): descripción en español
```

**Ejemplos:**
```
feat(auth): agregar login por rol con validación async
fix(ia): corregir respuesta cuando solicitud está incompleta
docs(readme): actualizar instrucciones de instalación
```

---

## 🤖 Módulo de Inteligencia Artificial

La IA **nunca toma la decisión final** — solo recomienda. La resolución siempre queda en manos del analista o administrador autorizado.

| Opción | Descripción |
|---|---|
| **Opción A** | API real de IA externa (requiere clave) |
| **Opción B** | Promise simulada con lógica de reglas (sin clave) |

---

## 👥 Roles del sistema

| Rol | Acceso principal |
|---|---|
| 🏢 Empresa | Crear y rastrear solicitudes propias |
| 🔍 Analista | Revisar, validar y dictaminar solicitudes |
| ⚙️ Administrador | Gestión completa del sistema |
| 📊 Gerente | Reportes y métricas ejecutivas |

---

## 📌 Estado de requerimientos

| Categoría | Total | Estado |
|---|---|---|
| Requerimientos funcionales (RF) | RF-01 al RF-18 | ✅ Aprobados |
| Requerimientos no funcionales (RNF) | RNF-01 al RNF-09 | ✅ Aprobados |
| Historias de usuario | 4 roles | ✅ Documentadas |
| Criterios de aceptación | Todos los RF Alta | ✅ Dado/Cuando/Entonces |

---

## 📅 Entregables del laboratorio

- [x] Documento de requerimientos (v2)
- [x] Tablero Trello estructurado
- [ ] Mockups en Stitch (5 pantallas mínimas)
- [ ] Backend json-server (db.json + servidor)
- [ ] Código fuente (asincronía + IA)
- [ ] Repositorio GitHub (ramas y pull requests)
- [ ] Demostración funcional
- [ ] Informe comparativo
- [ ] Hoja de ruta de expansión

---

## 📄 Licencia

Este proyecto es desarrollado con fines académicos para el curso de **Programación Front End con IA Aplicada**.
