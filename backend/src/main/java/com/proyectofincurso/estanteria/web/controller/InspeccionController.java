package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.InspeccionService;
import com.proyectofincurso.estanteria.web.dto.ActualizarImagenInspeccionRequest;
import com.proyectofincurso.estanteria.web.dto.InspeccionDetalleResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionItemResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionarRequest;
import com.proyectofincurso.estanteria.web.dto.InspeccionarResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api")
@Tag(name = "Inspecciones", description = "Inspecciones visuales y resultados")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class InspeccionController {
    private final InspeccionService inspeccionService;
    

    public InspeccionController(InspeccionService iser){
        this.inspeccionService = iser;
    }

    @PostMapping(value="/inspeccion_nueva", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Crear inspeccion manual", description = "Requiere autenticacion. Crea una inspeccion a partir de una imagen ya disponible.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inspeccion manual creada"),
            @ApiResponse(responseCode = "400", description = "Imagen o datos de inspeccion invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Estanteria inexistente")
    })
    public InspeccionarResponse inspeccionar(@Valid @RequestBody InspeccionarRequest req){
        return inspeccionService.crearInspeccion(req.getEstanteriaCodigo(), req.getNotas(), req.getImagenPath());
        
    }
    
    @GetMapping(value="/inspecciones")
    @Operation(summary = "Listar inspecciones", description = "Requiere autenticacion. Devuelve el historico resumido de inspecciones.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Historico de inspecciones devuelto"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public List<InspeccionItemResponse> obtenerInspecciones() {
        return inspeccionService.obtenerInspecciones();
    }

    @GetMapping(value="/inspecciones/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener inspeccion", description = "Requiere autenticacion. Devuelve el detalle de una inspeccion y sus resultados.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalle de inspeccion devuelto"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Inspeccion inexistente")
    })
    public InspeccionDetalleResponse obtenerInspeccion(
            @Parameter(description = "Identificador de la inspeccion")
            @PathVariable Long id) {
        return inspeccionService.obtenerInspeccion(id);
    }

    @PatchMapping(value="/inspecciones/{id}/imagen", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Actualizar imagen de inspeccion", description = "Requiere ADMIN/SUPERADMIN. Asocia, cambia o elimina la captura vinculada sin recalcular resultados visuales.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Imagen de inspeccion actualizada"),
            @ApiResponse(responseCode = "400", description = "Ruta de imagen invalida o no segura"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Inspeccion o captura inexistente")
    })
    public InspeccionDetalleResponse actualizarImagen(
            @Parameter(description = "Identificador de la inspeccion")
            @PathVariable Long id,
            @RequestBody ActualizarImagenInspeccionRequest request
    ) {
        // La imagen se actualiza como evidencia asociada; no recalcula resultados de Vision ni genera nuevas alertas.
        String imagenPath = request == null ? null : request.imagenPath();
        return inspeccionService.actualizarImagen(id, imagenPath);
    }

    @DeleteMapping(value="/inspecciones/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Eliminar inspeccion", description = "Requiere ADMIN/SUPERADMIN. Solo elimina inspecciones sin alertas ni tareas asociadas.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Inspeccion eliminada"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Inspeccion inexistente"),
            @ApiResponse(responseCode = "409", description = "Inspeccion bloqueada por alertas o tareas asociadas")
    })
    public void eliminarInspeccion(
            @Parameter(description = "Identificador de la inspeccion")
            @PathVariable Long id) {
        inspeccionService.eliminarInspeccion(id);
    }
    
}
