package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.PlanoService;
import com.proyectofincurso.estanteria.service.PlanoOperativoService;
import com.proyectofincurso.estanteria.web.dto.ActualizarPlanoRequest;
import com.proyectofincurso.estanteria.web.dto.CrearPlanoRequest;
import com.proyectofincurso.estanteria.web.dto.EstadoListadoPlanos;
import com.proyectofincurso.estanteria.web.dto.PlanoOperativoResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResumenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
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
    @Operation(summary = "Listar planos de empresa", description = "Requiere autenticacion. Por defecto devuelve planos activos.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Planos devueltos segun filtro ACTIVOS, INACTIVOS o TODOS"),
            @ApiResponse(responseCode = "400", description = "Estado de listado invalido"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Empresa inexistente o inactiva")
    })
    public List<PlanoResumenResponse> listarPlanosDeEmpresa(
            @Parameter(description = "Codigo de empresa propietaria de los planos")
            @PathVariable String codigoEmpresa,
            @Parameter(description = "Filtro de visibilidad: ACTIVOS, INACTIVOS o TODOS")
            @RequestParam(name = "estado", defaultValue = "ACTIVOS") EstadoListadoPlanos estado) {
        return planoService.listarPlanosDeEmpresa(codigoEmpresa, estado);
    }

    @GetMapping(value = "/api/planos/{codigo}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener plano editable", description = "Requiere autenticacion. Devuelve plano completo con zonas y layouts.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plano editable encontrado"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Plano inexistente")
    })
    public PlanoResponse obtenerPlano(
            @Parameter(description = "Codigo del plano")
            @PathVariable String codigo) {
        return planoService.obtenerPlanoCompleto(codigo);
    }

    @GetMapping(value = "/api/planos/{codigo}/operativo", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener plano operativo", description = "Requiere autenticacion. Devuelve la vista operativa 2D con zonas, estanterias, slots, responsables y alertas.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plano operativo encontrado"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Plano inexistente")
    })
    public PlanoOperativoResponse obtenerPlanoOperativo(
            @Parameter(description = "Codigo del plano")
            @PathVariable String codigo) {
        return planoOperativoService.obtenerPlanoOperativo(codigo);
    }

    @PostMapping(value = "/api/planos", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear plano", description = "Requiere ADMIN/SUPERADMIN. Crea un plano persistente con zonas y layouts.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Plano creado"),
            @ApiResponse(responseCode = "400", description = "Datos, dimensiones, zonas o layouts invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Empresa, seccion o estanteria inexistente"),
            @ApiResponse(responseCode = "409", description = "Codigo de plano duplicado o seccion usada en otro plano")
    })
    public PlanoResponse crearPlano(@Valid @RequestBody CrearPlanoRequest request) {
        return planoService.crearPlano(request);
    }

    @PutMapping(value = "/api/planos/{codigo}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Actualizar plano", description = "Requiere ADMIN/SUPERADMIN. Sustituye datos editables, zonas y layouts del plano.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plano actualizado"),
            @ApiResponse(responseCode = "400", description = "Datos, dimensiones, zonas o layouts invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Plano, seccion o estanteria inexistente"),
            @ApiResponse(responseCode = "409", description = "Seccion usada en otro plano activo")
    })
    public PlanoResponse actualizarPlano(
                                         @Parameter(description = "Codigo del plano a actualizar")
                                         @PathVariable String codigo,
                                         @Valid @RequestBody ActualizarPlanoRequest request) {
        return planoService.actualizarPlanoCompleto(codigo, request);
    }

    @PatchMapping(value = "/api/planos/{codigo}/desactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Desactivar plano", description = "Requiere ADMIN/SUPERADMIN. Desactiva el plano sin borrar zonas, layouts ni historico.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plano desactivado o ya inactivo"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Plano inexistente")
    })
    public PlanoResponse desactivarPlano(
            @Parameter(description = "Codigo del plano a desactivar")
            @PathVariable String codigo) {
        return planoService.desactivarPlano(codigo);
    }

    @PatchMapping(value = "/api/planos/{codigo}/reactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Reactivar plano", description = "Requiere ADMIN/SUPERADMIN. Vuelve a marcar el plano como activo.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Plano reactivado o ya activo"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Plano inexistente")
    })
    public PlanoResponse reactivarPlano(
            @Parameter(description = "Codigo del plano a reactivar")
            @PathVariable String codigo) {
        return planoService.reactivarPlano(codigo);
    }
}
