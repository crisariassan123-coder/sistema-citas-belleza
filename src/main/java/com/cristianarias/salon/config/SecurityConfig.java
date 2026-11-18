package com.cristianarias.salon.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Reglas de seguridad de la aplicación.
 * - El sitio público (inicio, reserva, estilos) queda abierto.
 * - Todo lo que cuelga de /admin exige el rol ADMIN.
 * - Se usa un formulario de inicio de sesión propio y cierre de sesión por POST con CSRF.
 */
@Configuration
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.authorizeHttpRequests(auth -> auth
				// Se protege el panel de la dueña
				.requestMatchers("/admin/**").hasRole("ADMIN")
				// Se deja libre el resto: páginas públicas, CSS, JS e imágenes
				.anyRequest().permitAll())
			.formLogin(form -> form
				.loginPage("/login")
				// Se envía a la dueña a su panel después de iniciar sesión
				.defaultSuccessUrl("/admin", true)
				.failureUrl("/login?error")
				.permitAll())
			.logout(logout -> logout
				// Se regresa al inicio con un aviso de sesión cerrada
				.logoutSuccessUrl("/?salida")
				.permitAll());
		// La protección CSRF queda activa por defecto en todos los formularios
		return http.build();
	}

	// Se define BCrypt como algoritmo para cifrar y verificar contraseñas
	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
