package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.service.AlertaOperativaService;
import com.proyectofincurso.estanteria.web.dto.AlertaResponse;
import com.proyectofincurso.estanteria.web.dto.ActualizarSeccionRequest;
import com.proyectofincurso.estanteria.web.dto.AsignarResponsablePrincipalRequest;
import com.proyectofincurso.estanteria.web.dto.CrearSeccionRequest;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResponsableResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@RestController
@RequestMapping("/api/secciones")
@RequiredArgsConstructor
@Tag(name = "Secciones", description = "Secciones, zonas operativas y responsables")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class SeccionController {

    private final ModeloOperativoService modeloOperativoService;
    private final AlertaOperativaService alertaOperativaService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear seccion", description = "Requiere ADMIN/SUPERADMIN. Crea una seccion operativa para una empresa.")
    public SeccionResponse crearSeccion(@Valid @RequestBody CrearSeccionRequest request) {
        return modeloOperativoService.crearSeccion(request);
    }

    @PatchMapping(value = "/{seccionId}", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Actualizar seccion", description = "Requiere ADMIN/SUPERADMIN. Actualiza codigo, nombre o descripcion de una seccion.")
    public SeccionResponse actualizarSeccion(@PathVariable Long seccionId,
                                             @Valid @RequestBody ActualizarSeccionRequest request) {
        return modeloOperativoService.actualizarSeccion(seccionId, request);
    }

    @PatchMapping(value = "/{seccionId}/desactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Desactivar seccion", description = "Requiere ADMIN/SUPERADMIN. Desactiva la seccion sin borrar historico operativo.")
    public SeccionResponse desactivarSeccion(@PathVariable Long seccionId) {
        return modeloOperativoService.desactivarSeccion(seccionId);
    }

    @PatchMapping(value = "/{seccionId}/reactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Reactivar seccion", description = "Requiere ADMIN/SUPERADMIN. Reactiva la seccion para nuevas configuraciones.")
    public SeccionResponse reactivarSeccion(@PathVariable Long seccionId) {
        return modeloOperativoService.reactivarSeccion(seccionId);
    }

    @PatchMapping(value = "/{seccionId}/responsable-principal", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Asignar responsable principal", description = "Requiere ADMIN/SUPERADMIN. Sustituye el responsable principal de la seccion.")
    public PlanoResponsableResponse asignarResponsablePrincipal(@PathVariable Long seccionId,
                                                                @Valid @RequestBody AsignarResponsablePrincipalRequest request) {
        return modeloOperativoService.asignarResponsablePrincipal(seccionId, request.trabajadorId());
    }

    @GetMapping(value = "/{seccionId}/estanterias", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar estanterias de seccion", description = "Requiere autenticacion. Por defecto devuelve estanterias activas de una seccion.")
    public List<EstanteriaResumenResponse> obtenerEstanterias(
            @PathVariable Long seccionId,
            @RequestParam(name = "incluirInactivas", defaultValue = "false") boolean incluirInactivas) {
        return modeloOperativoService.obtenerEstanteriasDeSeccion(seccionId, incluirInactivas);
    }

    @GetMapping(value = "/{seccionId}/alertas/abiertas", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar alertas abiertas de seccion", description = "Requiere autenticacion. Devuelve alertas abiertas agregadas por seccion.")
    public List<AlertaResponse> obtenerAlertasAbiertas(@PathVariable Long seccionId) {
        return alertaOperativaService.obtenerAlertasAbiertasDeSeccion(seccionId);
    }
}
