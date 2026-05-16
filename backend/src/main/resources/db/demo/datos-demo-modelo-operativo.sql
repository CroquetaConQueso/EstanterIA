-- Datos demo para el modelo operativo de EstanterIA.
-- Ejecucion manual recomendada en entorno local/desarrollo.
-- No crea ni modifica tablas: presupone que el esquema operativo ya existe.

INSERT INTO empresa (codigo, nombre, descripcion, activa, created_at, updated_at)
SELECT 'EMP-DEMO', 'Empresa demo', 'Empresa demo para validacion funcional de EstanterIA.', true, now(), now()
WHERE NOT EXISTS (
    SELECT 1 FROM empresa WHERE codigo = 'EMP-DEMO'
);

INSERT INTO trabajador (
    empresa_id, nombre, apellidos, email_contacto, telefono_contacto,
    tipo_trabajador, activo, created_at, updated_at
)
SELECT empresa_id, 'Laura', 'Encargada Demo', 'laura.encargada@example.com', '+34000000001',
       'ENCARGADO', true, now(), now()
FROM empresa
WHERE codigo = 'EMP-DEMO'
  AND NOT EXISTS (
      SELECT 1 FROM trabajador WHERE email_contacto = 'laura.encargada@example.com'
  );

INSERT INTO trabajador (
    empresa_id, nombre, apellidos, email_contacto, telefono_contacto,
    tipo_trabajador, activo, created_at, updated_at
)
SELECT empresa_id, 'Mario', 'Reponedor Demo', 'mario.reponedor@example.com', '+34000000002',
       'TRABAJADOR', true, now(), now()
FROM empresa
WHERE codigo = 'EMP-DEMO'
  AND NOT EXISTS (
      SELECT 1 FROM trabajador WHERE email_contacto = 'mario.reponedor@example.com'
  );

INSERT INTO seccion (empresa_id, codigo, nombre, descripcion, activa, created_at, updated_at)
SELECT empresa_id, 'SEC-DESPENSA', 'Despensa', 'Seccion demo para productos de despensa.', true, now(), now()
FROM empresa
WHERE codigo = 'EMP-DEMO'
  AND NOT EXISTS (
      SELECT 1 FROM seccion WHERE codigo = 'SEC-DESPENSA'
  );

INSERT INTO seccion_encargado (seccion_id, trabajador_id, responsable_principal, activo, asignado_at)
SELECT s.seccion_id, t.trabajador_id, true, true, now()
FROM seccion s
JOIN trabajador t ON t.empresa_id = s.empresa_id
WHERE s.codigo = 'SEC-DESPENSA'
  AND t.email_contacto = 'laura.encargada@example.com'
  AND NOT EXISTS (
      SELECT 1
      FROM seccion_encargado se
      WHERE se.seccion_id = s.seccion_id
        AND se.trabajador_id = t.trabajador_id
        AND se.activo = true
  );

INSERT INTO estanteria (seccion_id, codigo, nombre, descripcion, activa, created_at, updated_at)
SELECT seccion_id, 'EST-001', 'Estanteria demo 001', 'Estanteria de cuatro slots para pruebas visuales.', true, now(), now()
FROM seccion
WHERE codigo = 'SEC-DESPENSA'
  AND NOT EXISTS (
      SELECT 1 FROM estanteria WHERE codigo = 'EST-001'
  );

INSERT INTO producto (producto_uuid, codigo_interno, nombre, descripcion, activo, created_at, updated_at)
SELECT '11111111-1111-1111-1111-111111111111', 'PROD-COMIDA-GATO', 'Comida de Gato', 'Producto demo para el primer hueco de la estanteria principal.', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE codigo_interno = 'PROD-COMIDA-GATO');

INSERT INTO producto (producto_uuid, codigo_interno, nombre, descripcion, activo, created_at, updated_at)
SELECT '22222222-2222-2222-2222-222222222222', 'PROD-ARROZ', 'Arroz', 'Producto demo para el segundo hueco de la estanteria principal.', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE codigo_interno = 'PROD-ARROZ');

INSERT INTO producto (producto_uuid, codigo_interno, nombre, descripcion, activo, created_at, updated_at)
SELECT '33333333-3333-3333-3333-333333333333', 'PROD-MACARRONES', 'Macarrones', 'Producto demo para el tercer hueco de la estanteria principal.', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE codigo_interno = 'PROD-MACARRONES');

