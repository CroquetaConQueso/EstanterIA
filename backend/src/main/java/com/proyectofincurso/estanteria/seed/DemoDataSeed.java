package com.proyectofincurso.estanteria.seed;

import com.proyectofincurso.estanteria.auth.AuthSessionService;
import com.proyectofincurso.estanteria.persistence.entity.AsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import com.proyectofincurso.estanteria.persistence.entity.OrientacionEstanteriaLayout;
import com.proyectofincurso.estanteria.persistence.entity.Plano;
import com.proyectofincurso.estanteria.persistence.entity.PlanoEstanteriaLayout;
import com.proyectofincurso.estanteria.persistence.entity.PlanoZona;
import com.proyectofincurso.estanteria.persistence.entity.Producto;
import com.proyectofincurso.estanteria.persistence.entity.ProductoProveedor;
import com.proyectofincurso.estanteria.persistence.entity.Proveedor;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.entity.SeccionEncargado;
import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.entity.UserRole;
import com.proyectofincurso.estanteria.persistence.repository.AsignacionProductoSlotRepository;
import com.proyectofincurso.estanteria.persistence.repository.EmpresaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.PasswordResetTokenRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoEstanteriaLayoutRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoZonaRepository;
import com.proyectofincurso.estanteria.persistence.repository.ProductoProveedorRepository;
import com.proyectofincurso.estanteria.persistence.repository.ProductoRepository;
import com.proyectofincurso.estanteria.persistence.repository.ProveedorRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionEncargadoRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
public class DemoDataSeed implements CommandLineRunner {

    private static final String EMPRESA_DEMO = "EMP-DEMO";
    private static final String PROVEEDOR_DEMO = "PROV-DEMO";
    private static final String PLANO_DEMO = "PLANO-DEMO";
    private static final String ESTANTERIA_PRINCIPAL = "EST-001";

    private final UserAccountRepository userAccountRepository;
    private final EmpresaRepository empresaRepository;
    private final TrabajadorRepository trabajadorRepository;
    private final SeccionRepository seccionRepository;
    private final SeccionEncargadoRepository seccionEncargadoRepository;
    private final ProductoRepository productoRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProductoProveedorRepository productoProveedorRepository;
    private final EstanteriaRepository estanteriaRepository;
    private final EstanteriaSlotConfiguracionRepository slotRepository;
    private final AsignacionProductoSlotRepository asignacionRepository;
    private final PlanoRepository planoRepository;
    private final PlanoZonaRepository planoZonaRepository;
    private final PlanoEstanteriaLayoutRepository planoEstanteriaLayoutRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthSessionService authSessionService;

    @Value("${app.demo.seed.enabled:true}")
    private boolean enabled;

    @Value("${app.demo.seed.reset-passwords:false}")
    private boolean resetPasswords;

