package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.PlanoService;
import com.proyectofincurso.estanteria.service.PlanoOperativoService;
import com.proyectofincurso.estanteria.web.dto.ActualizarPlanoRequest;
import com.proyectofincurso.estanteria.web.dto.CrearPlanoRequest;
import com.proyectofincurso.estanteria.web.dto.PlanoOperativoResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResumenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Planos", description = "Planos 2D persistentes y vista operativa")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class PlanoController {

    private final PlanoService planoService;
    private final PlanoOperativoService planoOperativoService;

    @GetMapping(value = "/api/empresas/{codigoEmpresa}/planos", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar planos de empresa", description = "Requiere autenticacion. Devuelve los planos activos disponibles para la empresa.")
    public List<PlanoResumenResponse> listarPlanosDeEmpresa(@PathVariable String codigoEmpresa) {
        return planoService.listarPlanosDeEmpresa(codigoEmpresa);
    }

    @GetMapping(value = "/api/planos/{codigo}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener plano editable", description = "Requiere autenticacion. Devuelve plano completo con zonas y layouts.")
    public PlanoResponse obtenerPlano(@PathVariable String codigo) {
        return planoService.obtenerPlanoCompleto(codigo);
    }

    @GetMapping(value = "/api/planos/{codigo}/operativo", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener plano operativo", description = "Requiere autenticacion. Devuelve la vista operativa 2D con zonas, estanterias, slots, responsables y alertas.")
    public PlanoOperativoResponse obtenerPlanoOperativo(@PathVariable String codigo) {
        return planoOperativoService.obtenerPlanoOperativo(codigo);
    }

    @PostMapping(value = "/api/planos", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear plano", description = "Requiere ADMIN/SUPERADMIN. Crea un plano persistente con zonas y layouts.")
    public PlanoResponse crearPlano(@Valid @RequestBody CrearPlanoRequest request) {
        return planoService.crearPlano(request);
    }

    @PutMapping(value = "/api/planos/{codigo}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Actualizar plano", description = "Requiere ADMIN/SUPERADMIN. Sustituye datos editables, zonas y layouts del plano.")
    public PlanoResponse actualizarPlano(@PathVariable String codigo,
                                         @Valid @RequestBody ActualizarPlanoRequest request) {
        return planoService.actualizarPlanoCompleto(codigo, request);
    }
}
