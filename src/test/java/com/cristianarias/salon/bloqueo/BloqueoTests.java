package com.cristianarias.salon.bloqueo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.flash;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/**
 * Pruebas de HU-06, HU-07 y HU-08 (bloqueos de agenda).
 * Cada prueba se revierte al terminar, así que no deja datos en la BD.
 */
@SpringBootTest
@Transactional
class BloqueoTests {

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private BloqueoRepository bloqueoRepository;

	@Autowired
	private JdbcTemplate jdbc;

	@Autowired
	private Clock clock;

	private MockMvc mvc;

	private LocalDate hoy;

	@BeforeEach
	void configurar() {
		mvc = MockMvcBuilders.webAppContextSetup(context)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		hoy = LocalDate.now(clock);
	}

	// Se arma la petición de la dueña con sesión y token CSRF
	private MockHttpServletRequestBuilder crear() {
		return post("/admin/bloqueos").with(user("duena").roles("ADMIN")).with(csrf());
	}

	// Se registra una cita activa directamente en la BD (la entidad Cita llega en otro sprint)
	private void agendarCita(LocalDate fecha, String inicio, String fin) {
		Long clientaId = jdbc.queryForObject(
				"INSERT INTO clientas (nombre, telefono) VALUES ('Ana', '7221234567') RETURNING id", Long.class);
		Long servicioId = jdbc.queryForObject(
				"INSERT INTO servicios (nombre, duracion_min, precio) VALUES ('Uñas', 60, 250) RETURNING id", Long.class);
		jdbc.update("""
				INSERT INTO citas (clienta_id, servicio_id, fecha, hora_inicio, hora_fin, precio)
				VALUES (?, ?, ?, CAST(? AS time), CAST(? AS time), 250)
				""", clientaId, servicioId, fecha, inicio, fin);
	}

