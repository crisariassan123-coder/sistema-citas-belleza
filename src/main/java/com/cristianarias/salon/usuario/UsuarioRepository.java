package com.cristianarias.salon.usuario;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de la tabla "usuarios".
 * Spring Data genera la implementación a partir del nombre de cada método.
 */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	// Se busca por nombre de usuario para el inicio de sesión
	Optional<Usuario> findByUsuario(String usuario);

	// Se usa al arrancar para saber si ya existe la cuenta inicial
	boolean existsByUsuario(String usuario);
}
