## Objetivo
Cubrir con pruebas los puntos críticos del flujo principal antes de la entrega.

## Alcance
- Prueba de creación y consulta de inspecciones.
- Prueba de persistencia del resultado visual por slots.
- Prueba del handler de errores REST.
- Prueba mínima del flujo de seguridad JWT si la iteración correspondiente queda cerrada.
- Checklist manual end-to-end documentado.

## Criterios de cierre
- Existen tests útiles sobre el núcleo funcional.
- El flujo principal puede validarse de forma repetible.
- Se documenta una verificación manual de:
  - Frontend
  - Backend
  - Vision
  - Persistencia
  - Plano

## Rama prevista
`test/<issue>-flujo-visual-inspecciones-seguridad`
