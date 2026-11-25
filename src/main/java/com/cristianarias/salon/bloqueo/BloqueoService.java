package com.cristianarias.salon.bloqueo;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reglas de negocio de los bloqueos de agenda (HU-06, HU-07 y HU-08).
 */
@Service
@Transactional(readOnly = true)
public class BloqueoService {

	private final BloqueoRepository bloqueoRepository;
	private final Clock clock;

	public BloqueoService(BloqueoRepository bloqueoRepository, Clock clock) {
		this.bloqueoRepository = bloqueoRepository;
		this.clock = clock;
	}

	public LocalDate hoy() {
		return LocalDate.now(clock);
	}

	public List<Bloqueo> listarVigentes() {
		return bloqueoRepository.findByFechaFinGreaterThanEqualOrderByFechaInicioAscHoraInicioAsc(hoy());
	}

	public List<Bloqueo> bloqueosDelDia(LocalDate fecha) {
		return bloqueoRepository.findQueTocanLaFecha(fecha);
	}

	// Se ajusta la forma del bloqueo según su tipo, igual que exige la restricción bloqueos_forma_valida:
	// DIA y HORAS son de un solo día, y solo HORAS lleva horas
	@Transactional
	public Bloqueo crear(BloqueoForm form) {
		TipoBloqueo tipo = form.getTipo();
		LocalDate fechaFin = tipo == TipoBloqueo.RANGO ? form.getFechaFin() : form.getFechaInicio();
		boolean conHoras = tipo == TipoBloqueo.HORAS;

		Bloqueo bloqueo = new Bloqueo(tipo, form.getFechaInicio(), fechaFin,
				conHoras ? form.getHoraInicio() : null,
				conHoras ? form.getHoraFin() : null,
				limpiar(form.getMotivo()));
		return bloqueoRepository.save(bloqueo);
	}

	// Se cuentan las citas activas que quedan dentro del bloqueo para avisar a la dueña (RN-09).
	// Las citas no se cancelan solas: ella decide si reagenda o cancela
	public long contarCitasAfectadas(Bloqueo bloqueo) {
		if (bloqueo.isTodoElDia()) {
			return bloqueoRepository.contarCitasActivasEntre(bloqueo.getFechaInicio(), bloqueo.getFechaFin());
		}
		return bloqueoRepository.contarCitasActivasEnHoras(bloqueo.getFechaInicio(), bloqueo.getHoraInicio(),
				bloqueo.getHoraFin());
	}

	@Transactional
	public Bloqueo eliminar(Long id) {
		Bloqueo bloqueo = bloqueoRepository.findById(id).orElseThrow(() -> new BloqueoNoEncontradoException(id));
		bloqueoRepository.delete(bloqueo);
		return bloqueo;
	}

	// Se guarda null en lugar de texto vacío para no llenar la BD de cadenas en blanco
	private static String limpiar(String texto) {
		if (texto == null || texto.isBlank()) {
			return null;
		}
		return texto.strip();
	}
}
