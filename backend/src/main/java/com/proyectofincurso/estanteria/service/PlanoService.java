package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.Plano;
import com.proyectofincurso.estanteria.persistence.entity.PlanoEstanteriaLayout;
import com.proyectofincurso.estanteria.persistence.entity.PlanoZona;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.repository.EmpresaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoEstanteriaLayoutRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoZonaRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionRepository;
import com.proyectofincurso.estanteria.web.dto.ActualizarPlanoRequest;
import com.proyectofincurso.estanteria.web.dto.CrearPlanoRequest;
import com.proyectofincurso.estanteria.web.dto.EmpresaResponse;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoEstanteriaLayoutRequest;
import com.proyectofincurso.estanteria.web.dto.PlanoEstanteriaLayoutResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResumenResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoZonaRequest;
import com.proyectofincurso.estanteria.web.dto.PlanoZonaResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanoService {

    private final PlanoRepository planoRepository;
    private final PlanoZonaRepository planoZonaRepository;
    private final PlanoEstanteriaLayoutRepository planoEstanteriaLayoutRepository;
    private final EmpresaRepository empresaRepository;
    private final SeccionRepository seccionRepository;
    private final EstanteriaRepository estanteriaRepository;

    @Transactional(readOnly = true)
    public List<PlanoResumenResponse> listarPlanosDeEmpresa(String codigoEmpresa) {
        Empresa empresa = obtenerEmpresaActiva(codigoEmpresa);

        return planoRepository.findByEmpresaCodigoAndActivoTrueOrderByNombreAsc(empresa.getCodigo()).stream()
                .map(this::toPlanoResumenResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanoResponse obtenerPlanoCompleto(String codigo) {
        Plano plano = obtenerPlanoPorCodigo(codigo);
        return toPlanoResponse(plano);
    }

    @Transactional(readOnly = true)
    public List<SeccionResponse> listarSeccionesDisponiblesParaPlano(String codigoEmpresa, String planoCodigo) {
        Empresa empresa = obtenerEmpresaActiva(codigoEmpresa);
        Plano planoActual = null;
        String codigoPlanoNormalizado = normalizarNullable(planoCodigo);
        if (codigoPlanoNormalizado != null) {
            planoActual = obtenerPlanoPorCodigo(codigoPlanoNormalizado);
            if (!Objects.equals(planoActual.getEmpresa().getId(), empresa.getId())) {
                throw ApiException.badRequest(
                        "PLANO_EMPRESA_INCOHERENTE",
                        "El plano indicado no pertenece a la empresa seleccionada"
                );
            }
        }

        Set<Long> seccionesUsadas = (planoActual == null
                ? planoZonaRepository.findSeccionIdsUsadasEnPlanosActivos(empresa.getId())
                : planoZonaRepository.findSeccionIdsUsadasEnOtrosPlanosActivos(empresa.getId(), planoActual.getId()))
                .stream()
                .collect(Collectors.toSet());

        return seccionRepository.findByEmpresaCodigoAndActivaTrueOrderByNombreAsc(empresa.getCodigo()).stream()
                .filter(seccion -> !seccionesUsadas.contains(seccion.getId()))
                .map(this::toSeccionResponse)
                .toList();
    }

    @Transactional
    public PlanoResponse crearPlano(CrearPlanoRequest request) {
        String codigoPlano = normalizar(request.codigo());
        if (planoRepository.existsByCodigo(codigoPlano)) {
            throw ApiException.conflict(
                    "PLANO_CODIGO_DUPLICADO",
                    "Ya existe un plano con el codigo indicado"
            );
        }

        Empresa empresa = obtenerEmpresaActiva(request.empresaCodigo());
        validarDimensionPlano(request.ancho(), request.alto());

        Instant ahora = Instant.now();
        Plano plano = new Plano();
        plano.setEmpresa(empresa);
        plano.setCodigo(codigoPlano);
        plano.setNombre(normalizar(request.nombre()));
        plano.setDescripcion(normalizarNullable(request.descripcion()));
        plano.setAncho(request.ancho());
        plano.setAlto(request.alto());
        plano.setActivo(true);
        plano.setCreatedAt(ahora);
        plano.setUpdatedAt(ahora);

        Plano planoGuardado = planoRepository.save(plano);
        recrearContenido(planoGuardado, zonas(request.zonas()), estanterias(request.estanterias()), ahora, Set.of());

        return toPlanoResponse(planoGuardado);
    }

    @Transactional
    public PlanoResponse actualizarPlanoCompleto(String codigo, ActualizarPlanoRequest request) {
        Plano plano = obtenerPlanoPorCodigo(codigo);
        validarDimensionPlano(request.ancho(), request.alto());

        Instant ahora = Instant.now();
        plano.setNombre(normalizar(request.nombre()));
        plano.setDescripcion(normalizarNullable(request.descripcion()));
        plano.setAncho(request.ancho());
        plano.setAlto(request.alto());
        plano.setUpdatedAt(ahora);

        Set<Long> estanteriasYaColocadas = planoEstanteriaLayoutRepository.findByPlanoIdOrderByIdAsc(plano.getId()).stream()
                .map(layout -> layout.getEstanteria().getId())
                .collect(Collectors.toSet());
        planoEstanteriaLayoutRepository.deleteByPlanoId(plano.getId());
        planoEstanteriaLayoutRepository.flush();
        planoZonaRepository.deleteByPlanoId(plano.getId());
        planoZonaRepository.flush();
        recrearContenido(plano, zonas(request.zonas()), estanterias(request.estanterias()), ahora, estanteriasYaColocadas);

        return toPlanoResponse(plano);
    }

    private void recrearContenido(Plano plano,
                                  List<PlanoZonaRequest> zonasRequest,
                                  List<PlanoEstanteriaLayoutRequest> estanteriasRequest,
                                  Instant ahora,
                                  Set<Long> estanteriasInactivasPermitidas) {
        Map<Long, Seccion> secciones = cargarYValidarSecciones(plano, zonasRequest);
        Map<Long, PlanoZona> zonasPorSeccion = crearZonas(plano, zonasRequest, secciones, ahora);
        crearLayouts(plano, estanteriasRequest, zonasPorSeccion, ahora, estanteriasInactivasPermitidas);
    }

    private Map<Long, Seccion> cargarYValidarSecciones(Plano plano, List<PlanoZonaRequest> zonasRequest) {
        Empresa empresa = plano.getEmpresa();
        Set<Long> ids = new HashSet<>();
        for (PlanoZonaRequest zona : zonasRequest) {
            if (!ids.add(zona.seccionId())) {
                throw ApiException.badRequest(
                        "PLANO_SECCION_DUPLICADA",
                        "Una seccion no puede aparecer dos veces en el mismo plano"
                );
            }
        }

        Set<Long> seccionesUsadasEnOtrosPlanos = planoZonaRepository
                .findSeccionIdsUsadasEnOtrosPlanosActivos(empresa.getId(), plano.getId())
                .stream()
                .collect(Collectors.toSet());
        boolean haySeccionYaUsada = ids.stream().anyMatch(seccionesUsadasEnOtrosPlanos::contains);
        if (haySeccionYaUsada) {
            throw ApiException.conflict(
                    "PLANO_SECCION_USADA_EN_OTRO_PLANO",
                    "La seccion ya esta representada en otro plano."
            );
        }

        Map<Long, Seccion> secciones = seccionRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Seccion::getId, Function.identity()));

        for (Long seccionId : ids) {
            Seccion seccion = secciones.get(seccionId);
            if (seccion == null || Boolean.FALSE.equals(seccion.getActiva())) {
                throw ApiException.notFound(
                        "SECCION_NOT_FOUND",
                        "No existe una seccion activa con el identificador indicado"
                );
            }
            if (!Objects.equals(seccion.getEmpresa().getId(), empresa.getId())) {
                throw ApiException.badRequest(
                        "SECCION_EMPRESA_INCOHERENTE",
                        "La seccion indicada no pertenece a la empresa del plano"
                );
            }
        }

        return secciones;
    }

    private Map<Long, PlanoZona> crearZonas(Plano plano,
                                            List<PlanoZonaRequest> zonasRequest,
                                            Map<Long, Seccion> secciones,
                                            Instant ahora) {
        List<PlanoZona> zonas = new ArrayList<>();

        for (PlanoZonaRequest request : zonasRequest) {
            validarCajaDentroDePlano(
                    request.x(),
                    request.y(),
                    request.width(),
                    request.height(),
                    plano.getAncho(),
                    plano.getAlto(),
                    "PLANO_ZONA_FUERA_DE_LIMITES",
                    "La zona debe quedar dentro de los limites del plano"
            );

            PlanoZona zona = new PlanoZona();
            zona.setPlano(plano);
            zona.setSeccion(secciones.get(request.seccionId()));
            zona.setX(request.x());
            zona.setY(request.y());
            zona.setWidth(request.width());
            zona.setHeight(request.height());
            zona.setCreatedAt(ahora);
            zona.setUpdatedAt(ahora);
            zonas.add(zona);
        }

        return planoZonaRepository.saveAll(zonas).stream()
                .collect(Collectors.toMap(zona -> zona.getSeccion().getId(), Function.identity()));
    }

    private void crearLayouts(Plano plano,
                              List<PlanoEstanteriaLayoutRequest> estanteriasRequest,
                              Map<Long, PlanoZona> zonasPorSeccion,
                              Instant ahora,
                              Set<Long> estanteriasInactivasPermitidas) {
        Set<Long> estanteriasUsadas = new HashSet<>();
        List<PlanoEstanteriaLayout> layouts = new ArrayList<>();

        for (PlanoEstanteriaLayoutRequest request : estanteriasRequest) {
            PlanoZona zona = zonasPorSeccion.get(request.seccionId());
            if (zona == null) {
                throw ApiException.badRequest(
                        "PLANO_ESTANTERIA_SIN_ZONA",
                        "La estanteria indicada debe pertenecer a una seccion con zona en el plano"
                );
            }

            Estanteria estanteria = estanteriaRepository
                    .findWithSeccionByCodigoIgnoreCase(normalizar(request.estanteriaCodigo()))
                    .orElseThrow(() -> ApiException.notFound(
                            "ESTANTERIA_NOT_FOUND",
                            "No existe una estanteria con el codigo indicado"
                    ));

            if (Boolean.FALSE.equals(estanteria.getActiva()) && !estanteriasInactivasPermitidas.contains(estanteria.getId())) {
                throw ApiException.notFound(
                        "ESTANTERIA_NOT_FOUND",
                        "No existe una estanteria activa con el codigo indicado"
                );
            }

            if (!estanteriasUsadas.add(estanteria.getId())) {
                throw ApiException.badRequest(
                        "PLANO_ESTANTERIA_DUPLICADA",
                        "Una estanteria no puede aparecer dos veces en el mismo plano"
                );
            }

            if (!Objects.equals(estanteria.getSeccion().getId(), request.seccionId())) {
                throw ApiException.badRequest(
                        "PLANO_ESTANTERIA_SECCION_INCOHERENTE",
                        "La estanteria no pertenece a la seccion indicada"
                );
            }

            validarCajaDentroDePlano(
                    request.x(),
                    request.y(),
                    request.width(),
                    request.height(),
                    plano.getAncho(),
                    plano.getAlto(),
                    "PLANO_ESTANTERIA_FUERA_DE_LIMITES",
                    "La estanteria debe quedar dentro de los limites del plano"
            );
            validarCajaDentroDeZona(request, zona);

            PlanoEstanteriaLayout layout = new PlanoEstanteriaLayout();
            layout.setPlano(plano);
            layout.setPlanoZona(zona);
            layout.setEstanteria(estanteria);
            layout.setX(request.x());
            layout.setY(request.y());
            layout.setWidth(request.width());
            layout.setHeight(request.height());
            layout.setOrientacion(request.orientacion());
            layout.setCreatedAt(ahora);
            layout.setUpdatedAt(ahora);
            layouts.add(layout);
        }

        planoEstanteriaLayoutRepository.saveAll(layouts);
    }

    private void validarCajaDentroDeZona(PlanoEstanteriaLayoutRequest request, PlanoZona zona) {
        boolean dentro = request.x() >= zona.getX()
                && request.y() >= zona.getY()
                && request.x() + request.width() <= zona.getX() + zona.getWidth()
                && request.y() + request.height() <= zona.getY() + zona.getHeight();

        if (!dentro) {
            throw ApiException.badRequest(
                    "PLANO_ESTANTERIA_FUERA_DE_ZONA",
                    "La estanteria debe quedar dentro de la zona vinculada"
            );
        }
    }

    private void validarDimensionPlano(Double ancho, Double alto) {
        if (ancho == null || ancho <= 0 || alto == null || alto <= 0) {
            throw ApiException.badRequest(
                    "PLANO_DIMENSION_INVALIDA",
                    "El ancho y el alto del plano deben ser mayores que cero"
            );
        }
    }

    private void validarCajaDentroDePlano(Double x,
                                          Double y,
                                          Double width,
                                          Double height,
                                          Double anchoPlano,
                                          Double altoPlano,
                                          String code,
                                          String message) {
        if (x == null || y == null || width == null || height == null
                || x < 0 || y < 0 || width <= 0 || height <= 0
                || x + width > anchoPlano || y + height > altoPlano) {
            throw ApiException.badRequest(code, message);
        }
    }

    private Empresa obtenerEmpresaActiva(String codigoEmpresa) {
        return empresaRepository.findByCodigoAndActivaTrue(normalizar(codigoEmpresa))
                .orElseThrow(() -> ApiException.notFound(
                        "EMPRESA_NOT_FOUND",
                        "No existe una empresa activa con el codigo indicado"
                ));
    }

    private Plano obtenerPlanoPorCodigo(String codigo) {
        return planoRepository.findWithEmpresaByCodigo(normalizar(codigo))
                .orElseThrow(() -> ApiException.notFound(
                        "PLANO_NOT_FOUND",
                        "No existe un plano con el codigo indicado"
                ));
    }

    private PlanoResponse toPlanoResponse(Plano plano) {
        List<PlanoZona> zonas = planoZonaRepository.findByPlanoIdOrderByIdAsc(plano.getId());
        List<PlanoEstanteriaLayout> layouts = planoEstanteriaLayoutRepository.findByPlanoIdOrderByIdAsc(plano.getId());

        return new PlanoResponse(
                plano.getId(),
                plano.getCodigo(),
                plano.getNombre(),
                plano.getDescripcion(),
                plano.getAncho(),
                plano.getAlto(),
                plano.getActivo(),
                toEmpresaResponse(plano.getEmpresa()),
                zonas.stream().map(this::toPlanoZonaResponse).toList(),
                layouts.stream().map(this::toPlanoEstanteriaLayoutResponse).toList()
        );
    }

    private PlanoResumenResponse toPlanoResumenResponse(Plano plano) {
        return new PlanoResumenResponse(
                plano.getId(),
                plano.getCodigo(),
                plano.getNombre(),
                plano.getDescripcion(),
                plano.getAncho(),
                plano.getAlto(),
                plano.getActivo()
        );
    }

    private PlanoZonaResponse toPlanoZonaResponse(PlanoZona zona) {
        return new PlanoZonaResponse(
                zona.getId(),
                toSeccionResponse(zona.getSeccion()),
                zona.getX(),
                zona.getY(),
                zona.getWidth(),
                zona.getHeight()
        );
    }

    private PlanoEstanteriaLayoutResponse toPlanoEstanteriaLayoutResponse(PlanoEstanteriaLayout layout) {
        return new PlanoEstanteriaLayoutResponse(
                layout.getId(),
                layout.getPlanoZona().getId(),
                toEstanteriaResumenResponse(layout.getEstanteria()),
                layout.getX(),
                layout.getY(),
                layout.getWidth(),
                layout.getHeight(),
                layout.getOrientacion()
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

    private List<PlanoZonaRequest> zonas(List<PlanoZonaRequest> zonas) {
        return zonas == null ? List.of() : zonas;
    }

    private List<PlanoEstanteriaLayoutRequest> estanterias(List<PlanoEstanteriaLayoutRequest> estanterias) {
        return estanterias == null ? List.of() : estanterias;
    }

    private String normalizar(String valor) {
        return valor == null ? null : valor.trim();
    }

    private String normalizarNullable(String valor) {
        String normalizado = normalizar(valor);
        return normalizado == null || normalizado.isBlank() ? null : normalizado;
    }
}
