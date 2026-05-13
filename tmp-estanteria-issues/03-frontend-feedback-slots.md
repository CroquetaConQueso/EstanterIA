## Objetivo
Mostrar en frontend el resultado visual por slots de una inspección y dejar de depender del antiguo enfoque de detecciones por producto.

## Alcance
- Actualizar la pantalla de inspección/vision para leer el nuevo contrato visual.
- Mostrar:
  - imagen asociada
  - estado general visual
  - ocupados
  - vacíos
  - anomalías
- Mostrar los 4 slots con:
  - slotId
  - orden
  - estadoVisual
  - confianza
- Adaptar listado/detalle de inspecciones para enseñar el nuevo resultado visual persistido.
- Representar de forma clara si hay huecos vacíos o anomalías.

## Restricción visual
- No modificar archivos CSS ni alterar el estilo existente sin confirmación expresa previa.
- Si para completar esta iteración pareciera imprescindible tocar CSS, detenerse y solicitar confirmación antes de hacerlo.

## Criterios de cierre
- El usuario puede ver el resultado visual por slots en la interfaz.
- Los estados OK, HUECOS_VACIOS, ANOMALIAS y MIXTO se entienden desde UI.
- No queda dependencia visible del contrato antiguo basado en productos concretos.

## Rama prevista
`feature/<issue>-frontend-feedback-slots`
