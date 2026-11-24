package com.cristianarias.salon.horario;

import java.time.LocalTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Horario de trabajo de la dueña para un día de la semana.
 * Existe un registro por día (1 = lunes ... 7 = domingo); los 7 se crean en la migración V1.
 */
@Entity
@Table(name = "horario_semanal")
public class HorarioSemanal {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// Se sigue la norma ISO-8601, igual que java.time.DayOfWeek
	@JdbcTypeCode(SqlTypes.SMALLINT)
	@Column(name = "dia_semana", nullable = false, unique = true)
	private Integer diaSemana;

	@Column(nullable = false)
	private boolean laborable;

	@Column(name = "hora_inicio")
	private LocalTime horaInicio;

	@Column(name = "hora_fin")
	private LocalTime horaFin;

	protected HorarioSemanal() {
	}

	public HorarioSemanal(Integer diaSemana, boolean laborable, LocalTime horaInicio, LocalTime horaFin) {
		this.diaSemana = diaSemana;
		this.laborable = laborable;
		this.horaInicio = horaInicio;
		this.horaFin = horaFin;
	}

	// Se actualiza el día completo en un solo paso
	public void actualizar(boolean laborable, LocalTime horaInicio, LocalTime horaFin) {
		this.laborable = laborable;
		this.horaInicio = horaInicio;
		this.horaFin = horaFin;
	}

	public Long getId() {
		return id;
	}

	public Integer getDiaSemana() {
		return diaSemana;
	}

	public boolean isLaborable() {
		return laborable;
	}

	public LocalTime getHoraInicio() {
		return horaInicio;
	}

	public LocalTime getHoraFin() {
		return horaFin;
	}
}
