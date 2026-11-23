package com.cristianarias.salon.servicio;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reglas de negocio de los servicios del salón.
 * Los controladores no acceden al repositorio directamente: siempre pasan por esta capa.
 */
@Service
@Transactional(readOnly = true)
public class ServicioService {

	private final ServicioRepository servicioRepository;

	public ServicioService(ServicioRepository servicioRepository) {
		this.servicioRepository = servicioRepository;
	}

	// Se devuelven todos los servicios para el panel de la dueña
	public List<Servicio> listarTodos() {
		return servicioRepository.findAllByOrderByActivoDescNombreAsc();
	}

	// Se devuelven solo los servicios activos para el catálogo público (HU-04)
	public List<Servicio> listarActivos() {
		return servicioRepository.findByActivoTrueOrderByNombreAsc();
	}

	public Servicio obtener(Long id) {
		return servicioRepository.findById(id)
				.orElseThrow(() -> new ServicioNoEncontradoException(id));
	}

	@Transactional
	public Servicio crear(ServicioForm form) {
		Servicio servicio = new Servicio(limpiar(form.getNombre()), limpiar(form.getDescripcion()),
				form.getDuracionMin(), form.getPrecio());
		return servicioRepository.save(servicio);
	}

	@Transactional
	public Servicio actualizar(Long id, ServicioForm form) {
		Servicio servicio = obtener(id);
		servicio.actualizar(limpiar(form.getNombre()), limpiar(form.getDescripcion()),
				form.getDuracionMin(), form.getPrecio());
		// Se guarda en automático al terminar la transacción (dirty checking de JPA)
		return servicio;
	}

	// Se desactiva o reactiva el servicio; nunca se elimina para conservar el historial de citas (RN-10)
	@Transactional
	public Servicio cambiarEstado(Long id, boolean activo) {
		Servicio servicio = obtener(id);
		servicio.setActivo(activo);
		return servicio;
	}

	// Se quitan espacios sobrantes y se guarda null en lugar de cadenas vacías
	private String limpiar(String texto) {
		if (texto == null) {
			return null;
		}
		String limpio = texto.strip();
		return limpio.isEmpty() ? null : limpio;
	}
}
