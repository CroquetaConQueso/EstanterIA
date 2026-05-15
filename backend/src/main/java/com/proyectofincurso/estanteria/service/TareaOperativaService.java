package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Alerta;
import com.proyectofincurso.estanteria.persistence.entity.AsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.Producto;
import com.proyectofincurso.estanteria.persistence.entity.ProductoProveedor;
import com.proyectofincurso.estanteria.persistence.entity.Proveedor;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.entity.TareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.TipoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.repository.TareaOperativaRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.dto.ActualizarTareaOperativaRequest;
import com.proyectofincurso.estanteria.web.dto.AlertaAsignacionResponse;
import com.proyectofincurso.estanteria.web.dto.AlertaSlotResponse;
import com.proyectofincurso.estanteria.web.dto.CrearTareaManualRequest;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProveedorResumenResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
import com.proyectofincurso.estanteria.web.dto.TareaOperativaResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorResumenResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TareaOperativaService {

    private final TareaOperativaRepository tareaOperativaRepository;
    private final SeccionRepository seccionRepository;
    private final EstanteriaRepository estanteriaRepository;
    private final EstanteriaSlotConfiguracionRepository slotConfiguracionRepository;
    private final TrabajadorRepository trabajadorRepository;
    private final UserAccountRepository userAccountRepository;

    @Transactional
    public void crearAutomaticaSiNoExiste(Alerta alerta) {
        TipoTareaOperativa tipoTarea = mapearTipoTarea(alerta.getTipoAlerta());
        if (tipoTarea == null || tareaOperativaRepository.existsByAlertaId(alerta.getId())) {
            return;
        }

        TareaOperativa tarea = new TareaOperativa();
        tarea.setAlerta(alerta);
        tarea.setTipoTarea(tipoTarea);
        tarea.setPrioridad(alerta.getPrioridad());
        tarea.setEstadoTarea(EstadoTareaOperativa.PENDIENTE);
        tarea.setTitulo(generarTitulo(alerta, tipoTarea));
        tarea.setDescripcion(generarDescripcion(alerta, tipoTarea));
        tarea.setSeccion(alerta.getSeccion());
        tarea.setEstanteria(alerta.getEstanteria());
        tarea.setSlotConfiguracion(alerta.getSlotConfiguracion());
        tarea.setAsignacionProductoSlot(alerta.getAsignacionProductoSlot());

        tareaOperativaRepository.save(tarea);
    }

    @Transactional(readOnly = true)
    public List<TareaOperativaResponse> obtenerTareas() {
        return tareaOperativaRepository.findAllConContexto().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TareaOperativaResponse> obtenerTareasPendientes() {
        return tareaOperativaRepository.findConContextoByEstadoIn(List.of(
                        EstadoTareaOperativa.PENDIENTE,
                        EstadoTareaOperativa.EN_PROGRESO
                )).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TareaOperativaResponse obtenerDetalle(Long id) {
        return tareaOperativaRepository.findByIdConContexto(id)
                .map(this::toResponse)
                .orElseThrow(() -> ApiException.notFound(
                        "TAREA_OPERATIVA_NOT_FOUND",
                        "No existe la tarea operativa indicada"
                ));
    }

    @Transactional
    public TareaOperativaResponse crearTareaManual(CrearTareaManualRequest request) {
        TareaOperativa tarea = new TareaOperativa();
        aplicarCamposEditables(
                tarea,
                request.tipoTarea(),
                request.prioridad(),
                request.titulo(),
                request.descripcion(),
                request.seccionId(),
                request.estanteriaId(),
                request.slotConfiguracionId(),
                request.trabajadorAsignadoId(),
                request.fechaLimite()
        );
        tarea.setEstadoTarea(EstadoTareaOperativa.PENDIENTE);
        tarea.setAlerta(null);
        tarea.setResueltaAt(null);
        resolverUsuarioAutenticado().ifPresent(tarea::setAsignadaPor);

        TareaOperativa saved = tareaOperativaRepository.save(tarea);
        return tareaOperativaRepository.findByIdConContexto(saved.getId())
                .map(this::toResponse)
                .orElseGet(() -> toResponse(saved));
    }

    @Transactional
    public TareaOperativaResponse actualizarTarea(Long id, ActualizarTareaOperativaRequest request) {
        TareaOperativa tarea = tareaOperativaRepository.findByIdConContexto(id)
                .orElseThrow(() -> ApiException.notFound(
                        "TAREA_OPERATIVA_NOT_FOUND",
                        "No existe la tarea operativa indicada"
                ));

        if (tarea.getEstadoTarea() == EstadoTareaOperativa.RESUELTA
                || tarea.getEstadoTarea() == EstadoTareaOperativa.CANCELADA) {
            throw ApiException.conflict(
                    "TAREA_FINALIZADA_NO_EDITABLE",
                    "No se puede editar una tarea resuelta o cancelada"
            );
        }

        aplicarCamposEditables(
                tarea,
                request.tipoTarea(),
                request.prioridad(),
                request.titulo(),
                request.descripcion(),
                request.seccionId(),
                request.estanteriaId(),
                request.slotConfiguracionId(),
                request.trabajadorAsignadoId(),
                request.fechaLimite()
        );

        return toResponse(tarea);
    }

    @Transactional
    public TareaOperativaResponse asignarTrabajador(Long id, Long trabajadorId) {
        TareaOperativa tarea = tareaOperativaRepository.findByIdConContexto(id)
                .orElseThrow(() -> ApiException.notFound(
                        "TAREA_OPERATIVA_NOT_FOUND",
                        "No existe la tarea operativa indicada"
                ));
        Trabajador trabajador = trabajadorRepository.findById(trabajadorId)
                .orElseThrow(() -> ApiException.notFound(
                        "TRABAJADOR_NOT_FOUND",
                        "No existe el trabajador indicado"
                ));

        if (!Boolean.TRUE.equals(trabajador.getActivo())) {
            throw ApiException.badRequest(
                    "TRABAJADOR_INACTIVO",
                    "No se puede asignar una tarea a un trabajador inactivo"
            );
        }

        tarea.setTrabajadorAsignado(trabajador);
        tarea.setAssignedAt(Instant.now());
        resolverUsuarioAutenticado().ifPresent(tarea::setAsignadaPor);

        return toResponse(tarea);
    }

    @Transactional
    public TareaOperativaResponse cambiarEstado(Long id, EstadoTareaOperativa nuevoEstado) {
        TareaOperativa tarea = tareaOperativaRepository.findByIdConContexto(id)
                .orElseThrow(() -> ApiException.notFound(
                        "TAREA_OPERATIVA_NOT_FOUND",
                        "No existe la tarea operativa indicada"
                ));

        validarTransicion(tarea.getEstadoTarea(), nuevoEstado);
        tarea.setEstadoTarea(nuevoEstado);

        if (nuevoEstado == EstadoTareaOperativa.RESUELTA) {
            tarea.setResueltaAt(Instant.now());
        }

        return toResponse(tarea);
    }

    private void aplicarCamposEditables(
            TareaOperativa tarea,
            TipoTareaOperativa tipoTarea,
            PrioridadAlerta prioridad,
            String titulo,
            String descripcion,
            Long seccionId,
            Long estanteriaId,
            Long slotConfiguracionId,
            Long trabajadorAsignadoId,
            Instant fechaLimite
    ) {
        Seccion seccion = resolverSeccion(seccionId);
        Estanteria estanteria = resolverEstanteria(estanteriaId);
        EstanteriaSlotConfiguracion slot = resolverSlot(slotConfiguracionId, estanteria);
        Trabajador trabajador = resolverTrabajador(trabajadorAsignadoId);

        if (estanteria != null) {
            Seccion seccionDeEstanteria = estanteria.getSeccion();
            if (seccion != null && !seccion.getId().equals(seccionDeEstanteria.getId())) {
                throw ApiException.badRequest(
                        "TAREA_ESTANTERIA_SECCION_INCOHERENTE",
                        "La estanteria indicada no pertenece a la seccion seleccionada"
                );
            }
            seccion = seccionDeEstanteria;
        }

        if (slot != null) {
            estanteria = slot.getEstanteria();
            seccion = estanteria.getSeccion();
        }

        tarea.setTipoTarea(tipoTarea);
        tarea.setPrioridad(prioridad);
        tarea.setTitulo(titulo.trim());
        tarea.setDescripcion(descripcion == null || descripcion.isBlank() ? "" : descripcion.trim());
        tarea.setSeccion(seccion);
        tarea.setEstanteria(estanteria);
        tarea.setSlotConfiguracion(slot);
        if (tarea.getAlerta() == null) {
            tarea.setAsignacionProductoSlot(null);
        }
        tarea.setFechaLimite(fechaLimite);

        Trabajador anterior = tarea.getTrabajadorAsignado();
        tarea.setTrabajadorAsignado(trabajador);
        if (trabajador == null) {
            tarea.setAssignedAt(null);
        } else if (anterior == null) {
            tarea.setAssignedAt(Instant.now());
            resolverUsuarioAutenticado().ifPresent(tarea::setAsignadaPor);
        }
    }

    private Seccion resolverSeccion(Long seccionId) {
        if (seccionId == null) {
            return null;
        }
        return seccionRepository.findByIdAndActivaTrue(seccionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SECCION_NOT_FOUND",
                        "No existe una seccion activa con el identificador indicado"
                ));
    }

    private Estanteria resolverEstanteria(Long estanteriaId) {
        if (estanteriaId == null) {
            return null;
        }
        Estanteria estanteria = estanteriaRepository.findById(estanteriaId)
                .orElseThrow(() -> ApiException.notFound(
                        "ESTANTERIA_NOT_FOUND",
                        "No existe la estanteria indicada"
                ));
        if (!Boolean.TRUE.equals(estanteria.getActiva())) {
            throw ApiException.badRequest(
                    "ESTANTERIA_INACTIVA",
                    "La estanteria indicada no esta activa"
            );
        }
        return estanteria;
    }

    private EstanteriaSlotConfiguracion resolverSlot(Long slotConfiguracionId, Estanteria estanteria) {
        if (slotConfiguracionId == null) {
            return null;
        }
        if (estanteria == null) {
            throw ApiException.badRequest(
                    "TAREA_SLOT_SIN_ESTANTERIA",
                    "Selecciona una estanteria antes de vincular un slot"
            );
        }
        EstanteriaSlotConfiguracion slot = slotConfiguracionRepository.findById(slotConfiguracionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SLOT_CONFIGURACION_NOT_FOUND",
                        "No existe el slot indicado"
                ));
        if (!Boolean.TRUE.equals(slot.getActivo())) {
            throw ApiException.badRequest(
                    "SLOT_CONFIGURACION_INACTIVO",
                    "El slot indicado no esta activo"
            );
        }
        if (!slot.getEstanteria().getId().equals(estanteria.getId())) {
            throw ApiException.badRequest(
                    "TAREA_SLOT_ESTANTERIA_INCOHERENTE",
                    "El slot indicado no pertenece a la estanteria seleccionada"
            );
        }
        return slot;
    }

    private Trabajador resolverTrabajador(Long trabajadorId) {
        if (trabajadorId == null) {
            return null;
        }
        return trabajadorRepository.findByIdAndActivoTrue(trabajadorId)
                .orElseThrow(() -> ApiException.notFound(
                        "TRABAJADOR_NOT_FOUND",
                        "No existe un trabajador activo con el identificador indicado"
                ));
    }

    private java.util.Optional<UserAccount> resolverUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            return java.util.Optional.empty();
        }
        return userAccountRepository.findByUsernameIgnoreCase(authentication.getName());
    }

    private void validarTransicion(EstadoTareaOperativa actual, EstadoTareaOperativa nuevo) {
        if (actual == nuevo) {
            return;
        }

        boolean permitida = switch (actual) {
            case PENDIENTE -> nuevo == EstadoTareaOperativa.EN_PROGRESO
                    || nuevo == EstadoTareaOperativa.CANCELADA;
            case EN_PROGRESO -> nuevo == EstadoTareaOperativa.RESUELTA
                    || nuevo == EstadoTareaOperativa.CANCELADA;
            case RESUELTA, CANCELADA -> false;
        };

        if (!permitida) {
            throw ApiException.conflict(
                    "TRANSICION_TAREA_NO_PERMITIDA",
                    "El cambio de estado solicitado no esta permitido"
            );
        }
    }

    private TipoTareaOperativa mapearTipoTarea(TipoAlerta tipoAlerta) {
        return switch (tipoAlerta) {
            case HUECO_VACIO -> TipoTareaOperativa.REPOSICION;
            case ANOMALIA_VISUAL -> TipoTareaOperativa.REVISION_VISUAL;
            case REVISION_MANUAL -> TipoTareaOperativa.VERIFICACION_MANUAL;
            case PRODUCTO_PROXIMO_A_CADUCAR -> TipoTareaOperativa.REVISION_CADUCIDAD;
            case PRESENCIA_TRAS_RETIRADA_PROGRAMADA -> TipoTareaOperativa.RETIRADA_PRODUCTO;
            case RETIRADA_PROGRAMADA_PENDIENTE -> null;
        };
    }

    private String generarTitulo(Alerta alerta, TipoTareaOperativa tipoTarea) {
        String estanteria = codigoEstanteria(alerta);
        return switch (tipoTarea) {
            case REPOSICION -> "Reponer producto en estanteria " + estanteria;
            case REVISION_VISUAL -> "Revisar anomalia visual en estanteria " + estanteria;
            case VERIFICACION_MANUAL -> "Verificar inspeccion de baja confianza";
            case REVISION_CADUCIDAD -> "Revisar producto proximo a caducar";
            case RETIRADA_PRODUCTO -> "Comprobar retirada pendiente de producto";
        };
    }

    private String generarDescripcion(Alerta alerta, TipoTareaOperativa tipoTarea) {
        String slot = alerta.getSlotConfiguracion() != null
                ? alerta.getSlotConfiguracion().getSlotId()
                : "sin slot asociado";
        String estanteria = codigoEstanteria(alerta);
        return switch (tipoTarea) {
            case REPOSICION -> "Se ha detectado un hueco vacio en " + estanteria + ", " + slot
                    + ". Revisar y reponer el producto esperado si procede.";
            case REVISION_VISUAL -> "La inspeccion visual ha detectado una anomalia en " + estanteria + ", "
                    + slot + ". Revisar colocacion o producto presente.";
            case VERIFICACION_MANUAL -> "La clasificacion visual no ha alcanzado el umbral de confianza establecido. "
                    + "Se recomienda revision manual.";
            case REVISION_CADUCIDAD -> "Existe una asignacion activa cuya fecha de caducidad se aproxima al umbral definido.";
            case RETIRADA_PRODUCTO -> "Se ha detectado presencia en un slot cuya asignacion tenia retirada programada pendiente.";
        };
    }

    private String codigoEstanteria(Alerta alerta) {
        return alerta.getEstanteria() != null ? alerta.getEstanteria().getCodigo() : "sin estanteria";
    }

    private TareaOperativaResponse toResponse(TareaOperativa tarea) {
        UserAccount asignadaPor = tarea.getAsignadaPor();
        return new TareaOperativaResponse(
                tarea.getId(),
                tarea.getAlerta() != null ? tarea.getAlerta().getId() : null,
                tarea.getTipoTarea(),
                tarea.getPrioridad(),
                tarea.getEstadoTarea(),
                tarea.getTitulo(),
                tarea.getDescripcion(),
                toSeccionResponse(tarea.getSeccion()),
                toEstanteriaResumenResponse(tarea.getEstanteria()),
                toAlertaSlotResponse(tarea.getSlotConfiguracion()),
                toAlertaAsignacionResponse(tarea.getAsignacionProductoSlot()),
                toTrabajadorResumenResponse(tarea.getTrabajadorAsignado()),
                asignadaPor != null ? asignadaPor.getId() : null,
                asignadaPor != null ? asignadaPor.getUsername() : null,
                tarea.getCreatedAt(),
                tarea.getAssignedAt(),
                tarea.getFechaLimite(),
                tarea.getResueltaAt(),
                tarea.getUpdatedAt()
        );
    }

    private SeccionResponse toSeccionResponse(Seccion seccion) {
        if (seccion == null) {
            return null;
        }
        return new SeccionResponse(
                seccion.getId(),
                seccion.getCodigo(),
                seccion.getNombre(),
                seccion.getDescripcion(),
                seccion.getActiva()
        );
    }

    private EstanteriaResumenResponse toEstanteriaResumenResponse(Estanteria estanteria) {
        if (estanteria == null) {
            return null;
        }
        return new EstanteriaResumenResponse(
                estanteria.getId(),
                estanteria.getCodigo(),
                estanteria.getNombre(),
                estanteria.getDescripcion(),
                estanteria.getActiva()
        );
    }

    private AlertaSlotResponse toAlertaSlotResponse(EstanteriaSlotConfiguracion slot) {
        if (slot == null) {
            return null;
        }
        return new AlertaSlotResponse(
                slot.getId(),
                slot.getSlotId(),
                slot.getOrden(),
                toProductoResumenResponse(slot.getProducto())
        );
    }

    private AlertaAsignacionResponse toAlertaAsignacionResponse(AsignacionProductoSlot asignacion) {
        if (asignacion == null) {
            return null;
        }

        ProductoProveedor productoProveedor = asignacion.getProductoProveedor();
        return new AlertaAsignacionResponse(
                asignacion.getId(),
                productoProveedor != null ? toProductoResumenResponse(productoProveedor.getProducto()) : null,
                productoProveedor != null ? toProveedorResumenResponse(productoProveedor.getProveedor()) : null,
                productoProveedor != null ? productoProveedor.getClaveProductoProveedor() : null,
                asignacion.getFechaCaducidad(),
                asignacion.getFechaRetiradaProgramada(),
                asignacion.getEstadoAsignacion()
        );
    }

    private TrabajadorResumenResponse toTrabajadorResumenResponse(Trabajador trabajador) {
        if (trabajador == null) {
            return null;
        }
        return new TrabajadorResumenResponse(
                trabajador.getId(),
                trabajador.getNombre(),
                trabajador.getApellidos(),
                trabajador.getEmailContacto(),
                trabajador.getTipoTrabajador(),
                null
        );
    }

    private ProductoResumenResponse toProductoResumenResponse(Producto producto) {
        if (producto == null) {
            return null;
        }
        return new ProductoResumenResponse(
                producto.getId(),
                producto.getProductoUuid(),
                producto.getCodigoInterno(),
                producto.getNombre(),
                producto.getDescripcion()
        );
    }

    private ProveedorResumenResponse toProveedorResumenResponse(Proveedor proveedor) {
        if (proveedor == null) {
            return null;
        }
        return new ProveedorResumenResponse(
                proveedor.getId(),
                proveedor.getCodigo(),
                proveedor.getNombre(),
                proveedor.getDescripcion()
        );
    }
}
