package com.cristianarias.salon.usuario;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.formLogin;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.authenticated;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.unauthenticated;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/**
 * Pruebas de HU-01 (iniciar sesión) y HU-02 (cerrar sesión).
 * Se ejecutan contra la aplicación completa y una base de datos PostgreSQL real.
 * Cada prueba se revierte al terminar gracias a @Transactional.
 */
@SpringBootTest
@Transactional
class SeguridadTests {

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	private MockMvc mvc;

	@BeforeEach
	void configurar() {
		// Se construye MockMvc con los filtros de Spring Security activos
		mvc = MockMvcBuilders.webAppContextSetup(context)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
	}

	@Test
	void elSitioPublicoEsAccesibleSinSesion() throws Exception {
		mvc.perform(get("/")).andExpect(status().isOk());
		mvc.perform(get("/login")).andExpect(status().isOk());
	}

	@Test
	void elPanelRedirigeAlLoginSinSesion() throws Exception {
		mvc.perform(get("/admin"))
				.andExpect(status().is3xxRedirection())
				// Se espera la redirección relativa que genera Spring Security
				.andExpect(redirectedUrl("/login"));
	}

	@Test
	void elPanelSeMuestraConRolAdmin() throws Exception {
		mvc.perform(get("/admin").with(user("duena").roles("ADMIN")))
				.andExpect(status().isOk());
	}

	@Test
	void elPanelSeNiegaSinRolAdmin() throws Exception {
		mvc.perform(get("/admin").with(user("otra").roles("CLIENTA")))
				.andExpect(status().isForbidden());
	}

	@Test
	void elLoginFuncionaConCredencialesCorrectas() throws Exception {
		// Se registra una cuenta de prueba con la contraseña cifrada en BCrypt
		usuarioRepository.save(new Usuario("Dueña de prueba", "prueba", passwordEncoder.encode("Secreta123")));

		mvc.perform(formLogin("/login").user("prueba").password("Secreta123"))
				.andExpect(authenticated().withUsername("prueba").withRoles("ADMIN"))
				.andExpect(redirectedUrl("/admin"));
	}

	@Test
	void elLoginFallaConContrasenaIncorrecta() throws Exception {
		usuarioRepository.save(new Usuario("Dueña de prueba", "prueba", passwordEncoder.encode("Secreta123")));

		mvc.perform(formLogin("/login").user("prueba").password("otra"))
				.andExpect(unauthenticated())
				.andExpect(redirectedUrl("/login?error"));
	}

	@Test
	void laContrasenaSeGuardaCifrada() {
		Usuario guardado = usuarioRepository.save(
				new Usuario("Dueña de prueba", "prueba", passwordEncoder.encode("Secreta123")));

		// Se comprueba que nunca se almacena el texto plano
		org.junit.jupiter.api.Assertions.assertNotEquals("Secreta123", guardado.getPasswordHash());
		org.junit.jupiter.api.Assertions.assertTrue(guardado.getPasswordHash().startsWith("$2"));
	}

	@Test
	void elCierreDeSesionRegresaAlInicio() throws Exception {
		mvc.perform(post("/logout").with(user("duena").roles("ADMIN")).with(csrf()))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/?salida"));
	}

	@Test
	void elCierreDeSesionSinTokenCsrfSeRechaza() throws Exception {
		mvc.perform(post("/logout").with(user("duena").roles("ADMIN")))
				.andExpect(status().isForbidden());
	}
}