    @Value("${app.demo.seed.reset-demo-data:false}")
    private boolean resetDemoData;

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            log.info("Seed demo integral desactivado por app.demo.seed.enabled=false");
            return;
        }

        if (resetDemoData) {
            log.warn("app.demo.seed.reset-demo-data=true esta configurado, pero el seed no realiza borrado masivo en esta iteracion");
        }

        log.info("Ejecutando seed demo integral de EstanterIA");
        Instant now = Instant.now();

        Empresa empresa = asegurarEmpresa(now);
        Trabajador laura = asegurarTrabajador(
                empresa,
                "Laura",
                "Encargada Demo",
                "laura.encargada@example.com",
                "+34000000001",
                TipoTrabajador.ENCARGADO,
                now
        );
        Trabajador mario = asegurarTrabajador(
                empresa,
                "Mario",
                "Reponedor Demo",
                "mario.reponedor@example.com",
                "+34000000002",
                TipoTrabajador.TRABAJADOR,
                now
        );

        Map<String, Seccion> secciones = new HashMap<>();
        secciones.put("SEC-DESPENSA", asegurarSeccion(
                empresa,
                "SEC-DESPENSA",
                "Despensa",
                "Seccion demo para productos de despensa.",
                now
        ));
        secciones.put("SEC-BEBIDAS", asegurarSeccion(
                empresa,
                "SEC-BEBIDAS",
                "Bebidas",
                "Seccion demo para bebidas.",
                now
        ));
        secciones.put("SEC-QUIMICOS", asegurarSeccion(
                empresa,
                "SEC-QUIMICOS",
                "Quimicos",
                "Seccion demo para productos de limpieza y quimicos.",
                now
        ));

        asegurarResponsablePrincipal(secciones.get("SEC-DESPENSA"), laura, now);
        asegurarResponsablePrincipal(secciones.get("SEC-BEBIDAS"), laura, now);

        Map<String, Producto> productos = asegurarProductos(now);
        Proveedor proveedor = asegurarProveedor(now);
        Map<String, ProductoProveedor> productoProveedor = asegurarProductoProveedor(productos, proveedor, now);

        Estanteria estanteria = asegurarEstanteriaPrincipal(secciones.get("SEC-DESPENSA"), now);
        Map<String, EstanteriaSlotConfiguracion> slots = asegurarSlotsEstanteriaPrincipal(estanteria, productos, now);
        asegurarAsignacionesActivas(slots, productoProveedor, now);

        Plano plano = asegurarPlano(empresa, now);
        PlanoZona zonaDespensa = asegurarZona(plano, secciones.get("SEC-DESPENSA"), 120.0, 100.0, 760.0, 420.0, now);
        asegurarZona(plano, secciones.get("SEC-BEBIDAS"), 920.0, 100.0, 240.0, 240.0, now);
        asegurarZona(plano, secciones.get("SEC-QUIMICOS"), 920.0, 380.0, 240.0, 240.0, now);
        asegurarLayoutEstanteria(plano, zonaDespensa, estanteria, now);

        asegurarUsuarioDemo("superadmin", "superadmin@example.com", "superadmin123", UserRole.SUPERADMIN, null, null);
        asegurarUsuarioDemo("admin", "admin@example.com", "admin123", UserRole.ADMIN, empresa, laura);
        asegurarUsuarioDemo("worker", "worker@example.com", "worker123", UserRole.WORKER, empresa, mario);

        log.info("Seed demo integral completado. Plano principal: {}, estanteria principal: {}", PLANO_DEMO, ESTANTERIA_PRINCIPAL);
    }

    private Empresa asegurarEmpresa(Instant now) {
        Empresa empresa = empresaRepository.findByCodigoIgnoreCase(EMPRESA_DEMO).orElseGet(Empresa::new);
        if (empresa.getCreatedAt() == null) {
            empresa.setCreatedAt(now);
        }
        empresa.setCodigo(EMPRESA_DEMO);
        empresa.setNombre("Empresa demo");
        empresa.setDescripcion("Empresa demo para validacion funcional de EstanterIA.");
        empresa.setActiva(true);
        empresa.setUpdatedAt(now);
        return empresaRepository.save(empresa);
    }

    private Trabajador asegurarTrabajador(
            Empresa empresa,
            String nombre,
            String apellidos,
            String email,
            String telefono,
            TipoTrabajador tipo,
            Instant now
    ) {
        Trabajador trabajador = trabajadorRepository.findByEmailContactoIgnoreCase(email).orElseGet(Trabajador::new);
        if (trabajador.getCreatedAt() == null) {
            trabajador.setCreatedAt(now);
        }
        trabajador.setEmpresa(empresa);
        trabajador.setNombre(nombre);
        trabajador.setApellidos(apellidos);
        trabajador.setEmailContacto(email);
        trabajador.setTelefonoContacto(telefono);
        trabajador.setTipoTrabajador(tipo);
        trabajador.setActivo(true);
        trabajador.setUpdatedAt(now);
        return trabajadorRepository.save(trabajador);
    }

    private Seccion asegurarSeccion(Empresa empresa, String codigo, String nombre, String descripcion, Instant now) {
        Seccion seccion = seccionRepository.findByEmpresaIdAndCodigoIgnoreCase(empresa.getId(), codigo).orElseGet(Seccion::new);
        if (seccion.getCreatedAt() == null) {
            seccion.setCreatedAt(now);
        }
        seccion.setEmpresa(empresa);
        seccion.setCodigo(codigo);
        seccion.setNombre(nombre);
        seccion.setDescripcion(descripcion);
        seccion.setActiva(true);
        seccion.setUpdatedAt(now);
        return seccionRepository.save(seccion);
    }

    private void asegurarResponsablePrincipal(Seccion seccion, Trabajador trabajador, Instant now) {
        seccionEncargadoRepository.findBySeccionIdAndActivoTrue(seccion.getId()).forEach(asignacion -> {
            if (Boolean.TRUE.equals(asignacion.getResponsablePrincipal()) && !asignacion.getTrabajador().getId().equals(trabajador.getId())) {
                asignacion.setResponsablePrincipal(false);
            }
        });

        SeccionEncargado asignacion = seccionEncargadoRepository
                .findBySeccionIdAndTrabajadorId(seccion.getId(), trabajador.getId())
                .orElseGet(SeccionEncargado::new);
        if (asignacion.getAsignadoAt() == null) {
            asignacion.setAsignadoAt(now);
        }
        asignacion.setSeccion(seccion);
        asignacion.setTrabajador(trabajador);
        asignacion.setResponsablePrincipal(true);
        asignacion.setActivo(true);
        seccionEncargadoRepository.save(asignacion);
    }

    private Map<String, Producto> asegurarProductos(Instant now) {
        Map<String, Producto> productos = new HashMap<>();
        productos.put("PROD-COMIDA-GATO", asegurarProducto(
                "PROD-COMIDA-GATO",
                "Comida de Gato",
                "Producto demo para el primer hueco de la estanteria principal.",
                now
        ));
        productos.put("PROD-ARROZ", asegurarProducto(
                "PROD-ARROZ",
                "Arroz",
                "Producto demo para el segundo hueco de la estanteria principal.",
                now
        ));
        productos.put("PROD-MACARRONES", asegurarProducto(
                "PROD-MACARRONES",
                "Macarrones",
                "Producto demo para el tercer hueco de la estanteria principal.",
                now
        ));
        productos.put("PROD-LENTEJAS", asegurarProducto(
                "PROD-LENTEJAS",
                "Lentejas",
                "Producto demo para el cuarto hueco de la estanteria principal.",
                now
        ));
        productos.put("PROD-AGUA", asegurarProducto("PROD-AGUA", "Agua", "Producto demo adicional.", now));
        productos.put("PROD-LECHE", asegurarProducto("PROD-LECHE", "Leche", "Producto demo adicional.", now));
        return productos;
    }

    private Producto asegurarProducto(String codigo, String nombre, String descripcion, Instant now) {
        Producto producto = productoRepository.findByCodigoInternoIgnoreCase(codigo).orElseGet(Producto::new);
        if (producto.getCreatedAt() == null) {
            producto.setCreatedAt(now);
        }
        if (producto.getProductoUuid() == null) {
            producto.setProductoUuid(UUID.randomUUID());
        }
        producto.setCodigoInterno(codigo);
        producto.setNombre(nombre);
        producto.setDescripcion(descripcion);
        producto.setActivo(true);
        producto.setUpdatedAt(now);
        return productoRepository.save(producto);
    }

    private Proveedor asegurarProveedor(Instant now) {
        Proveedor proveedor = proveedorRepository.findByCodigoIgnoreCase(PROVEEDOR_DEMO).orElseGet(Proveedor::new);
        if (proveedor.getCreatedAt() == null) {
            proveedor.setCreatedAt(now);
        }
        proveedor.setCodigo(PROVEEDOR_DEMO);
        proveedor.setNombre("Proveedor demo");
        proveedor.setDescripcion("Proveedor local para asignaciones demo.");
        proveedor.setActivo(true);
        proveedor.setUpdatedAt(now);
        return proveedorRepository.save(proveedor);
    }

    private Map<String, ProductoProveedor> asegurarProductoProveedor(Map<String, Producto> productos, Proveedor proveedor, Instant now) {
        Map<String, ProductoProveedor> resultado = new HashMap<>();
        productos.forEach((codigo, producto) -> {
            ProductoProveedor productoProveedor = productoProveedorRepository
                    .findByProductoIdAndProveedorId(producto.getId(), proveedor.getId())
                    .orElseGet(ProductoProveedor::new);
            if (productoProveedor.getCreatedAt() == null) {
                productoProveedor.setCreatedAt(now);
            }
            productoProveedor.setProducto(producto);
            productoProveedor.setProveedor(proveedor);
            productoProveedor.setClaveProductoProveedor(PROVEEDOR_DEMO + "-" + codigo);
            productoProveedor.setStockDisponible(true);
            productoProveedor.setActivo(true);
            productoProveedor.setUpdatedAt(now);
            resultado.put(codigo, productoProveedorRepository.save(productoProveedor));
        });
        return resultado;
    }

    private Estanteria asegurarEstanteriaPrincipal(Seccion seccion, Instant now) {
        Estanteria estanteria = estanteriaRepository.findByCodigoIgnoreCase(ESTANTERIA_PRINCIPAL).orElseGet(Estanteria::new);
        if (estanteria.getCreatedAt() == null) {
            estanteria.setCreatedAt(now);
        }
        estanteria.setSeccion(seccion);
        estanteria.setCodigo(ESTANTERIA_PRINCIPAL);
        estanteria.setNombre("Estanteria demo 001");
        estanteria.setDescripcion("Estanteria principal de cuatro slots para pruebas visuales.");
        estanteria.setActiva(true);
        estanteria.setUpdatedAt(now);
        return estanteriaRepository.save(estanteria);
    }

    private Map<String, EstanteriaSlotConfiguracion> asegurarSlotsEstanteriaPrincipal(
            Estanteria estanteria,
            Map<String, Producto> productos,
            Instant now
    ) {
        Map<String, String> productoPorSlot = Map.of(
                "slot_1", "PROD-COMIDA-GATO",
                "slot_2", "PROD-ARROZ",
                "slot_3", "PROD-MACARRONES",
                "slot_4", "PROD-LENTEJAS"
        );
        Map<String, Integer> ordenPorSlot = Map.of(
                "slot_1", 1,
                "slot_2", 2,
                "slot_3", 3,
                "slot_4", 4
        );
        Set<String> slotsPrincipales = productoPorSlot.keySet();

        Map<String, EstanteriaSlotConfiguracion> resultado = new HashMap<>();
        productoPorSlot.forEach((slotId, productoCodigo) -> {
            EstanteriaSlotConfiguracion slot = slotRepository
                    .findByEstanteriaIdAndSlotIdIgnoreCase(estanteria.getId(), slotId)
                    .orElseGet(EstanteriaSlotConfiguracion::new);
            if (slot.getCreatedAt() == null) {
                slot.setCreatedAt(now);
            }
            slot.setEstanteria(estanteria);
            slot.setSlotId(slotId);
            slot.setOrden(ordenPorSlot.get(slotId));
            slot.setProducto(productos.get(productoCodigo));
            slot.setCantidadObjetivo(8);
            slot.setActivo(true);
            slot.setUpdatedAt(now);
            resultado.put(slotId, slotRepository.save(slot));
        });

        slotRepository.findByEstanteriaId(estanteria.getId()).stream()
                .filter(slot -> !slotsPrincipales.contains(slot.getSlotId()))
                .forEach(slot -> {
                    slot.setActivo(false);
                    slot.setUpdatedAt(now);
                });

        return resultado;
    }

    private void asegurarAsignacionesActivas(
            Map<String, EstanteriaSlotConfiguracion> slots,
            Map<String, ProductoProveedor> productoProveedor,
            Instant now
    ) {
        Map<String, String> productoPorSlot = Map.of(
                "slot_1", "PROD-COMIDA-GATO",
                "slot_2", "PROD-ARROZ",
                "slot_3", "PROD-MACARRONES",
                "slot_4", "PROD-LENTEJAS"
        );
        LocalDate hoy = LocalDate.now();

        productoPorSlot.forEach((slotId, productoCodigo) -> {
            EstanteriaSlotConfiguracion slot = slots.get(slotId);
            ProductoProveedor esperado = productoProveedor.get(productoCodigo);
            AsignacionProductoSlot asignacion = asignacionRepository
                    .findAsignacionActivaDeSlot(slot.getId(), EstadoAsignacionProductoSlot.ACTIVA)
                    .orElseGet(AsignacionProductoSlot::new);
            if (asignacion.getCreatedAt() == null) {
                asignacion.setCreatedAt(now);
            }
            asignacion.setSlotConfiguracion(slot);
            asignacion.setProductoProveedor(esperado);
            asignacion.setFechaColocacion(hoy.minusDays(7));
            asignacion.setFechaCaducidad(hoy.plusDays(60));
            asignacion.setFechaRetiradaProgramada(hoy.plusDays(55));
            asignacion.setFechaRetiradaConfirmada(null);
            asignacion.setEstadoAsignacion(EstadoAsignacionProductoSlot.ACTIVA);
            asignacion.setObservaciones("Asignacion demo activa para pruebas operativas.");
            asignacion.setUpdatedAt(now);
            asignacionRepository.save(asignacion);
        });
    }

    private Plano asegurarPlano(Empresa empresa, Instant now) {
        Plano plano = planoRepository.findByCodigoIgnoreCase(PLANO_DEMO).orElseGet(Plano::new);
        if (plano.getCreatedAt() == null) {
            plano.setCreatedAt(now);
        }
        plano.setEmpresa(empresa);
        plano.setCodigo(PLANO_DEMO);
        plano.setNombre("Plano demo");
        plano.setDescripcion("Plano principal demo para validar zonas, estanterias y feedback visual.");
        plano.setAncho(1200.0);
        plano.setAlto(700.0);
        plano.setActivo(true);
        plano.setUpdatedAt(now);
        return planoRepository.save(plano);
    }

    private PlanoZona asegurarZona(
            Plano plano,
            Seccion seccion,
            Double x,
            Double y,
            Double width,
            Double height,
            Instant now
    ) {
        PlanoZona zona = planoZonaRepository.findByPlanoIdAndSeccionId(plano.getId(), seccion.getId()).orElseGet(PlanoZona::new);
        if (zona.getCreatedAt() == null) {
            zona.setCreatedAt(now);
        }
        zona.setPlano(plano);
        zona.setSeccion(seccion);
        zona.setX(x);
        zona.setY(y);
        zona.setWidth(width);
        zona.setHeight(height);
        zona.setUpdatedAt(now);
        return planoZonaRepository.save(zona);
    }

    private void asegurarLayoutEstanteria(Plano plano, PlanoZona zona, Estanteria estanteria, Instant now) {
        PlanoEstanteriaLayout layout = planoEstanteriaLayoutRepository
                .findByPlanoIdAndEstanteriaId(plano.getId(), estanteria.getId())
                .orElseGet(PlanoEstanteriaLayout::new);
        if (layout.getCreatedAt() == null) {
            layout.setCreatedAt(now);
        }
        layout.setPlano(plano);
        layout.setPlanoZona(zona);
        layout.setEstanteria(estanteria);
        layout.setX(220.0);
        layout.setY(220.0);
        layout.setWidth(480.0);
        layout.setHeight(120.0);
        layout.setOrientacion(OrientacionEstanteriaLayout.HORIZONTAL);
        layout.setUpdatedAt(now);
        planoEstanteriaLayoutRepository.save(layout);
    }

    private void asegurarUsuarioDemo(
            String username,
            String email,
            String rawPassword,
            UserRole role,
            Empresa empresa,
            Trabajador trabajador
    ) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(email)
                .or(() -> userAccountRepository.findByUsernameIgnoreCase(username))
                .orElseGet(UserAccount::new);

        boolean nuevo = user.getId() == null;
        user.setUsername(username);
        user.setEmail(email);
        user.setRole(role);
        user.setEnabled(true);
        user.setEmpresa(empresa);
        user.setTrabajador(trabajador);

        if (nuevo || resetPasswords || user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            if (!nuevo) {
                authSessionService.revocarSesionesActivas(user);
                Instant now = Instant.now();
                passwordResetTokenRepository.findByUserAndUsedAtIsNull(user)
                        .forEach(token -> token.setUsedAt(now));
            }
        }

        userAccountRepository.save(user);
    }
}
