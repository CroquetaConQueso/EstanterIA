## Objetivo
Sustituir el proveedor simulado por Vision FastAPI real manteniendo exactamente el contrato visual por slots ya consumido por Backend y Frontend.

## Alcance
- Adaptar Vision para dejar de devolver detecciones por producto.
- Usar ROI y división en 4 slots.
- Clasificar cada slot como:
  - OCUPADO
  - VACIO
  - ANOMALIA
- Construir el JSON visual definitivo.
- Ajustar `/predict` y `/capture-and-predict`.
- Actualizar `schemas.py` y `inference.py`.
- Configurar `MODEL_PATH` hacia el clasificador elegido.
- Adaptar el backend para consumir el proveedor real sin cambiar el contrato ya integrado.

## Criterios de cierre
- Vision devuelve el mismo contrato JSON que antes simulaba backend.
- El flujo real cámara → Vision → Backend → inspección funciona.
- Frontend no requiere cambios contractuales para seguir funcionando.
- El flujo antiguo por detecciones de productos queda fuera del runtime principal.

## Rama prevista
`feature/<issue>-vision-real-contrato-slots`
