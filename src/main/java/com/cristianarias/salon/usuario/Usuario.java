package com.cristianarias.salon.usuario;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Cuenta de acceso al panel de administración (la dueña del salón).
 * Se mapea a la tabla "usuarios" creada por la migración V1 de Flyway.
 */
@Entity
@Table(name = "usuarios")
public class Usuario {

	// Se delega la generación del id a PostgreSQL (columna BIGSERIAL)
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String nombre;

	@Column(nullable = false, unique = true, length = 50)
	private String usuario;

	// Se guarda solo el hash BCrypt, nunca la contraseña en texto plano
	@Column(name = "password_hash", nullable = false, length = 100)
	private String passwordHash;

	@Column(nullable = false, length = 20)
	private String rol = "ADMIN";

	@Column(nullable = false)
	private boolean activo = true;

	// Se deja que la base de datos asigne la fecha con su valor por defecto now()
	@Column(name = "creado_en", insertable = false, updatable = false)
	private OffsetDateTime creadoEn;

	// Se requiere un constructor sin argumentos para JPA
	protected Usuario() {
	}

	public Usuario(String nombre, String usuario, String passwordHash) {
		this.nombre = nombre;
		this.usuario = usuario;
		this.passwordHash = passwordHash;
	}

	public Long getId() {
		return id;
	}

	public String getNombre() {
		return nombre;
	}

	public String getUsuario() {
		return usuario;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public String getRol() {
		return rol;
	}

	public boolean isActivo() {
		return activo;
	}

	public OffsetDateTime getCreadoEn() {
		return creadoEn;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public void setActivo(boolean activo) {
		this.activo = activo;
	}
}
