package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.GuardarAsignacionActivaSlotRequest;
import com.proyectofincurso.estanteria.web.dto.SlotConfiguradoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
@Tag(name = "Slots", description = "Gestion operativa de asignaciones activas de slot")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class SlotController {

    private final ModeloOperativoService modeloOperativoService;

    @PutMapping(value = "/{slotConfiguracionId}/asignacion-activa",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear o actualizar asignacion activa", description = "Requiere ADMIN/SUPERADMIN. Crea o actualiza la asignacion activa de un slot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Asignacion activa creada o actualizada"),
            @ApiResponse(responseCode = "400", description = "Fechas, slot o producto/proveedor invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Slot o producto/proveedor inexistente"),
            @ApiResponse(responseCode = "409", description = "Conflicto con producto o proveedor inactivo")
    })
    public SlotConfiguradoResponse guardarAsignacionActiva(
                                                           @Parameter(description = "Identificador del slot configurado")
                                                           @PathVariable Long slotConfiguracionId,
                                                           @Valid @RequestBody GuardarAsignacionActivaSlotRequest request) {
        return modeloOperativoService.guardarAsignacionActivaSlot(slotConfiguracionId, request);
    }

    @PatchMapping(value = "/{slotConfiguracionId}/asignacion-activa/retirar",
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Retirar asignacion activa", description = "Requiere ADMIN/SUPERADMIN. Retira la asignacion activa del slot sin borrar historico.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Asignacion retirada sin borrar historico"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Slot inexistente")
    })
    public SlotConfiguradoResponse retirarAsignacionActiva(
            @Parameter(description = "Identificador del slot configurado")
            @PathVariable Long slotConfiguracionId) {
        return modeloOperativoService.retirarAsignacionActivaSlot(slotConfiguracionId);
    }
}
