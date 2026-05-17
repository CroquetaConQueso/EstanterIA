package com.proyectofincurso.estanteria.config;

import com.proyectofincurso.estanteria.persistence.entity.TipoAlerta;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AlertaSchemaCompatibility implements CommandLineRunner {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        if (!isPostgreSql()) {
            return;
        }

        String valoresPermitidos = Arrays.stream(TipoAlerta.values())
                .map(TipoAlerta::name)
                .map(valor -> "'" + valor + "'")
                .collect(Collectors.joining(", "));

        jdbcTemplate.execute("alter table alerta drop constraint if exists chk_alerta_tipo");
        jdbcTemplate.execute("alter table alerta add constraint chk_alerta_tipo check (tipo_alerta in ("
                + valoresPermitidos + "))");
        log.info("Constraint chk_alerta_tipo actualizado con los tipos de alerta vigentes.");
    }

    private boolean isPostgreSql() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            return connection.getMetaData().getDatabaseProductName().toLowerCase().contains("postgresql");
        }
    }
}
