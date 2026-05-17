package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Payload para crear un trabajador operativo")
public record CrearTrabajadorRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String nombre,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 150, message = "Los apellidos no pueden superar 150 caracteres")
        String apellidos,

        @Email(message = "El email de contacto no tiene un formato valido")
        @Size(max = 160, message = "El email de contacto no puede superar 160 caracteres")
        String emailContacto,

        @Size(max = 40, message = "El telefono de contacto no puede superar 40 caracteres")
        String telefonoContacto,

        @NotNull(message = "El tipo de trabajador es obligatorio")
        TipoTrabajador tipoTrabajador,

        EstadoDisponibilidadTrabajador estadoDisponibilidad
) {
}