INSERT INTO producto (producto_uuid, codigo_interno, nombre, descripcion, activo, created_at, updated_at)
SELECT '44444444-4444-4444-4444-444444444444', 'PROD-LENTEJAS', 'Lentejas', 'Producto demo para el cuarto hueco de la estanteria principal.', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE codigo_interno = 'PROD-LENTEJAS');

INSERT INTO producto (producto_uuid, codigo_interno, nombre, descripcion, activo, created_at, updated_at)
SELECT '55555555-5555-5555-5555-555555555555', 'PROD-AGUA', 'Agua', 'Producto demo adicional.', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE codigo_interno = 'PROD-AGUA');

INSERT INTO producto (producto_uuid, codigo_interno, nombre, descripcion, activo, created_at, updated_at)
SELECT '66666666-6666-6666-6666-666666666666', 'PROD-LECHE', 'Leche', 'Producto demo adicional.', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE codigo_interno = 'PROD-LECHE');

INSERT INTO proveedor (codigo, nombre, descripcion, activo, created_at, updated_at)
SELECT 'PROV-DEMO', 'Proveedor demo', 'Proveedor local para asignaciones demo.', true, now(), now()
WHERE NOT EXISTS (
    SELECT 1 FROM proveedor WHERE codigo = 'PROV-DEMO'
);

INSERT INTO producto_proveedor (
    producto_id, proveedor_id, clave_producto_proveedor,
    stock_disponible, activo, created_at, updated_at
)
SELECT p.producto_id, pr.proveedor_id, concat('PROV-DEMO-', p.codigo_interno), true, true, now(), now()
FROM producto p
CROSS JOIN proveedor pr
WHERE pr.codigo = 'PROV-DEMO'
  AND p.codigo_interno IN ('PROD-COMIDA-GATO', 'PROD-ARROZ', 'PROD-MACARRONES', 'PROD-LENTEJAS', 'PROD-AGUA', 'PROD-LECHE')
  AND NOT EXISTS (
      SELECT 1
      FROM producto_proveedor pp
      WHERE pp.producto_id = p.producto_id
        AND pp.proveedor_id = pr.proveedor_id
  );

INSERT INTO estanteria_slot_configuracion (
    estanteria_id, slot_id, orden, producto_id,
    cantidad_objetivo, activo, created_at, updated_at
)
SELECT e.estanteria_id, datos.slot_id, datos.orden, p.producto_id,
       8, true, now(), now()
FROM estanteria e
JOIN (
    VALUES
        ('slot_1', 1, 'PROD-COMIDA-GATO'),
        ('slot_2', 2, 'PROD-ARROZ'),
        ('slot_3', 3, 'PROD-MACARRONES'),
        ('slot_4', 4, 'PROD-LENTEJAS')
) AS datos(slot_id, orden, codigo_producto) ON true
JOIN producto p ON p.codigo_interno = datos.codigo_producto
WHERE e.codigo = 'EST-001'
  AND NOT EXISTS (
      SELECT 1
      FROM estanteria_slot_configuracion esc
      WHERE esc.estanteria_id = e.estanteria_id
        AND esc.slot_id = datos.slot_id
  );

INSERT INTO asignacion_producto_slot (
    slot_configuracion_id, producto_proveedor_id,
    fecha_colocacion, fecha_caducidad, fecha_retirada_programada,
    fecha_retirada_confirmada, estado_asignacion, observaciones,
    created_at, updated_at
)
SELECT esc.slot_configuracion_id, pp.producto_proveedor_id,
       current_date - 7, current_date + 60, current_date + 55,
       null, 'ACTIVA', 'Asignacion demo activa para pruebas operativas.',
       now(), now()
FROM estanteria_slot_configuracion esc
JOIN producto p ON p.producto_id = esc.producto_id
JOIN producto_proveedor pp ON pp.producto_id = p.producto_id
JOIN proveedor pr ON pr.proveedor_id = pp.proveedor_id
WHERE pr.codigo = 'PROV-DEMO'
  AND NOT EXISTS (
      SELECT 1
      FROM asignacion_producto_slot aps
      WHERE aps.slot_configuracion_id = esc.slot_configuracion_id
        AND aps.estado_asignacion = 'ACTIVA'
  );
