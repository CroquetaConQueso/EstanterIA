package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.UserRole;

public record PerfilResponse(
        Long userId,
        String username,
        String email,
        UserRole role,
        Boolean enabled,
        PerfilEmpresaResponse empresa,
        PerfilTrabajadorResponse trabajador,
        Boolean requiereNuevoLogin,
        String mensaje
) {
}
