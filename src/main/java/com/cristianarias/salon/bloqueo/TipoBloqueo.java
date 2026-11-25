package com.cristianarias.salon.bloqueo;

/**
 * Tipos de bloqueo de la agenda. Coinciden con la restricción bloqueos_tipo_valido de la BD.
 */
public enum TipoBloqueo {

	DIA("Día completo", "Un día que no trabajas", "bi-calendar-x"),
	RANGO("Vacaciones", "Varios días seguidos", "bi-airplane"),
	HORAS("Unas horas", "Solo una parte del día", "bi-clock-history");

	private final String nombre;
	private final String ayuda;
	private final String icono;

	TipoBloqueo(String nombre, String ayuda, String icono) {
		this.nombre = nombre;
		this.ayuda = ayuda;
		this.icono = icono;
	}

	public String getNombre() {
		return nombre;
	}

	public String getAyuda() {
		return ayuda;
	}

	public String getIcono() {
		return icono;
	}
}
