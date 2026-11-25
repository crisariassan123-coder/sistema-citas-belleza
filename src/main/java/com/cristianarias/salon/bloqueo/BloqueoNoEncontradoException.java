package com.cristianarias.salon.bloqueo;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// Se responde 404 cuando se pide un bloqueo que no existe (por ejemplo, ya eliminado)
@ResponseStatus(HttpStatus.NOT_FOUND)
public class BloqueoNoEncontradoException extends RuntimeException {

	public BloqueoNoEncontradoException(Long id) {
		super("No existe el bloqueo con id " + id);
	}
}
