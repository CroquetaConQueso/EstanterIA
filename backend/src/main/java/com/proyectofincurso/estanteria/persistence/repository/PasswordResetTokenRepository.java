package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.PasswordResetToken;
import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    List<PasswordResetToken> findByUserAndUsedAtIsNull(UserAccount user);
}