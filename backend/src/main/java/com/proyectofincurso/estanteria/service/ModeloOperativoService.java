package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.AsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import com.proyectofincurso.estanteria.persistence.entity.Producto;
import com.proyectofincurso.estanteria.persistence.entity.ProductoProveedor;
import com.proyectofincurso.estanteria.persistence.entity.Proveedor;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.entity.SeccionEncargado;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.repository.AsignacionProductoSlotRepository;
import com.proyectofincurso.estanteria.persistence.repository.EmpresaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionEncargadoRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionRepository;
import com.proyectofincurso.estanteria.web.dto.AsignacionActivaSlotResponse;
import com.proyectofincurso.estanteria.web.dto.EmpresaResponse;
import com.proyectofincurso.estanteria.web.dto.EstanteriaConfiguracionResponse;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProveedorResumenResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
import com.proyectofincurso.estanteria.web.dto.SlotConfiguradoResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorResumenResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
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
        if (empresaRepository.findByCodigoAndActivaTrue(codigoEmpresa).isEmpty()) {
            throw ApiException.notFound(
                    "EMPRESA_NOT_FOUND",
                    "No existe una empresa activa con el codigo indicado"
            );
        }

        return seccionRepository.findByEmpresaCodigoAndActivaTrueOrderByNombreAsc(codigoEmpresa).stream()
                .map(this::toSeccionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EstanteriaResumenResponse> obtenerEstanteriasDeSeccion(Long seccionId) {
        if (!seccionRepository.existsById(seccionId)) {
            throw ApiException.notFound(
                    "SECCION_NOT_FOUND",
                    "No existe la seccion solicitada"
            );
        }

        return estanteriaRepository.findBySeccionIdAndActivaTrueOrderByCodigoAsc(seccionId).stream()
                .map(this::toEstanteriaResumenResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EstanteriaConfiguracionResponse obtenerConfiguracionDeEstanteria(String codigo) {
        Estanteria estanteria = estanteriaRepository.findWithSeccionByCodigoAndActivaTrue(codigo)
                .orElseThrow(() -> ApiException.notFound(
                        "ESTANTERIA_NOT_FOUND",
                        "No existe una estanteria activa con el codigo indicado"
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
                toProveedorResumenResponse(productoProveedor.getProveedor()),
                productoProveedor.getClaveProductoProveedor(),
                productoProveedor.getStockDisponible(),
                asignacion.getFechaColocacion(),
                asignacion.getFechaCaducidad(),
                asignacion.getFechaRetiradaProgramada(),
                asignacion.getFechaRetiradaConfirmada(),
                asignacion.getEstadoAsignacion(),
                asignacion.getObservaciones()
        );
    }

    private ProductoResumenResponse toProductoResumenResponse(Producto producto) {
        return new ProductoResumenResponse(
                producto.getId(),
                producto.getProductoUuid(),
                producto.getCodigoInterno(),
                producto.getNombre(),
                producto.getDescripcion()
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
}
