package com.cristianarias.salon.bloqueo;

import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos que captura la dueña para crear un bloqueo.
 * Un solo formulario sirve para los tres tipos; según el tipo se exigen unos campos u otros.
 */
public class BloqueoForm {

	@NotNull(message = "Elige qué quieres bloquear")
	private TipoBloqueo tipo = TipoBloqueo.DIA;

	// Se recibe en formato yyyy-MM-dd, igual que envía el campo <input type="date">
	@NotNull(message = "Indica la fecha")
	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	private LocalDate fechaInicio;

	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	private LocalDate fechaFin;

	@DateTimeFormat(pattern = "HH:mm")
	private LocalTime horaInicio;

	@DateTimeFormat(pattern = "HH:mm")
	private LocalTime horaFin;

	@Size(max = 150, message = "Usa máximo 150 caracteres")
	private String motivo;

	// Se exige la fecha final solo en vacaciones, y que no sea anterior a la inicial (HU-07)
	@AssertTrue(message = "La fecha de regreso debe ser igual o posterior a la de salida")
	public boolean isRangoValido() {
		if (tipo != TipoBloqueo.RANGO || fechaInicio == null) {
			return true;
		}
		return fechaFin != null && !fechaFin.isBefore(fechaInicio);
	}

	// Se exigen las horas solo al bloquear una parte del día (HU-08)
	@AssertTrue(message = "Indica una hora de inicio menor que la hora de fin")
	public boolean isHorasValidas() {
		if (tipo != TipoBloqueo.HORAS) {
			return true;
		}
		return horaInicio != null && horaFin != null && horaInicio.isBefore(horaFin);
	}

	public TipoBloqueo getTipo() {
		return tipo;
	}

	public void setTipo(TipoBloqueo tipo) {
		this.tipo = tipo;
	}

	public LocalDate getFechaInicio() {
		return fechaInicio;
	}

	public void setFechaInicio(LocalDate fechaInicio) {
		this.fechaInicio = fechaInicio;
	}

	public LocalDate getFechaFin() {
		return fechaFin;
	}

	public void setFechaFin(LocalDate fechaFin) {
		this.fechaFin = fechaFin;
	}

	public LocalTime getHoraInicio() {
		return horaInicio;
	}

	public void setHoraInicio(LocalTime horaInicio) {
		this.horaInicio = horaInicio;
	}

	public LocalTime getHoraFin() {
		return horaFin;
	}

	public void setHoraFin(LocalTime horaFin) {
		this.horaFin = horaFin;
	}

	public String getMotivo() {
		return motivo;
	}

	public void setMotivo(String motivo) {
		this.motivo = motivo;
	}
}
