package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.InspeccionService;
import com.proyectofincurso.estanteria.web.dto.InspeccionDetalleResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionItemResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionarRequest;
import com.proyectofincurso.estanteria.web.dto.InspeccionarResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
    public InspeccionarResponse inspeccionar(@Valid @RequestBody InspeccionarRequest req){
        return inspeccionService.crearInspeccion(req.getEstanteriaCodigo(), req.getNotas(), req.getImagenPath());
        
    }
    
    @GetMapping(value="/inspecciones")
    @Operation(summary = "Listar inspecciones", description = "Requiere autenticacion. Devuelve el historico resumido de inspecciones.")
    public List<InspeccionItemResponse> obtenerInspecciones() {
        return inspeccionService.obtenerInspecciones();
    }

    @GetMapping(value="/inspecciones/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener inspeccion", description = "Requiere autenticacion. Devuelve el detalle de una inspeccion y sus resultados.")
    public InspeccionDetalleResponse obtenerInspeccion(@PathVariable Long id) {
        return inspeccionService.obtenerInspeccion(id);
    }

    @DeleteMapping(value="/inspecciones/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Eliminar inspeccion", description = "Requiere ADMIN/SUPERADMIN. Solo elimina inspecciones sin alertas ni tareas asociadas.")
    public void eliminarInspeccion(@PathVariable Long id) {
        inspeccionService.eliminarInspeccion(id);
    }
    
}
