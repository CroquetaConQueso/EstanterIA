package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.AuthSession;
import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

    Optional<AuthSession> findBySessionId(String sessionId);

    List<AuthSession> findByUserAccountAndRevokedAtIsNullAndExpiresAtAfter(UserAccount userAccount, Instant now);
}
