package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.AsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import com.proyectofincurso.estanteria.persistence.entity.Producto;
import com.proyectofincurso.estanteria.persistence.entity.ProductoProveedor;
import com.proyectofincurso.estanteria.persistence.entity.Proveedor;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.entity.SeccionEncargado;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.entity.TrabajadorEstanteria;
import com.proyectofincurso.estanteria.persistence.repository.AsignacionProductoSlotRepository;
import com.proyectofincurso.estanteria.persistence.repository.EmpresaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.ProductoRepository;
import com.proyectofincurso.estanteria.persistence.repository.ProductoProveedorRepository;
import com.proyectofincurso.estanteria.persistence.repository.ProveedorRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionEncargadoRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorEstanteriaRepository;
import com.proyectofincurso.estanteria.web.dto.AsignacionActivaSlotResponse;
import com.proyectofincurso.estanteria.web.dto.ActualizarEstanteriaRequest;
import com.proyectofincurso.estanteria.web.dto.ActualizarEstanteriaSlotRequest;
import com.proyectofincurso.estanteria.web.dto.ActualizarProductoRequest;
import com.proyectofincurso.estanteria.web.dto.ActualizarSeccionRequest;
import com.proyectofincurso.estanteria.web.dto.CrearEstanteriaRequest;
import com.proyectofincurso.estanteria.web.dto.CrearEstanteriaSlotRequest;
import com.proyectofincurso.estanteria.web.dto.CrearProductoRequest;
import com.proyectofincurso.estanteria.web.dto.CrearSeccionRequest;
import com.proyectofincurso.estanteria.web.dto.EmpresaResponse;
import com.proyectofincurso.estanteria.web.dto.EstanteriaConfiguracionResponse;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.GuardarAsignacionActivaSlotRequest;
import com.proyectofincurso.estanteria.web.dto.PlanoResponsableResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoCreadoResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoProveedorResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProveedorResumenResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
import com.proyectofincurso.estanteria.web.dto.SlotConfiguradoResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorResumenResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorAsignadoEstanteriaResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModeloOperativoService {

    private final EmpresaRepository empresaRepository;
    private final SeccionRepository seccionRepository;
    private final EstanteriaRepository estanteriaRepository;
    private final EstanteriaSlotConfiguracionRepository slotConfiguracionRepository;
    private final AsignacionProductoSlotRepository asignacionProductoSlotRepository;
    private final SeccionEncargadoRepository seccionEncargadoRepository;
    private final ProductoRepository productoRepository;
    private final ProductoProveedorRepository productoProveedorRepository;
    private final ProveedorRepository proveedorRepository;
    private final TrabajadorRepository trabajadorRepository;
    private final TrabajadorEstanteriaRepository trabajadorEstanteriaRepository;
    private final AlertaOperativaService alertaOperativaService;
    private static final String PROVEEDOR_DEMO_CODIGO = "PROV-DEMO";

    @Transactional(readOnly = true)
    public EmpresaResponse obtenerEmpresaActivaPorCodigo(String codigo) {
        Empresa empresa = empresaRepository.findByCodigoAndActivaTrue(codigo)
                .orElseThrow(() -> ApiException.notFound(
                        "EMPRESA_NOT_FOUND",
                        "No existe una empresa activa con el codigo indicado"
                ));

        return toEmpresaResponse(empresa);
    }

    @Transactional(readOnly = true)
    public List<SeccionResponse> obtenerSeccionesDeEmpresa(String codigoEmpresa) {
        return obtenerSeccionesDeEmpresa(codigoEmpresa, false);
    }

    @Transactional(readOnly = true)
    public List<SeccionResponse> obtenerSeccionesDeEmpresa(String codigoEmpresa, boolean incluirInactivas) {
        if (empresaRepository.findByCodigoAndActivaTrue(codigoEmpresa).isEmpty()) {
            throw ApiException.notFound(
                    "EMPRESA_NOT_FOUND",
                    "No existe una empresa activa con el codigo indicado"
            );
        }

        List<Seccion> secciones = incluirInactivas
                ? seccionRepository.findByEmpresaCodigoOrderByNombreAsc(codigoEmpresa)
                : seccionRepository.findByEmpresaCodigoAndActivaTrueOrderByNombreAsc(codigoEmpresa);

        return secciones.stream()
                .map(this::toSeccionResponse)
                .toList();
    }

    @Transactional
    public SeccionResponse crearSeccion(CrearSeccionRequest request) {
        Empresa empresa = empresaRepository.findByCodigoAndActivaTrue(normalizar(request.empresaCodigo()))
                .orElseThrow(() -> ApiException.notFound(
                        "EMPRESA_NOT_FOUND",
                        "No existe una empresa activa con el codigo indicado"
                ));

        String codigo = normalizar(request.codigo());
        if (seccionRepository.existsByEmpresaIdAndCodigoIgnoreCase(empresa.getId(), codigo)) {
            throw ApiException.conflict(
                    "SECCION_CODIGO_DUPLICADO",
                    "Ya existe una seccion con ese codigo en la empresa"
            );
        }

        Instant ahora = Instant.now();
        Seccion seccion = new Seccion();
        seccion.setEmpresa(empresa);
        seccion.setCodigo(codigo);
        seccion.setNombre(normalizar(request.nombre()));
        seccion.setDescripcion(normalizarNullable(request.descripcion()));
        seccion.setActiva(true);
        seccion.setCreatedAt(ahora);
        seccion.setUpdatedAt(ahora);

        return toSeccionResponse(seccionRepository.save(seccion));
    }

    @Transactional
    public SeccionResponse actualizarSeccion(Long seccionId, ActualizarSeccionRequest request) {
        Seccion seccion = seccionRepository.findByIdAndActivaTrue(seccionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SECCION_NOT_FOUND",
                        "No existe una seccion activa con el identificador indicado"
                ));

        String codigo = normalizar(request.codigo());
        if (seccionRepository.existsByEmpresaIdAndCodigoIgnoreCaseAndIdNot(
                seccion.getEmpresa().getId(), codigo, seccion.getId())) {
            throw ApiException.conflict(
                    "SECCION_CODIGO_DUPLICADO",
                    "Ya existe una seccion con ese codigo en la empresa"
            );
        }

        seccion.setCodigo(codigo);
        seccion.setNombre(normalizar(request.nombre()));
        seccion.setDescripcion(normalizarNullable(request.descripcion()));
        seccion.setUpdatedAt(Instant.now());

        return toSeccionResponse(seccionRepository.save(seccion));
    }

    @Transactional
    public SeccionResponse desactivarSeccion(Long seccionId) {
        Seccion seccion = seccionRepository.findById(seccionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SECCION_NOT_FOUND",
                        "No existe una seccion con el identificador indicado"
                ));

        if (!Boolean.FALSE.equals(seccion.getActiva())) {
            seccion.setActiva(false);
            seccion.setUpdatedAt(Instant.now());
            seccion = seccionRepository.save(seccion);
        }

        return toSeccionResponse(seccion);
    }

    @Transactional
    public SeccionResponse reactivarSeccion(Long seccionId) {
        Seccion seccion = seccionRepository.findById(seccionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SECCION_NOT_FOUND",
                        "No existe una seccion con el identificador indicado"
                ));

        if (!Boolean.TRUE.equals(seccion.getActiva())) {
            seccion.setActiva(true);
            seccion.setUpdatedAt(Instant.now());
            seccion = seccionRepository.save(seccion);
        }

        return toSeccionResponse(seccion);
    }

    @Transactional
    public PlanoResponsableResponse asignarResponsablePrincipal(Long seccionId, Long trabajadorId) {
        Seccion seccion = seccionRepository.findByIdAndActivaTrue(seccionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SECCION_NOT_FOUND",
                        "No existe una seccion activa con el identificador indicado"
                ));

        Trabajador trabajador = trabajadorRepository.findByIdAndActivoTrue(trabajadorId)
                .orElseThrow(() -> ApiException.notFound(
                        "TRABAJADOR_NOT_FOUND",
                        "No existe un trabajador activo con el identificador indicado"
                ));

        if (!trabajador.getEmpresa().getId().equals(seccion.getEmpresa().getId())) {
            throw ApiException.badRequest(
                    "TRABAJADOR_EMPRESA_INCOHERENTE",
                    "El trabajador no pertenece a la misma empresa que la seccion"
            );
        }

        List<SeccionEncargado> encargadosActivos = seccionEncargadoRepository.findBySeccionIdAndActivoTrue(seccionId);
        encargadosActivos.forEach(encargado -> encargado.setResponsablePrincipal(false));

        SeccionEncargado asignacion = seccionEncargadoRepository
                .findBySeccionIdAndTrabajadorId(seccionId, trabajadorId)
                .orElseGet(() -> {
                    SeccionEncargado nuevaAsignacion = new SeccionEncargado();
                    nuevaAsignacion.setSeccion(seccion);
                    nuevaAsignacion.setTrabajador(trabajador);
                    return nuevaAsignacion;
                });

        asignacion.setActivo(true);
        asignacion.setResponsablePrincipal(true);
        asignacion.setAsignadoAt(Instant.now());
        if (!encargadosActivos.contains(asignacion)) {
            encargadosActivos.add(asignacion);
        }
        seccionEncargadoRepository.saveAll(encargadosActivos);

        return toPlanoResponsableResponse(asignacion);
    }

    @Transactional(readOnly = true)
    public List<EstanteriaResumenResponse> obtenerEstanteriasDeSeccion(Long seccionId) {
        return obtenerEstanteriasDeSeccion(seccionId, false);
    }

    @Transactional(readOnly = true)
    public List<EstanteriaResumenResponse> obtenerEstanteriasDeSeccion(Long seccionId, boolean incluirInactivas) {
        Seccion seccion = seccionRepository.findById(seccionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SECCION_NOT_FOUND",
                        "No existe la seccion solicitada"
                ));

        if (!incluirInactivas && Boolean.FALSE.equals(seccion.getActiva())) {
            return List.of();
        }

        List<Estanteria> estanterias = incluirInactivas
                ? estanteriaRepository.findBySeccionIdOrderByCodigoAsc(seccionId)
                : estanteriaRepository.findBySeccionIdAndActivaTrueOrderByCodigoAsc(seccionId);

        return estanterias.stream()
                .map(this::toEstanteriaResumenResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TrabajadorAsignadoEstanteriaResponse> obtenerTrabajadoresAsignadosEstanteria(String codigo) {
        Estanteria estanteria = estanteriaRepository.findWithSeccionByCodigoIgnoreCase(normalizar(codigo))
                .orElseThrow(() -> ApiException.notFound(
                        "ESTANTERIA_NOT_FOUND",
                        "No existe una estanteria con el codigo indicado"
                ));

        return trabajadorEstanteriaRepository
                .findByEstanteriaCodigoIgnoreCaseAndActivaTrueOrderByTrabajadorApellidosAscTrabajadorNombreAsc(estanteria.getCodigo())
                .stream()
                .map(asignacion -> toTrabajadorAsignadoEstanteriaResponse(asignacion.getTrabajador()))
                .toList();
    }

    @Transactional
    public TrabajadorAsignadoEstanteriaResponse asignarTrabajadorEstanteria(String codigo, Long trabajadorId) {
        Estanteria estanteria = estanteriaRepository.findWithSeccionByCodigoIgnoreCase(normalizar(codigo))
                .orElseThrow(() -> ApiException.notFound(
                        "ESTANTERIA_NOT_FOUND",
                        "No existe una estanteria con el codigo indicado"
                ));
        if (!Boolean.TRUE.equals(estanteria.getActiva())) {
            throw ApiException.conflict(
                    "ESTANTERIA_INACTIVA",
                    "No se puede asignar trabajadores a una estanteria inactiva."
            );
        }

        Trabajador trabajador = trabajadorRepository.findById(trabajadorId)
                .orElseThrow(() -> ApiException.notFound(
                        "TRABAJADOR_NOT_FOUND",
                        "No existe el trabajador indicado"
                ));
        validarTrabajadorAsignable(estanteria, trabajador);

        Instant ahora = Instant.now();
        TrabajadorEstanteria asignacion = trabajadorEstanteriaRepository
                .findByEstanteriaIdAndTrabajadorId(estanteria.getId(), trabajador.getId())
                .orElseGet(() -> {
                    TrabajadorEstanteria nueva = new TrabajadorEstanteria();
                    nueva.setEstanteria(estanteria);
                    nueva.setTrabajador(trabajador);
                    nueva.setCreatedAt(ahora);
                    return nueva;
                });
        asignacion.setActiva(true);
        asignacion.setUpdatedAt(ahora);
        trabajadorEstanteriaRepository.save(asignacion);

        return toTrabajadorAsignadoEstanteriaResponse(trabajador);
    }

    @Transactional
    public TrabajadorAsignadoEstanteriaResponse desasignarTrabajadorEstanteria(String codigo, Long trabajadorId) {
        Estanteria estanteria = estanteriaRepository.findWithSeccionByCodigoIgnoreCase(normalizar(codigo))
                .orElseThrow(() -> ApiException.notFound(
                        "ESTANTERIA_NOT_FOUND",
                        "No existe una estanteria con el codigo indicado"
                ));
        TrabajadorEstanteria asignacion = trabajadorEstanteriaRepository
                .findByEstanteriaIdAndTrabajadorId(estanteria.getId(), trabajadorId)
                .orElseThrow(() -> ApiException.notFound(
                        "TRABAJADOR_ESTANTERIA_NOT_FOUND",
                        "No existe una asignacion activa para ese trabajador y estanteria"
                ));
        asignacion.setActiva(false);
        asignacion.setUpdatedAt(Instant.now());
        trabajadorEstanteriaRepository.save(asignacion);

        return toTrabajadorAsignadoEstanteriaResponse(asignacion.getTrabajador());
    }

    private void validarTrabajadorAsignable(Estanteria estanteria, Trabajador trabajador) {
        if (!Boolean.TRUE.equals(trabajador.getActivo())) {
            throw ApiException.conflict(
                    "TRABAJADOR_INACTIVO",
                    "No se puede asignar un trabajador inactivo."
            );
        }

        if (estadoDisponibilidad(trabajador) != EstadoDisponibilidadTrabajador.DISPONIBLE) {
            throw ApiException.conflict(
                    "TRABAJADOR_NO_DISPONIBLE",
                    "No se puede asignar un trabajador no disponible."
            );
        }

        Long empresaEstanteriaId = estanteria.getSeccion().getEmpresa().getId();
        Long empresaTrabajadorId = trabajador.getEmpresa() == null ? null : trabajador.getEmpresa().getId();
        if (empresaEstanteriaId != null && empresaTrabajadorId != null && !empresaEstanteriaId.equals(empresaTrabajadorId)) {
            throw ApiException.conflict(
                    "TRABAJADOR_EMPRESA_DISTINTA",
                    "El trabajador no pertenece a la misma empresa que la estanteria."
            );
        }
    }

    @Transactional
    public EstanteriaConfiguracionResponse crearEstanteria(CrearEstanteriaRequest request) {
        Seccion seccion = seccionRepository.findByIdAndActivaTrue(request.seccionId())
                .orElseThrow(() -> ApiException.notFound(
                        "SECCION_NOT_FOUND",
                        "No existe una seccion activa con el identificador indicado"
                ));

        String codigo = normalizar(request.codigo());
        if (estanteriaRepository.existsByCodigoIgnoreCase(codigo)) {
            throw ApiException.conflict(
                    "ESTANTERIA_CODIGO_DUPLICADO",
                    "Ya existe una estanteria con el codigo indicado"
            );
        }

        List<CrearEstanteriaSlotRequest> slotsRequest = request.slots() == null ? List.of() : request.slots();
        validarSlotsAlta(slotsRequest);

        Map<Long, Producto> productos = productoRepository.findAllById(
                        slotsRequest.stream().map(CrearEstanteriaSlotRequest::productoId).toList()
                ).stream()
                .filter(producto -> Boolean.TRUE.equals(producto.getActivo()))
                .collect(Collectors.toMap(Producto::getId, Function.identity()));

        for (CrearEstanteriaSlotRequest slotRequest : slotsRequest) {
            if (!productos.containsKey(slotRequest.productoId())) {
                throw ApiException.notFound(
                        "PRODUCTO_NOT_FOUND",
                        "No existe un producto activo con el identificador indicado"
                );
            }
        }

        Instant ahora = Instant.now();
        Estanteria estanteria = new Estanteria();
        estanteria.setSeccion(seccion);
        estanteria.setCodigo(codigo);
        estanteria.setNombre(normalizar(request.nombre()));
        estanteria.setDescripcion(normalizarNullable(request.descripcion()));
        estanteria.setActiva(true);
        estanteria.setCreatedAt(ahora);
        estanteria.setUpdatedAt(ahora);
        Estanteria estanteriaGuardada = estanteriaRepository.save(estanteria);

        List<EstanteriaSlotConfiguracion> slots = slotsRequest.stream()
                .map(slotRequest -> {
                    EstanteriaSlotConfiguracion slot = new EstanteriaSlotConfiguracion();
                    slot.setEstanteria(estanteriaGuardada);
                    slot.setSlotId(normalizar(slotRequest.slotId()));
                    slot.setOrden(slotRequest.orden());
                    slot.setProducto(productos.get(slotRequest.productoId()));
                    slot.setCantidadObjetivo(slotRequest.cantidadObjetivo());
                    slot.setActivo(true);
                    slot.setCreatedAt(ahora);
                    slot.setUpdatedAt(ahora);
                    return slot;
                })
                .toList();
        slotConfiguracionRepository.saveAll(slots);

        return obtenerConfiguracionDeEstanteria(estanteriaGuardada.getCodigo());
    }

    @Transactional
    public EstanteriaConfiguracionResponse actualizarEstanteria(String codigo, ActualizarEstanteriaRequest request) {
        Estanteria estanteria = estanteriaRepository.findWithSeccionByCodigoAndActivaTrue(codigo)
                .orElseThrow(() -> ApiException.notFound(
                        "ESTANTERIA_NOT_FOUND",
                        "No existe una estanteria activa con el codigo indicado"
                ));

        List<ActualizarEstanteriaSlotRequest> slotsRequest = request.slots() == null ? List.of() : request.slots();
        validarSlotsActualizacion(slotsRequest);

        Map<Long, Producto> productos = productoRepository.findAllById(
                        slotsRequest.stream().map(ActualizarEstanteriaSlotRequest::productoId).toList()
                ).stream()
                .filter(producto -> Boolean.TRUE.equals(producto.getActivo()))
                .collect(Collectors.toMap(Producto::getId, Function.identity()));

        for (ActualizarEstanteriaSlotRequest slotRequest : slotsRequest) {
            if (!productos.containsKey(slotRequest.productoId())) {
                throw ApiException.notFound(
                        "PRODUCTO_NOT_FOUND",
                        "No existe un producto activo con el identificador indicado"
                );
            }
        }

        Instant ahora = Instant.now();
        estanteria.setNombre(normalizar(request.nombre()));
        estanteria.setDescripcion(normalizarNullable(request.descripcion()));
        estanteria.setUpdatedAt(ahora);
        estanteriaRepository.save(estanteria);

        Map<String, EstanteriaSlotConfiguracion> slotsExistentes = slotConfiguracionRepository
                .findByEstanteriaId(estanteria.getId()).stream()
                .collect(Collectors.toMap(
                        slot -> slot.getSlotId().toLowerCase(),
                        Function.identity(),
                        (actual, duplicado) -> actual
                ));

        Set<String> slotsRecibidos = new HashSet<>();
        for (ActualizarEstanteriaSlotRequest slotRequest : slotsRequest) {
            String slotId = normalizar(slotRequest.slotId());
            slotsRecibidos.add(slotId.toLowerCase());
            EstanteriaSlotConfiguracion slot = slotsExistentes.get(slotId.toLowerCase());
            if (slot == null) {
                slot = new EstanteriaSlotConfiguracion();
                slot.setEstanteria(estanteria);
                slot.setCreatedAt(ahora);
            }
            slot.setSlotId(slotId);
            slot.setOrden(slotRequest.orden());
            slot.setProducto(productos.get(slotRequest.productoId()));
            slot.setCantidadObjetivo(slotRequest.cantidadObjetivo());
            slot.setActivo(slotRequest.activo() == null || slotRequest.activo());
            slot.setUpdatedAt(ahora);
            slotConfiguracionRepository.save(slot);
        }

        slotsExistentes.forEach((slotId, slot) -> {
            if (!slotsRecibidos.contains(slotId) && Boolean.TRUE.equals(slot.getActivo())) {
                slot.setActivo(false);
                slot.setUpdatedAt(ahora);
                slotConfiguracionRepository.save(slot);
            }
        });

        return obtenerConfiguracionDeEstanteria(estanteria.getCodigo());
    }

    @Transactional
    public EstanteriaConfiguracionResponse desactivarEstanteria(String codigo) {
        Estanteria estanteria = estanteriaRepository.findWithSeccionByCodigoIgnoreCase(normalizar(codigo))
                .orElseThrow(() -> ApiException.notFound(
                        "ESTANTERIA_NOT_FOUND",
                        "No existe una estanteria con el codigo indicado"
                ));

        if (!Boolean.FALSE.equals(estanteria.getActiva())) {
            estanteria.setActiva(false);
            estanteria.setUpdatedAt(Instant.now());
            estanteriaRepository.save(estanteria);
        }

        return obtenerConfiguracionDeEstanteria(estanteria.getCodigo());
    }

    @Transactional
    public EstanteriaConfiguracionResponse reactivarEstanteria(String codigo) {
        Estanteria estanteria = estanteriaRepository.findWithSeccionByCodigoIgnoreCase(normalizar(codigo))
                .orElseThrow(() -> ApiException.notFound(
                        "ESTANTERIA_NOT_FOUND",
                        "No existe una estanteria con el codigo indicado"
                ));

        if (!Boolean.TRUE.equals(estanteria.getActiva())) {
            estanteria.setActiva(true);
            estanteria.setUpdatedAt(Instant.now());
            estanteriaRepository.save(estanteria);
        }

        return obtenerConfiguracionDeEstanteria(estanteria.getCodigo());
    }

    @Transactional(readOnly = true)
    public List<ProductoResumenResponse> obtenerProductosActivos() {
        return obtenerProductos(false);
    }

    @Transactional(readOnly = true)
    public List<ProductoResumenResponse> obtenerProductos(boolean incluirInactivos) {
        List<Producto> productos = incluirInactivos
                ? productoRepository.findAllByOrderByNombreAsc()
                : productoRepository.findByActivoTrueOrderByNombreAsc();

        return productos.stream()
                .map(this::toProductoResumenResponse)
                .toList();
    }

    @Transactional
    public ProductoCreadoResponse crearProducto(CrearProductoRequest request) {
        String codigoInterno = normalizar(request.codigoInterno());
        if (productoRepository.existsByCodigoInternoIgnoreCase(codigoInterno)) {
            throw ApiException.conflict(
                    "PRODUCTO_CODIGO_DUPLICADO",
                    "Ya existe un producto con ese codigo interno"
            );
        }

        Instant ahora = Instant.now();
        Producto producto = new Producto();
        producto.setProductoUuid(UUID.randomUUID());
        producto.setCodigoInterno(codigoInterno);
        producto.setNombre(normalizar(request.nombre()));
        producto.setDescripcion(normalizarNullable(request.descripcion()));
        producto.setActivo(true);
        producto.setCreatedAt(ahora);
        producto.setUpdatedAt(ahora);

        Producto productoGuardado = productoRepository.save(producto);
        ProductoProveedor productoProveedor = null;

        boolean vincularProveedorDemo = request.vincularProveedorDemo() == null || request.vincularProveedorDemo();
        if (vincularProveedorDemo) {
            Optional<Proveedor> proveedorDemo = proveedorRepository.findByCodigoAndActivoTrue(PROVEEDOR_DEMO_CODIGO);
            if (proveedorDemo.isPresent()) {
                productoProveedor = new ProductoProveedor();
                productoProveedor.setProducto(productoGuardado);
                productoProveedor.setProveedor(proveedorDemo.get());
                productoProveedor.setClaveProductoProveedor(PROVEEDOR_DEMO_CODIGO + "-" + codigoInterno);
                productoProveedor.setStockDisponible(request.stockDisponible() == null || request.stockDisponible());
                productoProveedor.setActivo(true);
                productoProveedor.setCreatedAt(ahora);
                productoProveedor.setUpdatedAt(ahora);
                productoProveedorRepository.save(productoProveedor);
            }
        }

        return toProductoCreadoResponse(productoGuardado, productoProveedor);
    }

    @Transactional
    public ProductoCreadoResponse actualizarProducto(Long id, ActualizarProductoRequest request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound(
                        "PRODUCTO_NOT_FOUND",
                        "No existe el producto indicado"
                ));

        producto.setNombre(normalizar(request.nombre()));
        producto.setDescripcion(normalizarNullable(request.descripcion()));
        producto.setUpdatedAt(Instant.now());

        ProductoProveedor productoProveedor = productoProveedorRepository
                .findByProductoIdAndProveedorCodigoIgnoreCase(producto.getId(), PROVEEDOR_DEMO_CODIGO)
                .orElse(null);

        if (request.stockDisponible() != null && productoProveedor != null) {
            productoProveedor.setStockDisponible(request.stockDisponible());
            productoProveedor.setUpdatedAt(Instant.now());
            productoProveedorRepository.save(productoProveedor);
        }

        return toProductoCreadoResponse(productoRepository.save(producto), productoProveedor);
    }

    @Transactional
    public ProductoCreadoResponse desactivarProducto(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound(
                        "PRODUCTO_NOT_FOUND",
                        "No existe el producto indicado"
                ));

        if (!Boolean.FALSE.equals(producto.getActivo())) {
            producto.setActivo(false);
            producto.setUpdatedAt(Instant.now());
            producto = productoRepository.save(producto);
        }

        return toProductoCreadoResponse(producto, productoProveedorDemo(producto.getId()));
    }

    @Transactional
    public ProductoCreadoResponse reactivarProducto(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound(
                        "PRODUCTO_NOT_FOUND",
                        "No existe el producto indicado"
                ));

        if (!Boolean.TRUE.equals(producto.getActivo())) {
            producto.setActivo(true);
            producto.setUpdatedAt(Instant.now());
            producto = productoRepository.save(producto);
        }

        return toProductoCreadoResponse(producto, productoProveedorDemo(producto.getId()));
    }

    private ProductoProveedor productoProveedorDemo(Long productoId) {
        return productoProveedorRepository
                .findByProductoIdAndProveedorCodigoIgnoreCase(productoId, PROVEEDOR_DEMO_CODIGO)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ProductoProveedorResumenResponse> obtenerProductosProveedorActivos() {
        return productoProveedorRepository.findByActivoTrueOrderByProductoNombreAscProveedorNombreAsc().stream()
                .filter(productoProveedor -> Boolean.TRUE.equals(productoProveedor.getProducto().getActivo()))
                .filter(productoProveedor -> Boolean.TRUE.equals(productoProveedor.getProveedor().getActivo()))
                .map(this::toProductoProveedorResumenResponse)
                .toList();
    }

    @Transactional
    public SlotConfiguradoResponse guardarAsignacionActivaSlot(Long slotConfiguracionId,
                                                               GuardarAsignacionActivaSlotRequest request) {
        EstanteriaSlotConfiguracion slot = slotConfiguracionRepository.findById(slotConfiguracionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SLOT_NOT_FOUND",
                        "No existe el slot indicado"
                ));

        if (!Boolean.TRUE.equals(slot.getActivo())) {
            throw ApiException.badRequest(
                    "SLOT_INACTIVO",
                    "No se puede asignar producto a un slot inactivo"
            );
        }

        ProductoProveedor productoProveedor = productoProveedorRepository.findById(request.productoProveedorId())
                .orElseThrow(() -> ApiException.notFound(
                        "PRODUCTO_PROVEEDOR_NOT_FOUND",
                        "No existe la relacion producto/proveedor indicada"
                ));

        if (!Boolean.TRUE.equals(productoProveedor.getActivo())
                || !Boolean.TRUE.equals(productoProveedor.getProducto().getActivo())
                || !Boolean.TRUE.equals(productoProveedor.getProveedor().getActivo())) {
            throw ApiException.badRequest(
                    "PRODUCTO_PROVEEDOR_INACTIVO",
                    "La relacion producto/proveedor no esta activa"
            );
        }

        validarFechasAsignacion(request);

        Instant ahora = Instant.now();
        AsignacionProductoSlot asignacion = asignacionProductoSlotRepository
                .findAsignacionActivaDeSlot(slot.getId(), EstadoAsignacionProductoSlot.ACTIVA)
                .orElseGet(() -> {
                    AsignacionProductoSlot nueva = new AsignacionProductoSlot();
                    nueva.setSlotConfiguracion(slot);
                    nueva.setEstadoAsignacion(EstadoAsignacionProductoSlot.ACTIVA);
                    nueva.setCreatedAt(ahora);
                    return nueva;
                });

        asignacion.setProductoProveedor(productoProveedor);
        asignacion.setFechaColocacion(request.fechaColocacion());
        asignacion.setFechaCaducidad(request.fechaCaducidad());
        asignacion.setFechaRetiradaProgramada(request.fechaRetiradaProgramada());
        asignacion.setFechaRetiradaConfirmada(null);
        asignacion.setEstadoAsignacion(EstadoAsignacionProductoSlot.ACTIVA);
        asignacion.setUpdatedAt(ahora);
        asignacion = asignacionProductoSlotRepository.save(asignacion);
        alertaOperativaService.evaluarAsignacionActiva(asignacion.getId());

        return obtenerSlotConfigurado(slot.getId());
    }

    @Transactional
    public SlotConfiguradoResponse retirarAsignacionActivaSlot(Long slotConfiguracionId) {
        EstanteriaSlotConfiguracion slot = slotConfiguracionRepository.findById(slotConfiguracionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SLOT_NOT_FOUND",
                        "No existe el slot indicado"
                ));

        Optional<AsignacionProductoSlot> asignacionActiva = asignacionProductoSlotRepository
                .findAsignacionActivaDeSlot(slot.getId(), EstadoAsignacionProductoSlot.ACTIVA);

        if (asignacionActiva.isPresent()) {
            AsignacionProductoSlot asignacion = asignacionActiva.get();
            asignacion.setEstadoAsignacion(EstadoAsignacionProductoSlot.RETIRADA);
            asignacion.setFechaRetiradaConfirmada(LocalDate.now());
            asignacion.setUpdatedAt(Instant.now());
            asignacionProductoSlotRepository.save(asignacion);
        }

        return obtenerSlotConfigurado(slot.getId());
    }

    @Transactional(readOnly = true)
    public SlotConfiguradoResponse obtenerSlotConfigurado(Long slotConfiguracionId) {
        EstanteriaSlotConfiguracion slot = slotConfiguracionRepository.findById(slotConfiguracionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SLOT_NOT_FOUND",
                        "No existe el slot indicado"
                ));
        AsignacionProductoSlot asignacionActiva = asignacionProductoSlotRepository
                .findAsignacionActivaDeSlot(slot.getId(), EstadoAsignacionProductoSlot.ACTIVA)
                .orElse(null);
        return toSlotConfiguradoResponse(slot, asignacionActiva);
    }

    private void validarFechasAsignacion(GuardarAsignacionActivaSlotRequest request) {
        LocalDate fechaColocacion = request.fechaColocacion();
        LocalDate fechaCaducidad = request.fechaCaducidad();
        LocalDate fechaRetiradaProgramada = request.fechaRetiradaProgramada();

        if (fechaColocacion != null && fechaCaducidad != null && fechaCaducidad.isBefore(fechaColocacion)) {
            throw ApiException.badRequest(
                    "ASIGNACION_FECHAS_INVALIDAS",
                    "La fecha de caducidad no puede ser anterior a la fecha de colocacion"
            );
        }

        if (fechaCaducidad != null
                && fechaRetiradaProgramada != null
                && fechaRetiradaProgramada.isAfter(fechaCaducidad)) {
            throw ApiException.badRequest(
                    "ASIGNACION_FECHAS_INVALIDAS",
                    "La fecha de retirada programada no puede ser posterior a la fecha de caducidad"
            );
        }
    }

    @Transactional(readOnly = true)
    public EstanteriaConfiguracionResponse obtenerConfiguracionDeEstanteria(String codigo) {
        Estanteria estanteria = estanteriaRepository.findWithSeccionByCodigoIgnoreCase(normalizar(codigo))
                .orElseThrow(() -> ApiException.notFound(
                        "ESTANTERIA_NOT_FOUND",
                        "No existe una estanteria con el codigo indicado"
                ));

        List<EstanteriaSlotConfiguracion> slots = slotConfiguracionRepository
                .findActivosByEstanteriaIdOrdenados(estanteria.getId());

        List<Long> slotIds = slots.stream()
                .map(EstanteriaSlotConfiguracion::getId)
                .toList();

        Map<Long, AsignacionProductoSlot> asignacionesActivas = slotIds.isEmpty()
                ? Map.of()
                : asignacionProductoSlotRepository
                        .findAsignacionesActivasDeSlots(slotIds, EstadoAsignacionProductoSlot.ACTIVA).stream()
                        .collect(Collectors.toMap(
                                asignacion -> asignacion.getSlotConfiguracion().getId(),
                                Function.identity(),
                                (actual, duplicada) -> actual
                        ));

        List<TrabajadorResumenResponse> encargados = seccionEncargadoRepository
                .findEncargadosActivosBySeccionId(estanteria.getSeccion().getId()).stream()
                .map(this::toTrabajadorResumenResponse)
                .toList();

        List<SlotConfiguradoResponse> slotResponses = slots.stream()
                .map(slot -> toSlotConfiguradoResponse(slot, asignacionesActivas.get(slot.getId())))
                .toList();

        return new EstanteriaConfiguracionResponse(
                estanteria.getId(),
                estanteria.getCodigo(),
                estanteria.getNombre(),
                estanteria.getDescripcion(),
                estanteria.getActiva(),
                toSeccionResponse(estanteria.getSeccion()),
                encargados,
                slotResponses
        );
    }

    private void validarSlotsAlta(List<CrearEstanteriaSlotRequest> slotsRequest) {
        if (slotsRequest.isEmpty()) {
            throw ApiException.badRequest(
                    "ESTANTERIA_SLOTS_OBLIGATORIOS",
                    "La estanteria debe tener al menos un slot configurado"
            );
        }

        Set<String> slotIds = new HashSet<>();
        Set<Integer> ordenes = new HashSet<>();

        for (CrearEstanteriaSlotRequest slotRequest : slotsRequest) {
            String slotId = normalizar(slotRequest.slotId());
            if (slotId == null || slotId.isBlank()) {
                throw ApiException.badRequest(
                        "SLOT_ID_OBLIGATORIO",
                        "El identificador de slot es obligatorio"
                );
            }
            if (!slotIds.add(slotId.toLowerCase())) {
                throw ApiException.badRequest(
                        "SLOT_ID_DUPLICADO",
                        "No puede haber dos slots con el mismo identificador"
                );
            }
            if (slotRequest.orden() == null || slotRequest.orden() <= 0) {
                throw ApiException.badRequest(
                        "SLOT_ORDEN_INVALIDO",
                        "El orden del slot debe ser mayor que cero"
                );
            }
            if (!ordenes.add(slotRequest.orden())) {
                throw ApiException.badRequest(
                        "SLOT_ORDEN_DUPLICADO",
                        "No puede haber dos slots con el mismo orden"
                );
            }
            if (slotRequest.cantidadObjetivo() == null || slotRequest.cantidadObjetivo() < 0) {
                throw ApiException.badRequest(
                        "SLOT_CANTIDAD_INVALIDA",
                        "La cantidad objetivo no puede ser negativa"
                );
            }
        }
    }

    private void validarSlotsActualizacion(List<ActualizarEstanteriaSlotRequest> slotsRequest) {
        if (slotsRequest.isEmpty()) {
            throw ApiException.badRequest(
                    "ESTANTERIA_SLOTS_OBLIGATORIOS",
                    "La estanteria debe tener al menos un slot configurado"
            );
        }

        Set<String> slotIds = new HashSet<>();
        Set<Integer> ordenes = new HashSet<>();

        for (ActualizarEstanteriaSlotRequest slotRequest : slotsRequest) {
            String slotId = normalizar(slotRequest.slotId());
            if (slotId == null || slotId.isBlank()) {
                throw ApiException.badRequest(
                        "SLOT_ID_OBLIGATORIO",
                        "El identificador de slot es obligatorio"
                );
            }
            if (!slotIds.add(slotId.toLowerCase())) {
                throw ApiException.badRequest(
                        "SLOT_ID_DUPLICADO",
                        "No puede haber dos slots con el mismo identificador"
                );
            }
            if (slotRequest.orden() == null || slotRequest.orden() <= 0) {
                throw ApiException.badRequest(
                        "SLOT_ORDEN_INVALIDO",
                        "El orden del slot debe ser mayor que cero"
                );
            }
            if (!ordenes.add(slotRequest.orden())) {
                throw ApiException.badRequest(
                        "SLOT_ORDEN_DUPLICADO",
                        "No puede haber dos slots con el mismo orden"
                );
            }
            if (slotRequest.cantidadObjetivo() == null || slotRequest.cantidadObjetivo() < 0) {
                throw ApiException.badRequest(
                        "SLOT_CANTIDAD_INVALIDA",
                        "La cantidad objetivo no puede ser negativa"
                );
            }
        }
    }

    private EmpresaResponse toEmpresaResponse(Empresa empresa) {
        return new EmpresaResponse(
                empresa.getId(),
                empresa.getCodigo(),
                empresa.getNombre(),
                empresa.getDescripcion(),
                empresa.getActiva()
        );
    }

    private SeccionResponse toSeccionResponse(Seccion seccion) {
        return new SeccionResponse(
                seccion.getId(),
                seccion.getCodigo(),
                seccion.getNombre(),
                seccion.getDescripcion(),
                seccion.getActiva()
        );
    }

    private EstanteriaResumenResponse toEstanteriaResumenResponse(Estanteria estanteria) {
        return new EstanteriaResumenResponse(
                estanteria.getId(),
                estanteria.getCodigo(),
                estanteria.getNombre(),
                estanteria.getDescripcion(),
                estanteria.getActiva()
        );
    }

    private SlotConfiguradoResponse toSlotConfiguradoResponse(EstanteriaSlotConfiguracion slot,
                                                              AsignacionProductoSlot asignacionActiva) {
        return new SlotConfiguradoResponse(
                slot.getId(),
                slot.getSlotId(),
                slot.getOrden(),
                toProductoResumenResponse(slot.getProducto()),
                slot.getCantidadObjetivo(),
                asignacionActiva == null ? null : toAsignacionActivaSlotResponse(asignacionActiva)
        );
    }

    private AsignacionActivaSlotResponse toAsignacionActivaSlotResponse(AsignacionProductoSlot asignacion) {
        ProductoProveedor productoProveedor = asignacion.getProductoProveedor();

        return new AsignacionActivaSlotResponse(
                asignacion.getId(),
                productoProveedor.getId(),
                toProductoResumenResponse(productoProveedor.getProducto()),
                toProveedorResumenResponse(productoProveedor.getProveedor()),
                productoProveedor.getClaveProductoProveedor(),
                productoProveedor.getStockDisponible(),
                stockMensaje(productoProveedor.getStockDisponible()),
                asignacion.getFechaColocacion(),
                asignacion.getFechaCaducidad(),
                asignacion.getFechaRetiradaProgramada(),
                asignacion.getFechaRetiradaConfirmada(),
                asignacion.getEstadoAsignacion(),
                asignacion.getObservaciones()
        );
    }

    private ProductoProveedorResumenResponse toProductoProveedorResumenResponse(ProductoProveedor productoProveedor) {
        return new ProductoProveedorResumenResponse(
                productoProveedor.getId(),
                toProductoResumenResponse(productoProveedor.getProducto()),
                toProveedorResumenResponse(productoProveedor.getProveedor()),
                productoProveedor.getClaveProductoProveedor(),
                productoProveedor.getStockDisponible(),
                stockMensaje(productoProveedor.getStockDisponible())
        );
    }

    private String stockMensaje(Boolean stockDisponible) {
        if (stockDisponible == null) {
            return "Sin dato de stock";
        }
        return stockDisponible
                ? "Stock disponible: Sí"
                : "Stock disponible: No · requiere pedido o reposición externa";
    }

    private ProductoResumenResponse toProductoResumenResponse(Producto producto) {
        return new ProductoResumenResponse(
                producto.getId(),
                producto.getProductoUuid(),
                producto.getCodigoInterno(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getActivo()
        );
    }

    private ProductoCreadoResponse toProductoCreadoResponse(Producto producto, ProductoProveedor productoProveedor) {
        return new ProductoCreadoResponse(
                producto.getId(),
                producto.getProductoUuid(),
                producto.getCodigoInterno(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getActivo(),
                productoProveedor != null ? toProveedorResumenResponse(productoProveedor.getProveedor()) : null,
                productoProveedor != null ? productoProveedor.getStockDisponible() : null,
                productoProveedor != null ? stockMensaje(productoProveedor.getStockDisponible()) : "Producto sin proveedor demo vinculado"
        );
    }

    private ProveedorResumenResponse toProveedorResumenResponse(Proveedor proveedor) {
        return new ProveedorResumenResponse(
                proveedor.getId(),
                proveedor.getCodigo(),
                proveedor.getNombre(),
                proveedor.getDescripcion()
        );
    }

    private TrabajadorResumenResponse toTrabajadorResumenResponse(SeccionEncargado seccionEncargado) {
        Trabajador trabajador = seccionEncargado.getTrabajador();

        return new TrabajadorResumenResponse(
                trabajador.getId(),
                trabajador.getNombre(),
                trabajador.getApellidos(),
                trabajador.getEmailContacto(),
                trabajador.getTipoTrabajador(),
                seccionEncargado.getResponsablePrincipal()
        );
    }

    private PlanoResponsableResponse toPlanoResponsableResponse(SeccionEncargado seccionEncargado) {
        Trabajador trabajador = seccionEncargado.getTrabajador();

        return new PlanoResponsableResponse(
                trabajador.getId(),
                trabajador.getNombre(),
                trabajador.getApellidos(),
                trabajador.getTipoTrabajador(),
                seccionEncargado.getResponsablePrincipal()
        );
    }

    private TrabajadorAsignadoEstanteriaResponse toTrabajadorAsignadoEstanteriaResponse(Trabajador trabajador) {
        return new TrabajadorAsignadoEstanteriaResponse(
                trabajador.getId(),
                trabajador.getNombre(),
                trabajador.getApellidos(),
                trabajador.getEmailContacto(),
                trabajador.getTipoTrabajador(),
                estadoDisponibilidad(trabajador),
                trabajador.getActivo()
        );
    }

    private EstadoDisponibilidadTrabajador estadoDisponibilidad(Trabajador trabajador) {
        return trabajador.getEstadoDisponibilidad() == null
                ? EstadoDisponibilidadTrabajador.DISPONIBLE
                : trabajador.getEstadoDisponibilidad();
    }

    private String normalizar(String valor) {
        return valor == null ? null : valor.trim();
    }

    private String normalizarNullable(String valor) {
        String normalizado = normalizar(valor);
        return normalizado == null || normalizado.isBlank() ? null : normalizado;
    }

}
