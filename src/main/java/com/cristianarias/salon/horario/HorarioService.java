package com.cristianarias.salon.horario;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reglas de negocio del horario semanal de la dueña (HU-05).
 */
@Service
@Transactional(readOnly = true)
public class HorarioService {

	private final HorarioSemanalRepository horarioRepository;

	public HorarioService(HorarioSemanalRepository horarioRepository) {
		this.horarioRepository = horarioRepository;
	}

	public List<HorarioSemanal> obtenerSemana() {
		return horarioRepository.findAllByOrderByDiaSemanaAsc();
	}

	// Se guardan los 7 días en una sola transacción: si uno falla, no se guarda ninguno
	@Transactional
	public void guardar(HorarioForm form) {
		Map<Integer, HorarioSemanal> porDia = horarioRepository.findAll().stream()
				.collect(Collectors.toMap(HorarioSemanal::getDiaSemana, Function.identity()));

		for (DiaForm dia : form.getDias()) {
			HorarioSemanal horario = porDia.get(dia.getDiaSemana());
			if (horario == null) {
				throw new IllegalArgumentException("Día de la semana inválido: " + dia.getDiaSemana());
			}
			horario.actualizar(dia.isLaborable(), dia.getHoraInicio(), dia.getHoraFin());
		}
	}
}
