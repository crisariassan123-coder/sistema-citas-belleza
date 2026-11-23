package com.cristianarias.salon.servicio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import java.math.BigDecimal;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/**
 * Pruebas de HU-03 (gestionar servicios) y HU-04 (catálogo público).
 * Se ejecutan contra PostgreSQL real y cada prueba se revierte al terminar.
 */
@SpringBootTest
@Transactional
class ServicioTests {

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private ServicioService servicioService;

	@Autowired
	private ServicioRepository servicioRepository;

	private MockMvc mvc;

	@BeforeEach
	void configurar() {
		mvc = MockMvcBuilders.webAppContextSetup(context)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
	}

	private ServicioForm form(String nombre, Integer duracion, String precio) {
		ServicioForm form = new ServicioForm();
		form.setNombre(nombre);
		form.setDescripcion("Descripción de prueba");
		form.setDuracionMin(duracion);
		form.setPrecio(precio == null ? null : new BigDecimal(precio));
		return form;
	}

	// ----- Capa de servicio -----

	@Test
	void seCreaUnServicioActivo() {
		Servicio creado = servicioService.crear(form("  Corte y peinado  ", 60, "350.00"));

		assertThat(creado.getId()).isNotNull();
		assertThat(creado.isActivo()).isTrue();
		// Se comprueba que se recortan los espacios sobrantes
		assertThat(creado.getNombre()).isEqualTo("Corte y peinado");
	}

	@Test
	void seActualizanLosDatosDeUnServicio() {
		Servicio creado = servicioService.crear(form("Manicure", 45, "250.00"));

		servicioService.actualizar(creado.getId(), form("Manicure francés", 60, "300.00"));
		servicioRepository.flush();

		Servicio actualizado = servicioService.obtener(creado.getId());
		assertThat(actualizado.getNombre()).isEqualTo("Manicure francés");
		assertThat(actualizado.getDuracionMin()).isEqualTo(60);
		assertThat(actualizado.getPrecio()).isEqualByComparingTo("300.00");
	}

	@Test
	void unServicioDesactivadoNoApareceEnElCatalogo() {
		Servicio visible = servicioService.crear(form("Tinte completo", 120, "900.00"));
		Servicio oculto = servicioService.crear(form("Alaciado", 180, "1500.00"));

		servicioService.cambiarEstado(oculto.getId(), false);

		assertThat(servicioService.listarActivos()).contains(visible).doesNotContain(oculto);
		// Se comprueba que la dueña sigue viendo el servicio inactivo
		assertThat(servicioService.listarTodos()).contains(visible, oculto);
	}

	@Test
	void obtenerUnServicioInexistenteLanzaExcepcion() {
		org.junit.jupiter.api.Assertions.assertThrows(ServicioNoEncontradoException.class,
				() -> servicioService.obtener(999_999L));
	}

	// ----- Panel de la dueña (HU-03) -----

	@Test
	void laListaDeServiciosRequiereSesion() throws Exception {
		mvc.perform(get("/admin/servicios"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/login"));
	}

	@Test
	void laDuenaPuedeAgregarUnServicio() throws Exception {
		mvc.perform(post("/admin/servicios").with(user("duena").roles("ADMIN")).with(csrf())
				.param("nombre", "Peinado para evento")
				.param("descripcion", "Recogido o suelto")
				.param("duracionMin", "90")
				.param("precio", "600"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin/servicios"));

		assertThat(servicioService.listarTodos())
				.extracting(Servicio::getNombre)
				.contains("Peinado para evento");
	}

	@Test
	void unaDuracionQueNoEsMultiploDe15SeRechaza() throws Exception {
		mvc.perform(post("/admin/servicios").with(user("duena").roles("ADMIN")).with(csrf())
				.param("nombre", "Servicio raro")
				.param("duracionMin", "50")
				.param("precio", "100"))
				.andExpect(status().isOk())
				.andExpect(view().name("admin/servicios/form"))
				.andExpect(model().attributeHasFieldErrors("form", "duracionMultiploDe15"));
	}

	@Test
	void unPrecioNegativoYUnNombreVacioSeRechazan() throws Exception {
		mvc.perform(post("/admin/servicios").with(user("duena").roles("ADMIN")).with(csrf())
				.param("nombre", "   ")
				.param("duracionMin", "30")
				.param("precio", "-10"))
				.andExpect(status().isOk())
				.andExpect(model().attributeHasFieldErrors("form", "nombre", "precio"));
	}

	@Test
	void laDuenaPuedeDesactivarUnServicio() throws Exception {
		Servicio servicio = servicioService.crear(form("Pedicure", 60, "280.00"));

		mvc.perform(post("/admin/servicios/{id}/desactivar", servicio.getId())
				.with(user("duena").roles("ADMIN")).with(csrf()))
				.andExpect(redirectedUrl("/admin/servicios"));

		assertThat(servicioService.obtener(servicio.getId()).isActivo()).isFalse();
	}

	@Test
	void editarUnServicioInexistenteResponde404() throws Exception {
		mvc.perform(get("/admin/servicios/999999/editar").with(user("duena").roles("ADMIN")))
				.andExpect(status().isNotFound());
	}

	// ----- Catálogo público (HU-04) -----

	@Test
	void elCatalogoPublicoMuestraSoloServiciosActivos() throws Exception {
		servicioService.crear(form("Corte de dama", 45, "250.00"));
		Servicio oculto = servicioService.crear(form("Servicio retirado", 30, "100.00"));
		servicioService.cambiarEstado(oculto.getId(), false);

		mvc.perform(get("/servicios"))
				.andExpect(status().isOk())
				.andExpect(content().string(Matchers.containsString("Corte de dama")))
				.andExpect(content().string(Matchers.not(Matchers.containsString("Servicio retirado"))));
	}
}
