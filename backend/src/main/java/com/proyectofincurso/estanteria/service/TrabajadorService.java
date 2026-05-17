package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.entity.TareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.entity.TrabajadorEstanteria;
import com.proyectofincurso.estanteria.persistence.repository.EmpresaRepository;
import com.proyectofincurso.estanteria.persistence.repository.TareaOperativaRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorEstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.web.dto.ActualizarTrabajadorRequest;
import com.proyectofincurso.estanteria.web.dto.CrearTrabajadorRequest;
import com.proyectofincurso.estanteria.web.dto.TrabajadorEstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorTareaResumenResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrabajadorService {

    private static final String CODIGO_EMPRESA_DEMO = "EMP-DEMO";
    private static final List<EstadoTareaOperativa> ESTADOS_TAREAS_ACTIVAS = List.of(
            EstadoTareaOperativa.PENDIENTE,
            EstadoTareaOperativa.EN_PROGRESO
    );

    private final TrabajadorRepository trabajadorRepository;
    private final EmpresaRepository empresaRepository;
    private final TrabajadorEstanteriaRepository trabajadorEstanteriaRepository;
    private final TareaOperativaRepository tareaOperativaRepository;
    private final AlertaOperativaService alertaOperativaService;

    @Transactional(readOnly = true)
    public List<TrabajadorResponse> listarTrabajadores(boolean incluirInactivos) {
        return trabajadorRepository.findAllByOrderByApellidosAscNombreAsc()
                .stream()
                .filter(trabajador -> incluirInactivos || Boolean.TRUE.equals(trabajador.getActivo()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrabajadorResponse obtenerTrabajador(Long id) {
        return trabajadorRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> ApiException.notFound(
                        "TRABAJADOR_NOT_FOUND",
                        "No existe el trabajador indicado"
                ));
    }

    @Transactional
    public TrabajadorResponse crearTrabajador(CrearTrabajadorRequest request) {
        Empresa empresa = resolverEmpresaOperativa();

        String email = normalizarNullable(request.emailContacto());
        validarEmailDisponible(email, null);
        String telefono = normalizarNullable(request.telefonoContacto());
        validarTelefonoDisponible(telefono, null);

        Trabajador trabajador = new Trabajador();
        trabajador.setEmpresa(empresa);
        trabajador.setNombre(request.nombre().trim());
        trabajador.setApellidos(request.apellidos().trim());
        trabajador.setEmailContacto(email);
        trabajador.setTelefonoContacto(telefono);
        trabajador.setTipoTrabajador(request.tipoTrabajador());
        trabajador.setEstadoDisponibilidad(request.estadoDisponibilidad() == null
                ? EstadoDisponibilidadTrabajador.DISPONIBLE
                : request.estadoDisponibilidad());
        trabajador.setActivo(true);
        Instant ahora = Instant.now();
        trabajador.setCreatedAt(ahora);
        trabajador.setUpdatedAt(ahora);

        return toResponse(trabajadorRepository.save(trabajador));
    }

    private Empresa resolverEmpresaOperativa() {
        return empresaRepository.findByCodigoAndActivaTrue(CODIGO_EMPRESA_DEMO)
                .or(() -> empresaRepository.findFirstByActivaTrueOrderByIdAsc())
                .orElseThrow(() -> ApiException.notFound(
                        "EMPRESA_NOT_FOUND",
                        "No existe una empresa activa para crear el trabajador"
                ));
    }

    @Transactional
    public TrabajadorResponse actualizarTrabajador(Long id, ActualizarTrabajadorRequest request) {
        Trabajador trabajador = trabajadorRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound(
                        "TRABAJADOR_NOT_FOUND",
                        "No existe el trabajador indicado"
                ));

        String email = normalizarNullable(request.emailContacto());
        validarEmailDisponible(email, id);
        String telefono = normalizarNullable(request.telefonoContacto());
        validarTelefonoDisponible(telefono, id);

        trabajador.setNombre(request.nombre().trim());
        trabajador.setApellidos(request.apellidos().trim());
        trabajador.setEmailContacto(email);
        trabajador.setTelefonoContacto(telefono);
        trabajador.setTipoTrabajador(request.tipoTrabajador());
        trabajador.setEstadoDisponibilidad(request.estadoDisponibilidad());
        trabajador.setUpdatedAt(Instant.now());
        revisarAlertaSiNoDisponible(trabajador);

        return toResponse(trabajador);
    }

    @Transactional
    public TrabajadorResponse desactivarTrabajador(Long id) {
        Trabajador trabajador = trabajadorRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound(
                        "TRABAJADOR_NOT_FOUND",
                        "No existe el trabajador indicado"
        ));
        trabajador.setActivo(false);
        trabajador.setUpdatedAt(Instant.now());
        alertaOperativaService.revisarTrabajadorNoDisponibleAsignado(trabajador.getId());
        return toResponse(trabajador);
    }

    @Transactional
    public TrabajadorResponse reactivarTrabajador(Long id) {
        Trabajador trabajador = trabajadorRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound(
                        "TRABAJADOR_NOT_FOUND",
                        "No existe el trabajador indicado"
                ));
        trabajador.setActivo(true);
        if (trabajador.getEstadoDisponibilidad() == null) {
            trabajador.setEstadoDisponibilidad(EstadoDisponibilidadTrabajador.DISPONIBLE);
        }
        trabajador.setUpdatedAt(Instant.now());
        revisarAlertaSiNoDisponible(trabajador);
        return toResponse(trabajador);
    }

    private void revisarAlertaSiNoDisponible(Trabajador trabajador) {
        EstadoDisponibilidadTrabajador disponibilidad = estadoDisponibilidad(trabajador);
        if (disponibilidad == EstadoDisponibilidadTrabajador.AUSENTE
                || disponibilidad == EstadoDisponibilidadTrabajador.ENFERMO) {
            alertaOperativaService.revisarTrabajadorNoDisponibleAsignado(trabajador.getId());
        }
    }

    private void validarEmailDisponible(String email, Long trabajadorIdActual) {
        if (email == null) {
            return;
        }
        boolean duplicado = trabajadorIdActual == null
                ? trabajadorRepository.existsByEmailContactoIgnoreCase(email)
                : trabajadorRepository.existsByEmailContactoIgnoreCaseAndIdNot(email, trabajadorIdActual);
        if (duplicado) {
            throw ApiException.conflict(
                    "TRABAJADOR_EMAIL_DUPLICADO",
                    "Ya existe un trabajador con ese email de contacto."
            );
        }
    }

    private void validarTelefonoDisponible(String telefono, Long trabajadorIdActual) {
        if (telefono == null) {
            return;
        }
        boolean duplicado = trabajadorIdActual == null
                ? trabajadorRepository.existsByTelefonoContacto(telefono)
                : trabajadorRepository.existsByTelefonoContactoAndIdNot(telefono, trabajadorIdActual);
        if (duplicado) {
            throw ApiException.conflict(
                    "TRABAJADOR_TELEFONO_DUPLICADO",
                    "Ya existe un trabajador con ese teléfono de contacto."
            );
        }
    }

    private TrabajadorResponse toResponse(Trabajador trabajador) {
        List<TrabajadorEstanteriaResumenResponse> estanterias = trabajadorEstanteriaRepository
                .findByTrabajadorIdAndActivaTrueOrderByEstanteriaCodigoAsc(trabajador.getId())
                .stream()
                .map(this::toEstanteriaResumen)
                .toList();

        List<TrabajadorTareaResumenResponse> tareas = tareaOperativaRepository
                .findAsignadasByTrabajadorAndEstadoIn(trabajador.getId(), ESTADOS_TAREAS_ACTIVAS)
                .stream()
                .map(this::toTareaResumen)
                .toList();

        long pendientes = tareas.stream()
                .filter(tarea -> tarea.estadoTarea() == EstadoTareaOperativa.PENDIENTE)
                .count();
        long enProgreso = tareas.stream()
                .filter(tarea -> tarea.estadoTarea() == EstadoTareaOperativa.EN_PROGRESO)
                .count();

        Empresa empresa = trabajador.getEmpresa();
        return new TrabajadorResponse(
                trabajador.getId(),
                trabajador.getNombre(),
                trabajador.getApellidos(),
                trabajador.getEmailContacto(),
                trabajador.getTelefonoContacto(),
                trabajador.getTipoTrabajador(),
                estadoDisponibilidad(trabajador),
                trabajador.getActivo(),
                empresa != null ? empresa.getCodigo() : null,
                empresa != null ? empresa.getNombre() : null,
                estanterias,
                pendientes,
                enProgreso,
                tareas
        );
    }

    private TrabajadorEstanteriaResumenResponse toEstanteriaResumen(TrabajadorEstanteria asignacion) {
        Estanteria estanteria = asignacion.getEstanteria();
        Seccion seccion = estanteria != null ? estanteria.getSeccion() : null;
        return new TrabajadorEstanteriaResumenResponse(
                estanteria != null ? estanteria.getId() : null,
                estanteria != null ? estanteria.getCodigo() : null,
                estanteria != null ? estanteria.getNombre() : null,
                estanteria != null ? estanteria.getActiva() : null,
                seccion != null ? seccion.getId() : null,
                seccion != null ? seccion.getCodigo() : null,
                seccion != null ? seccion.getNombre() : null
        );
    }

    private TrabajadorTareaResumenResponse toTareaResumen(TareaOperativa tarea) {
        Estanteria estanteria = tarea.getEstanteria();
        return new TrabajadorTareaResumenResponse(
                tarea.getId(),
                tarea.getTitulo(),
                tarea.getTipoTarea(),
                tarea.getPrioridad(),
                tarea.getEstadoTarea(),
                tarea.getFechaLimite(),
                estanteria != null ? estanteria.getCodigo() : null,
                estanteria != null ? estanteria.getNombre() : null
        );
    }

    private EstadoDisponibilidadTrabajador estadoDisponibilidad(Trabajador trabajador) {
        return trabajador.getEstadoDisponibilidad() == null
                ? EstadoDisponibilidadTrabajador.DISPONIBLE
                : trabajador.getEstadoDisponibilidad();
    }

    private String normalizarNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
