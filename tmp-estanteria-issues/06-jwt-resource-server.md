## Objetivo
Migrar la autenticación actual a JWT con validación mediante Resource Server, replicando el enfoque ligero ya aplicado en NovaBank.

## Alcance
- Login emite JWT real.
- Token con:
  - subject
  - rol
  - issued-at
  - expiration
- Configurar Spring Security como Resource Server para validar Bearer Token.
- Proteger rutas sensibles.
- Mantener públicos los endpoints de auth y recuperación de contraseña.
- Ajustar frontend para enviar `Authorization: Bearer <token>`.
- Introducir `@PreAuthorize` solo en puntos concretos donde aporte valor.

## Criterios de cierre
- Peticiones sin token a endpoints protegidos devuelven 401.
- Peticiones con token válido funcionan.
- Restricciones de rol devuelven 403 cuando proceda.
- Secret y configuración JWT se externalizan.
- El frontend conserva flujo funcional de autenticación.

## Rama prevista
`feature/<issue>-jwt-resource-server`
