package com.proyectofincurso.estanteria.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MailDebugConfig {

    @Value("${spring.mail.username:}")
    private String springMailUsername;

    @Value("${spring.mail.password:}")
    private String springMailPassword;

    @Value("${app.auth.recovery.from:}")
    private String recoveryFrom;

    @PostConstruct
    public void logMailConfig() {
        log.info("MAIL DEBUG - spring.mail.username cargado: {}", springMailUsername != null && !springMailUsername.isBlank());
        log.info("MAIL DEBUG - spring.mail.username valor: {}", springMailUsername);
        log.info("MAIL DEBUG - spring.mail.password cargada: {}", springMailPassword != null && !springMailPassword.isBlank());
        log.info("MAIL DEBUG - spring.mail.password longitud: {}", springMailPassword == null ? 0 : springMailPassword.length());
        log.info("MAIL DEBUG - app.auth.recovery.from: {}", recoveryFrom);
    }
}
