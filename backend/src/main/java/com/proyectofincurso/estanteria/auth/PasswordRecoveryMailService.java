package com.proyectofincurso.estanteria.auth;

import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class PasswordRecoveryMailService {

    private final JavaMailSender mailSender;

    @Value("${app.auth.recovery.from:${MAIL_USERNAME:}}")
    private String from;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public void sendRecoveryEmail(UserAccount user, String token) {
        SimpleMailMessage message = new SimpleMailMessage();

        if (from != null && !from.isBlank()) {
            message.setFrom(from);
        }

        message.setTo(user.getEmail());
        message.setSubject("Recuperación de contraseña - EstanterIA");
        message.setText(buildBody(user.getUsername(), buildResetUrl(token)));

        mailSender.send(message);
    }

    private String buildResetUrl(String token) {
        String base = frontendBaseUrl.replaceAll("/+$", "");
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return base + "/html/reset_password.html?token=" + encodedToken;
    }

    private String buildBody(String username, String resetUrl) {
        return """
                Hola %s,

                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de EstanterIA.

                Usa este enlace para establecer una nueva contraseña:
                %s

                Este enlace caduca en 30 minutos.

                Si no has solicitado este cambio, puedes ignorar este mensaje.

                EstanterIA
                """.formatted(username, resetUrl);
    }
}