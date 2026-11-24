package com.cristianarias.salon.horario;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/**
 * Pruebas de HU-05 (horario semanal).
 * Se parte de los 7 días que crea la migración V1 y cada prueba se revierte al terminar.
 */
@SpringBootTest
@Transactional
class HorarioTests {

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private HorarioSemanalRepository horarioRepository;

	private MockMvc mvc;

	@BeforeEach
	void configurar() {
		mvc = MockMvcBuilders.webAppContextSetup(context)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
	}

	// Se arma la petición con los 7 días (lunes a sábado de 10 a 19 y domingo libre)
	// y se reemplazan solo los campos indicados en "cambios"
	private MockHttpServletRequestBuilder semana(Map<String, String> cambios) {
		Map<String, String> campos = new LinkedHashMap<>();
		for (int i = 0; i < 7; i++) {
			int dia = i + 1;
			campos.put("dias[" + i + "].diaSemana", String.valueOf(dia));
			campos.put("dias[" + i + "].laborable", dia == 7 ? "false" : "true");
			campos.put("dias[" + i + "].horaInicio", "10:00");
			campos.put("dias[" + i + "].horaFin", "19:00");
		}
		campos.putAll(cambios);

		MockHttpServletRequestBuilder peticion = post("/admin/horario")
				.with(user("duena").roles("ADMIN")).with(csrf());
		campos.forEach(peticion::param);
		return peticion;
	}

	@Test
	void laMigracionCreaLosSieteDias() {
		assertThat(horarioRepository.findAllByOrderByDiaSemanaAsc())
				.extracting(HorarioSemanal::getDiaSemana)
				.containsExactly(1, 2, 3, 4, 5, 6, 7);
	}

	@Test
	void elHorarioRequiereSesion() throws Exception {
		mvc.perform(get("/admin/horario"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/login"));
	}

	@Test
	void laDuenaVeSuHorario() throws Exception {
		mvc.perform(get("/admin/horario").with(user("duena").roles("ADMIN")))
				.andExpect(status().isOk())
				.andExpect(view().name("admin/horario"))
				.andExpect(model().attributeExists("form"));
	}

	@Test
	void seGuardaLaSemanaCompleta() throws Exception {
		// Se cambia el sábado a 09:00-14:00 y se marca el domingo como laborable
		mvc.perform(semana(Map.of(
				"dias[5].horaInicio", "09:00",
				"dias[5].horaFin", "14:00",
				"dias[6].laborable", "true")))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin/horario"));

		horarioRepository.flush();
		HorarioSemanal sabado = horarioRepository.findByDiaSemana(6).orElseThrow();
		HorarioSemanal domingo = horarioRepository.findByDiaSemana(7).orElseThrow();
		assertThat(sabado.getHoraInicio()).isEqualTo(LocalTime.of(9, 0));
		assertThat(sabado.getHoraFin()).isEqualTo(LocalTime.of(14, 0));
		assertThat(domingo.isLaborable()).isTrue();
	}

	@Test
	void unaHoraDeInicioMayorQueLaDeFinSeRechaza() throws Exception {
		mvc.perform(semana(Map.of(
				"dias[0].horaInicio", "18:00",
				"dias[0].horaFin", "10:00")))
				.andExpect(status().isOk())
				.andExpect(view().name("admin/horario"))
				.andExpect(model().attributeHasFieldErrors("form", "dias[0].horasValidas"));

		// Se comprueba que no se guardó nada
		HorarioSemanal lunes = horarioRepository.findByDiaSemana(1).orElseThrow();
		assertThat(lunes.getHoraInicio()).isEqualTo(LocalTime.of(10, 0));
	}

	@Test
	void unDiaLaborableSinHorasSeRechaza() throws Exception {
		mvc.perform(semana(Map.of(
				"dias[2].horaInicio", "",
				"dias[2].horaFin", "")))
				.andExpect(status().isOk())
				.andExpect(model().attributeHasFieldErrors("form", "dias[2].horasValidas"));
	}

	@Test
	void unDiaLibrePuedeQuedarSinHoras() throws Exception {
		mvc.perform(semana(Map.of(
				"dias[6].horaInicio", "",
				"dias[6].horaFin", "")))
				.andExpect(status().is3xxRedirection());
	}
}
