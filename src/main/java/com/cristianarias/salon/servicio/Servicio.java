package com.cristianarias.salon.servicio;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Servicio que ofrece el salón (corte, tinte, manicure...).
 * Se mapea a la tabla "servicios" creada por la migración V1 de Flyway.
 */
@Entity
@Table(name = "servicios")
public class Servicio {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String nombre;

	@Column(length = 255)
	private String descripcion;

	// Se indica SMALLINT porque así está definida la columna en PostgreSQL
	@JdbcTypeCode(SqlTypes.SMALLINT)
	@Column(name = "duracion_min", nullable = false)
	private Integer duracionMin;

	// Se usa BigDecimal para manejar dinero sin errores de redondeo
	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal precio;

	@Column(nullable = false)
	private boolean activo = true;

	@Column(name = "creado_en", insertable = false, updatable = false)
	private OffsetDateTime creadoEn;

	@Column(name = "actualizado_en", insertable = false)
	private OffsetDateTime actualizadoEn;

	protected Servicio() {
	}

	public Servicio(String nombre, String descripcion, Integer duracionMin, BigDecimal precio) {
		this.nombre = nombre;
		this.descripcion = descripcion;
		this.duracionMin = duracionMin;
		this.precio = precio;
	}

	// Se registra la fecha de la última modificación
	@PreUpdate
	void alActualizar() {
		this.actualizadoEn = OffsetDateTime.now();
	}

	// Se actualizan los datos editables en un solo paso
	public void actualizar(String nombre, String descripcion, Integer duracionMin, BigDecimal precio) {
		this.nombre = nombre;
		this.descripcion = descripcion;
		this.duracionMin = duracionMin;
		this.precio = precio;
	}

	public Long getId() {
		return id;
	}

	public String getNombre() {
		return nombre;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public Integer getDuracionMin() {
		return duracionMin;
	}

	public BigDecimal getPrecio() {
		return precio;
	}

	public boolean isActivo() {
		return activo;
	}

	public void setActivo(boolean activo) {
		this.activo = activo;
	}

	public OffsetDateTime getCreadoEn() {
		return creadoEn;
	}

	public OffsetDateTime getActualizadoEn() {
		return actualizadoEn;
	}
}
