package com.cristianarias.salon.usuario;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crea la cuenta de la dueña al arrancar la aplicación, solo si todavía no existe.
 * El usuario y la contraseña se leen de variables de entorno (archivo .env en local),
 * por lo que ninguna credencial queda escrita en el código ni en las migraciones.
 */
@Component
public class CuentaInicialInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(CuentaInicialInitializer.class);

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final String usuario;
	private final String password;
	private final String nombre;

	public CuentaInicialInitializer(UsuarioRepository usuarioRepository,
			PasswordEncoder passwordEncoder,
			@Value("${salon.admin.usuario}") String usuario,
			@Value("${salon.admin.password}") String password,
			@Value("${salon.admin.nombre}") String nombre) {
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = passwordEncoder;
		this.usuario = usuario;
		this.password = password;
		this.nombre = nombre;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		// Se omite la creación si no se configuró una contraseña (por ejemplo, en CI)
		if (password == null || password.isBlank()) {
			log.warn("No se definió ADMIN_PASSWORD; no se creó la cuenta inicial de la dueña.");
			return;
		}
		if (usuarioRepository.existsByUsuario(usuario)) {
			log.info("La cuenta '{}' ya existe; no se modificó.", usuario);
			return;
		}
		// Se guarda únicamente el hash BCrypt de la contraseña
		usuarioRepository.save(new Usuario(nombre, usuario, passwordEncoder.encode(password)));
		log.info("Se creó la cuenta inicial '{}'.", usuario);
	}
}
