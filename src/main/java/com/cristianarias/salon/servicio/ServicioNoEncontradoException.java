package com.cristianarias.salon.servicio;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Se lanza cuando se solicita un servicio que no existe; Spring responde con 404.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ServicioNoEncontradoException extends RuntimeException {

	public ServicioNoEncontradoException(Long id) {
		super("No existe el servicio con id " + id);
	}
}