	@Test
	void losBloqueosRequierenSesion() throws Exception {
		mvc.perform(get("/admin/bloqueos"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/login"));
	}

	@Test
	void laDuenaVeLaPantallaDeBloqueos() throws Exception {
		mvc.perform(get("/admin/bloqueos").with(user("duena").roles("ADMIN")))
				.andExpect(status().isOk())
				.andExpect(view().name("admin/bloqueos"))
				.andExpect(model().attributeExists("form", "bloqueos", "tipos", "hoy"));
	}

	@Test
	void seBloqueaUnDiaCompleto() throws Exception {
		LocalDate fecha = hoy.plusDays(7);
		// Se envían horas a propósito para comprobar que en un día completo se ignoran
		mvc.perform(crear()
				.param("tipo", "DIA")
				.param("fechaInicio", fecha.toString())
				.param("fechaFin", fecha.plusDays(3).toString())
				.param("horaInicio", "10:00")
				.param("horaFin", "12:00")
				.param("motivo", "  Día personal  "))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin/bloqueos"))
				.andExpect(flash().attributeExists("mensaje"))
				.andExpect(flash().attributeCount(1));

		Bloqueo bloqueo = bloqueoRepository.findAll().getFirst();
		assertThat(bloqueo.getTipo()).isEqualTo(TipoBloqueo.DIA);
		assertThat(bloqueo.getFechaFin()).isEqualTo(fecha);
		assertThat(bloqueo.getHoraInicio()).isNull();
		assertThat(bloqueo.getMotivo()).isEqualTo("Día personal");
	}

	@Test
	void seRegistranVacaciones() throws Exception {
		LocalDate salida = hoy.plusDays(20);
		LocalDate regreso = hoy.plusDays(27);
		mvc.perform(crear()
				.param("tipo", "RANGO")
				.param("fechaInicio", salida.toString())
				.param("fechaFin", regreso.toString()))
				.andExpect(status().is3xxRedirection());

		Bloqueo bloqueo = bloqueoRepository.findAll().getFirst();
		assertThat(bloqueo.getTipo()).isEqualTo(TipoBloqueo.RANGO);
		assertThat(bloqueo.getFechaInicio()).isEqualTo(salida);
		assertThat(bloqueo.getFechaFin()).isEqualTo(regreso);
		assertThat(bloqueo.getTotalDias()).isEqualTo(8);
	}

	@Test
	void vacacionesConRegresoAntesDeLaSalidaSeRechazan() throws Exception {
		mvc.perform(crear()
				.param("tipo", "RANGO")
				.param("fechaInicio", hoy.plusDays(10).toString())
				.param("fechaFin", hoy.plusDays(5).toString()))
				.andExpect(status().isOk())
				.andExpect(view().name("admin/bloqueos"))
				.andExpect(model().attributeHasFieldErrors("form", "rangoValido"));

		assertThat(bloqueoRepository.count()).isZero();
	}

	@Test
	void seBloqueanHorasEspecificas() throws Exception {
		LocalDate fecha = hoy.plusDays(3);
		mvc.perform(crear()
				.param("tipo", "HORAS")
				.param("fechaInicio", fecha.toString())
				.param("horaInicio", "13:00")
				.param("horaFin", "15:30"))
				.andExpect(status().is3xxRedirection());

		Bloqueo bloqueo = bloqueoRepository.findAll().getFirst();
		assertThat(bloqueo.getTipo()).isEqualTo(TipoBloqueo.HORAS);
		assertThat(bloqueo.getFechaFin()).isEqualTo(fecha);
		assertThat(bloqueo.getHoraInicio()).isEqualTo(LocalTime.of(13, 0));
		assertThat(bloqueo.getHoraFin()).isEqualTo(LocalTime.of(15, 30));
	}

	@Test
	void horasInvertidasSeRechazan() throws Exception {
		mvc.perform(crear()
				.param("tipo", "HORAS")
				.param("fechaInicio", hoy.plusDays(3).toString())
				.param("horaInicio", "16:00")
				.param("horaFin", "11:00"))
				.andExpect(status().isOk())
				.andExpect(model().attributeHasFieldErrors("form", "horasValidas"));
	}

	@Test
	void unaFechaPasadaSeRechaza() throws Exception {
		mvc.perform(crear()
				.param("tipo", "DIA")
				.param("fechaInicio", hoy.minusDays(1).toString()))
				.andExpect(status().isOk())
				.andExpect(model().attributeHasFieldErrors("form", "fechaInicio"));
	}

	@Test
	void seAvisaSiElBloqueoCaeSobreCitasAgendadas() throws Exception {
		LocalDate fecha = hoy.plusDays(5);
		agendarCita(fecha, "11:00", "12:00");

		mvc.perform(crear()
				.param("tipo", "RANGO")
				.param("fechaInicio", fecha.minusDays(1).toString())
				.param("fechaFin", fecha.plusDays(1).toString()))
				.andExpect(status().is3xxRedirection())
				.andExpect(flash().attributeExists("aviso"));

		// Se comprueba que la cita sigue activa: el bloqueo no la cancela (RN-09)
		String estado = jdbc.queryForObject("SELECT estado FROM citas", String.class);
		assertThat(estado).isEqualTo("PENDIENTE");
	}

	@Test
	void noSeAvisaSiLasHorasNoTocanLaCita() throws Exception {
		LocalDate fecha = hoy.plusDays(5);
		agendarCita(fecha, "11:00", "12:00");

		// Se bloquea justo cuando termina la cita: 12:00 a 13:00 no se traslapa
		mvc.perform(crear()
				.param("tipo", "HORAS")
				.param("fechaInicio", fecha.toString())
				.param("horaInicio", "12:00")
				.param("horaFin", "13:00"))
				.andExpect(status().is3xxRedirection())
				.andExpect(flash().attributeCount(1));
	}

	@Test
	void seEliminaUnBloqueo() throws Exception {
		Bloqueo bloqueo = bloqueoRepository.save(
				new Bloqueo(TipoBloqueo.DIA, hoy.plusDays(2), hoy.plusDays(2), null, null, null));

		mvc.perform(post("/admin/bloqueos/{id}/eliminar", bloqueo.getId())
				.with(user("duena").roles("ADMIN")).with(csrf()))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin/bloqueos"));

		assertThat(bloqueoRepository.findById(bloqueo.getId())).isEmpty();
	}

	@Test
	void eliminarUnBloqueoInexistenteResponde404() throws Exception {
		mvc.perform(post("/admin/bloqueos/{id}/eliminar", 999999)
				.with(user("duena").roles("ADMIN")).with(csrf()))
				.andExpect(status().isNotFound());
	}

	@Test
	void seEncuentranLosBloqueosQueTocanUnaFecha() {
		LocalDate dia = hoy.plusDays(30);
		bloqueoRepository.save(new Bloqueo(TipoBloqueo.RANGO, dia.minusDays(2), dia.plusDays(2), null, null, "Vacaciones"));
		bloqueoRepository.save(new Bloqueo(TipoBloqueo.HORAS, dia, dia, LocalTime.of(9, 0), LocalTime.of(10, 0), null));
		bloqueoRepository.save(new Bloqueo(TipoBloqueo.DIA, dia.plusDays(5), dia.plusDays(5), null, null, null));

		List<Bloqueo> delDia = bloqueoRepository.findQueTocanLaFecha(dia);

		assertThat(delDia).extracting(Bloqueo::getTipo)
				.containsExactlyInAnyOrder(TipoBloqueo.RANGO, TipoBloqueo.HORAS);
	}
}
