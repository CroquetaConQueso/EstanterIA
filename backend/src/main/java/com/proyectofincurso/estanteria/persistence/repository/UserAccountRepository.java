package com.proyectofincurso.estanteria.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyectofincurso.estanteria.persistence.entity.UserAccount;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByUsernameIgnoreCase(String username);
    Optional<UserAccount> findByEmailIgnoreCase(String email);
}
