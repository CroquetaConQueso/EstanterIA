package com.proyectofincurso.estanteria.service;

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

    @Value("${app.auth.recovery.from:}")
    private String from;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public void enviarEnlaceRecuperacion(UserAccount user, String token) {
        String enlace = "%s/html/reset_password.html?token=%s".formatted(frontendBaseUrl, token);

        SimpleMailMessage message = new SimpleMailMessage();
        if (from != null && !from.isBlank()) {
            message.setFrom(from);
        }
        message.setTo(user.getEmail());
        message.setSubject("Recuperación de contraseña - EstanterIA");
        message.setText("""
                Hola %s,

                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de EstanterIA.

                Usa este enlace para crear una nueva contraseña:
                %s

                El enlace caduca en 30 minutos.
                Si no solicitaste este cambio, puedes ignorar este correo.
                """.formatted(user.getUsername(), enlace));

        mailSender.send(message);
    }
}
