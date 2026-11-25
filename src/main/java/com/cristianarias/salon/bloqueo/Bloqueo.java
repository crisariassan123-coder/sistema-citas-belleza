package com.cristianarias.salon.bloqueo;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Periodo en el que la dueña no atiende: un día, unas vacaciones o unas horas de un día.
 */
@Entity
@Table(name = "bloqueos")
public class Bloqueo {

	private static final Locale ES = Locale.forLanguageTag("es-MX");
	private static final DateTimeFormatter FECHA_LARGA = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy", ES);
	private static final DateTimeFormatter FECHA_CORTA = DateTimeFormatter.ofPattern("d 'de' MMMM", ES);
	private static final DateTimeFormatter FECHA_MEDIA = DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", ES);
	private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// Se guarda el nombre del enum (DIA, RANGO, HORAS) en lugar de su posición
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private TipoBloqueo tipo;

	@Column(name = "fecha_inicio", nullable = false)
	private LocalDate fechaInicio;

	@Column(name = "fecha_fin", nullable = false)
	private LocalDate fechaFin;

	@Column(name = "hora_inicio")
	private LocalTime horaInicio;

	@Column(name = "hora_fin")
	private LocalTime horaFin;

	@Column(length = 150)
	private String motivo;

	// Se deja que PostgreSQL asigne la fecha de creación (DEFAULT now())
	@Column(name = "creado_en", insertable = false, updatable = false)
	private OffsetDateTime creadoEn;

	protected Bloqueo() {
	}

	public Bloqueo(TipoBloqueo tipo, LocalDate fechaInicio, LocalDate fechaFin, LocalTime horaInicio,
			LocalTime horaFin, String motivo) {
		this.tipo = tipo;
		this.fechaInicio = fechaInicio;
		this.fechaFin = fechaFin;
		this.horaInicio = horaInicio;
		this.horaFin = horaFin;
		this.motivo = motivo;
	}

	// Se indica si el bloqueo ocupa el día entero (DIA y RANGO) o solo unas horas (HORAS)
	public boolean isTodoElDia() {
		return tipo != TipoBloqueo.HORAS;
	}

	// --- Textos para la pantalla (se generan aquí para no repetir el formato en la vista) ---

	public String getFechasTexto() {
		if (fechaInicio.equals(fechaFin)) {
			String texto = FECHA_LARGA.format(fechaInicio);
			return Character.toUpperCase(texto.charAt(0)) + texto.substring(1);
		}
		return "Del " + FECHA_CORTA.format(fechaInicio) + " al " + FECHA_MEDIA.format(fechaFin);
	}

	public String getHorasTexto() {
		return isTodoElDia() ? "Todo el día" : HORA.format(horaInicio) + " a " + HORA.format(horaFin);
	}

	// Se cuentan los días incluyendo el primero y el último
	public long getTotalDias() {
		return ChronoUnit.DAYS.between(fechaInicio, fechaFin) + 1;
	}

	public Long getId() {
		return id;
	}

	public TipoBloqueo getTipo() {
		return tipo;
	}

	public LocalDate getFechaInicio() {
		return fechaInicio;
	}

	public LocalDate getFechaFin() {
		return fechaFin;
	}

	public LocalTime getHoraInicio() {
		return horaInicio;
	}

	public LocalTime getHoraFin() {
		return horaFin;
	}

	public String getMotivo() {
		return motivo;
	}

	public OffsetDateTime getCreadoEn() {
		return creadoEn;
	}
}
