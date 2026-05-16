# EstanterIA API

## Swagger y OpenAPI

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Swagger UI alternativa: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

La API usa JWT Bearer. Para probar endpoints privados:

1. Ejecuta `POST /api/login`.
2. Copia el campo `token` de la respuesta.
3. En Swagger UI, pulsa `Authorize`.
4. Introduce el token JWT en el esquema `bearerAuth`.
5. Ejecuta endpoints privados normalmente.

En Postman, las peticiones privadas usan el header:

```text
Authorization: Bearer {{tokenAdmin}}
```

o:

```text
Authorization: Bearer {{tokenWorker}}
```

segun el rol que se quiera probar.

## Usuarios demo

Si el seed demo integral esta activo o disponible, las credenciales esperadas son:

- Administrador: `admin@example.com` / `admin123`
- Trabajador: `worker@example.com` / `worker123`
- Superadministrador: `superadmin@example.com` / `superadmin123`

## Orden recomendado de pruebas

1. Login como admin y guardar el token.
2. `GET /api/perfil` para comprobar sesion y rol.
3. `GET /api/empresas/EMP-DEMO/planos`.
4. `GET /api/planos/PLANO-DEMO/operativo`.
5. Probar endpoints estructurales con admin:
   - crear plano;
   - crear seccion;
   - crear estanteria;
   - crear producto;
   - crear tarea manual.
6. Login como worker y comprobar que las escrituras estructurales devuelven `403`.
7. Lanzar o consultar inspecciones.
8. Revisar alertas abiertas y probar cierre administrativo con admin.
9. Revisar tareas y cambios de estado.
10. Consultar inventario/modelo operativo.

## Coleccion Postman

Archivos incluidos:

- `docs/postman/EstanterIA.postman_collection.json`
- `docs/postman/EstanterIA.local.postman_environment.json`

Importa ambos en Postman. Ejecuta primero `Auth / Login admin` o `Auth / Login worker`; los scripts guardan `tokenAdmin` y `tokenWorker` automaticamente en variables de entorno.

Variables principales:

- `baseUrl`: URL del backend local.
- `tokenAdmin`: JWT de admin.
- `tokenWorker`: JWT de worker.
- `planoCodigo`: codigo de plano usado en pruebas.
- `estanteriaCodigo`: codigo de estanteria usado en pruebas.
- `seccionId`, `tareaId`, `alertaId`: ids para endpoints parametrizados.

## Permisos basicos

- Publicos: login, registro y recuperacion de password.
- Autenticados: lecturas operativas, perfil, planos, inspecciones, inventario, alertas y tareas segun flujo existente.
- ADMIN/SUPERADMIN: escrituras estructurales, creacion de productos, creacion/edicion de tareas manuales y cierre administrativo de alertas.
- Panel web principal: reservado a ADMIN/SUPERADMIN. WORKER se mantiene en backend para asignacion de tareas, trazabilidad, pruebas de permisos y futura interfaz operativa separada.
- Credenciales demo: si hace falta restaurarlas, arrancar temporalmente con `app.demo.seed.reset-passwords=true` y volver a dejarlo en `false`.

No se han cambiado reglas de negocio para generar esta documentacion.
