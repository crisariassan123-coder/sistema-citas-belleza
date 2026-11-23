package com.cristianarias.salon.servicio;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de la tabla "servicios".
 */
public interface ServicioRepository extends JpaRepository<Servicio, Long> {

	// Se listan primero los activos y luego por nombre (vista de la dueña)
	List<Servicio> findAllByOrderByActivoDescNombreAsc();

	// Se listan solo los activos (catálogo público)
	List<Servicio> findByActivoTrueOrderByNombreAsc();
}
