package com.proyectofincurso.estanteria.auth;

import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PasswordRecoveryMailService {

    private final JavaMailSender mailSender;

    @Value("${app.auth.recovery.from}")
    private String fromEmail;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    public void sendRecoveryEmail(UserAccount user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(user.getEmail());
        message.setSubject("EstanterIA · Recuperación de contraseña");
        message.setText(buildBody(user.getUsername()));
        mailSender.send(message);
    }

    private String buildBody(String username) {
        String loginUrl = buildLoginUrl();

        return """
                Hola %s,

                Hemos recibido una solicitud de recuperación de contraseña para tu cuenta de EstanterIA.

                Esta implementación es la versión académica del proyecto:
                - el correo demuestra el flujo de recuperación
                - no cambia automáticamente la contraseña todavía
                - el enlace te devuelve al acceso de la aplicación

                Enlace de acceso:
                %s

                Si no has solicitado esta recuperación, puedes ignorar este mensaje.

                EstanterIA
                """.formatted(username, loginUrl);
    }

    private String buildLoginUrl() {
        String base = frontendBaseUrl == null ? "" : frontendBaseUrl.trim();

        if (base.endsWith("/")) {
            return base + "html/login.html";
        }

        return base + "/html/login.html";
    }
}