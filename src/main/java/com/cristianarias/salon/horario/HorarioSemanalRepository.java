package com.cristianarias.salon.horario;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de la tabla "horario_semanal".
 */
public interface HorarioSemanalRepository extends JpaRepository<HorarioSemanal, Long> {

	// Se devuelve la semana ordenada de lunes a domingo
	List<HorarioSemanal> findAllByOrderByDiaSemanaAsc();

	// Se usará en el cálculo de disponibilidad (HU-09) para saber el horario de una fecha
	Optional<HorarioSemanal> findByDiaSemana(Integer diaSemana);
}
