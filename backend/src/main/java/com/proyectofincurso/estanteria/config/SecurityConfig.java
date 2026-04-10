package com.proyectofincurso.estanteria.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .rememberMe(rememberMe -> rememberMe.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/**", "/captures/**").permitAll()
                        .anyRequest().permitAll());

        return http.build();
    }
}
