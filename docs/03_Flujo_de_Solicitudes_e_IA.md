# 03 — Flujo de Solicitudes y Motor de Inteligencia Artificial

Este documento detalla el ciclo de vida completo de un trámite en **ZoFranca CR**, desde su postulación inicial hasta su resolución ejecutiva final.

---

## 1. Diagrama del Ciclo de Vida

```text
[Empresa]
   │
   ├─► 1. Llena formulario (Inversión, Empleos, Sector, Zona Franca)
   │
   ▼
[Motor de Evaluación IA (ia.service.js)]
   │
   ├─► 2. Valida umbrales normativos de la Zona Franca destino
   ├─► 3. Asigna puntajeIA (0-100) y clasificacionIA
   ├─► 4. Genera justificacionIA automática
   │
   ▼
[Backend (db.json)] ──► Estado: "pendiente"
   │
   ▼
[Analista Técnico]
   │
   ├─► 5. Revisa expediente, documentos y sugerencia de la IA
   ├─► 6. Emite dictamen técnico con comentario vinculante
   │
   ▼
[Gerente General]
   │
   └─► 7. Revisa resolución y firma el acuerdo de otorgamiento
```

---

## 2. Algoritmo del Motor de IA (`src/services/ia.service.js`)

El motor de evaluación analiza la compatibilidad de la empresa con los requisitos de la Zona Franca seleccionada:

### Reglas de Ponderación:
1. **Inversión Mínima (+40 pts):**
   * Se compara la inversión declarada contra `zonaFranca.inversionMinima`.
   * Si cumple o supera el monto legal, suma 40 puntos.
2. **Generación de Empleos Directos (+30 pts):**
   * Se compara la proyección de empleos contra `zonaFranca.empleosMinimos`.
   * Si cumple o supera la cuota requerida, suma 30 puntos.
3. **Sector Productivo Autorizado (+30 pts):**
   * Verifica si el sector de la empresa pertenece a `zonaFranca.sectores` (ej. Tecnología, Manufactura, BPO).
   * Si el sector está autorizado, suma 30 puntos.

### Clasificación Resultante:
* **`Recomendada`:** Puntaje total $\ge 75$ puntos.
* **`Revisar`:** Puntaje total entre $50$ y $74$ puntos (requiere prevención o aclaración de requisitos).
* **`Rechazada`:** Puntaje total $< 50$ puntos (incumplimiento de criterios mínimos).

---

## 3. Trazabilidad y Auditoría
Cada cambio de estado y evaluación realizada queda registrada en el endpoint `/historial` con:
* Identificador de la solicitud.
* Identificador y nombre del usuario que tomó la acción.
* Tipo de evento (`evaluacion`, `decision`, `alerta`).
* Marca de tiempo en formato ISO.
