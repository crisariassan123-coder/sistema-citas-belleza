package com.cristianarias.salon.servicio;

import java.math.BigDecimal;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos que captura el formulario de alta y edición de servicios.
 * Se separa de la entidad para validar la entrada sin exponer el modelo de persistencia.
 */
public class ServicioForm {

	@NotBlank(message = "Escribe el nombre del servicio")
	@Size(max = 100, message = "El nombre admite máximo 100 caracteres")
	private String nombre;

	@Size(max = 255, message = "La descripción admite máximo 255 caracteres")
	private String descripcion;

	@NotNull(message = "Indica la duración")
	@Min(value = 15, message = "La duración mínima es de 15 minutos")
	@Max(value = 600, message = "La duración máxima es de 600 minutos")
	private Integer duracionMin;

	@NotNull(message = "Indica el precio")
	@DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
	@Digits(integer = 8, fraction = 2, message = "El precio admite hasta 2 decimales")
	private BigDecimal precio;

	// Se valida la regla RN-01: la duración debe ser múltiplo de 15 minutos
	@AssertTrue(message = "La duración debe ser múltiplo de 15 minutos (15, 30, 45, 60...)")
	public boolean isDuracionMultiploDe15() {
		return duracionMin == null || duracionMin % 15 == 0;
	}

	// Se crea un formulario prellenado a partir de un servicio existente (para editar)
	public static ServicioForm desde(Servicio servicio) {
		ServicioForm form = new ServicioForm();
		form.setNombre(servicio.getNombre());
		form.setDescripcion(servicio.getDescripcion());
		form.setDuracionMin(servicio.getDuracionMin());
		form.setPrecio(servicio.getPrecio());
		return form;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}

	public Integer getDuracionMin() {
		return duracionMin;
	}

	public void setDuracionMin(Integer duracionMin) {
		this.duracionMin = duracionMin;
	}

	public BigDecimal getPrecio() {
		return precio;
	}

	public void setPrecio(BigDecimal precio) {
		this.precio = precio;
	}
}
