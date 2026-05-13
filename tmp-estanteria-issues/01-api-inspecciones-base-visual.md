## Objetivo
Sanear la base REST de inspecciones antes de introducir la persistencia del resultado visual por slots.

## Alcance
- Corregir el manejo de errores para que el código HTTP real coincida con el error devuelto.
- Revisar `ApiExceptionHandler` y usar `ResponseEntity` o mecanismo equivalente.
- Eliminar el parámetro innecesario en `GET /api/inspecciones`.
- Permitir múltiples inspecciones para la misma estantería.
- Retirar unicidad indebida de `estanteriaCodigo` si sigue presente en entidad, validaciones o esquema.
- Mantener el comportamiento actual del CRUD de inspecciones sin introducir todavía el nuevo contrato visual.

## Criterios de cierre
- Los errores REST responden con códigos HTTP reales coherentes.
- `GET /api/inspecciones` funciona sin parámetros artificiales.
- Se pueden crear varias inspecciones de `EST-001`.
- No se rompe el flujo actual de consulta/listado.
- La solución queda preparada para la siguiente iteración de resultado visual por slots.

## Fuera de alcance
- No adaptar aún Vision al JSON por slots.
- No persistir aún slots visuales.
- No tocar CSS.
- No alterar estilos visuales del frontend.

## Rama prevista
`fix/<issue>-api-inspecciones-base-visual`
