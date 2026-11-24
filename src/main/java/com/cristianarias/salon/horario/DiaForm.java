package com.cristianarias.salon.horario;

import java.time.LocalTime;

import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Datos de un día dentro del formulario del horario semanal.
 */
public class DiaForm {

	private static final String[] NOMBRES = { "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo" };

	@NotNull
	@Min(1)
	@Max(7)
	private Integer diaSemana;

	private boolean laborable;

	// Se recibe en formato 24 horas, igual que envía el campo <input type="time">
	@DateTimeFormat(pattern = "HH:mm")
	private LocalTime horaInicio;

	@DateTimeFormat(pattern = "HH:mm")
	private LocalTime horaFin;

	// Se exige un rango válido solo en los días que la dueña trabaja (igual que la restricción de la BD)
	@AssertTrue(message = "Indica una hora de inicio menor que la hora de fin")
	public boolean isHorasValidas() {
		if (!laborable) {
			return true;
		}
		return horaInicio != null && horaFin != null && horaInicio.isBefore(horaFin);
	}

	// Se obtiene el nombre del día para mostrarlo en la pantalla
	public String getNombre() {
		return diaSemana == null ? "" : NOMBRES[diaSemana - 1];
	}

	public static DiaForm desde(HorarioSemanal horario) {
		DiaForm dia = new DiaForm();
		dia.setDiaSemana(horario.getDiaSemana());
		dia.setLaborable(horario.isLaborable());
		dia.setHoraInicio(horario.getHoraInicio());
		dia.setHoraFin(horario.getHoraFin());
		return dia;
	}

	public Integer getDiaSemana() {
		return diaSemana;
	}

	public void setDiaSemana(Integer diaSemana) {
		this.diaSemana = diaSemana;
	}

	public boolean isLaborable() {
		return laborable;
	}

	public void setLaborable(boolean laborable) {
		this.laborable = laborable;
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
}
