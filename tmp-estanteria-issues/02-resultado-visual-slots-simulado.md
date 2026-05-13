## Objetivo
Persistir en backend un resultado visual por slots siguiendo el contrato JSON definitivo, usando temporalmente un proveedor simulado/mock.

## Contrato de referencia
La estructura debe seguir el contrato acordado:
- estanteriaCodigo
- modeloVersion
- capturadaEn
- imagen
- resumen visual
- slots con estadoVisual y confianza

## Alcance
- Crear DTOs Java alineados con el JSON visual acordado.
- Incorporar un proveedor simulado que devuelva escenarios controlados:
  - OK
  - HUECOS_VACIOS
  - ANOMALIAS
  - MIXTO
- Persistir el resultado visual dentro de la inspección.
- Guardar resumen:
  - estadoGeneralVisual
  - ocupados
  - vacíos
  - anomalías
- Guardar detalle de slots de forma coherente para consulta posterior.
- Exponer el resultado visual en la respuesta de detalle de inspección.

## Criterios de cierre
- Backend puede generar una inspección visual completa sin depender aún de FastAPI.
- La inspección queda persistida con resumen y slots.
- El detalle de inspección devuelve la información visual necesaria para frontend y plano.
- La solución deja preparada la futura sustitución del mock por Vision real.

## Fuera de alcance
- No tocar CSS.
- No implementar todavía el plano.
- No integrar todavía Vision FastAPI real.
- No introducir lógica avanzada de alertas por fechas o caducidad.

## Rama prevista
`feature/<issue>-resultado-visual-slots-simulado`
