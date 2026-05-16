package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.ActualizarEstanteriaRequest;
import com.proyectofincurso.estanteria.web.dto.CrearEstanteriaRequest;
import com.proyectofincurso.estanteria.web.dto.EstanteriaConfiguracionResponse;
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

@RestController
@RequestMapping("/api/estanterias")
@RequiredArgsConstructor
@Tag(name = "Estanterias", description = "Estanterias y configuracion de slots")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class EstanteriaController {

    private final ModeloOperativoService modeloOperativoService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear estanteria", description = "Requiere ADMIN/SUPERADMIN. Crea una estanteria con su configuracion de slots.")
    public EstanteriaConfiguracionResponse crearEstanteria(@Valid @RequestBody CrearEstanteriaRequest request) {
        return modeloOperativoService.crearEstanteria(request);
    }

    @PatchMapping(value = "/{codigo}", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Actualizar estanteria", description = "Requiere ADMIN/SUPERADMIN. Actualiza datos y slots configurados.")
    public EstanteriaConfiguracionResponse actualizarEstanteria(@PathVariable String codigo,
                                                                @Valid @RequestBody ActualizarEstanteriaRequest request) {
        return modeloOperativoService.actualizarEstanteria(codigo, request);
    }

    @GetMapping(value = "/{codigo}/configuracion", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener configuracion de estanteria", description = "Requiere autenticacion. Devuelve datos, seccion y slots de una estanteria.")
    public EstanteriaConfiguracionResponse obtenerConfiguracion(@PathVariable String codigo) {
        return modeloOperativoService.obtenerConfiguracionDeEstanteria(codigo);
    }
}
