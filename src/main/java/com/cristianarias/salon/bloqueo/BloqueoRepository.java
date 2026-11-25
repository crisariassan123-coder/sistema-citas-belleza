package com.cristianarias.salon.bloqueo;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BloqueoRepository extends JpaRepository<Bloqueo, Long> {

	// Se listan los bloqueos que aún no terminan (los pasados ya no le sirven a la dueña)
	List<Bloqueo> findByFechaFinGreaterThanEqualOrderByFechaInicioAscHoraInicioAsc(LocalDate desde);

	// Se obtienen los bloqueos que tocan una fecha; lo usará el cálculo de disponibilidad (HU-09)
	@Query("""
			SELECT b FROM Bloqueo b
			WHERE b.fechaInicio <= :fecha AND b.fechaFin >= :fecha
			ORDER BY b.horaInicio
			""")
	List<Bloqueo> findQueTocanLaFecha(@Param("fecha") LocalDate fecha);

	// --- Aviso de citas afectadas (RN-09) ---
	// Se consulta la tabla citas con SQL nativo porque la entidad Cita se crea en un sprint posterior

	@Query(value = """
			SELECT COUNT(*) FROM citas
			WHERE estado IN ('PENDIENTE', 'CONFIRMADA')
			  AND fecha BETWEEN :inicio AND :fin
			""", nativeQuery = true)
	long contarCitasActivasEntre(@Param("inicio") LocalDate inicio, @Param("fin") LocalDate fin);

	// Se considera traslape cuando la cita empieza antes de que acabe el bloqueo y termina después de que empieza
	@Query(value = """
			SELECT COUNT(*) FROM citas
			WHERE estado IN ('PENDIENTE', 'CONFIRMADA')
			  AND fecha = :fecha
			  AND hora_inicio < :horaFin
			  AND hora_fin > :horaInicio
			""", nativeQuery = true)
	long contarCitasActivasEnHoras(@Param("fecha") LocalDate fecha, @Param("horaInicio") LocalTime horaInicio,
			@Param("horaFin") LocalTime horaFin);
}
