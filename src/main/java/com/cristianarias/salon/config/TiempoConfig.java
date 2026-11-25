package com.cristianarias.salon.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Reloj de la aplicación en la zona horaria del salón.
 * Se usa para saber qué día es "hoy" sin depender de la zona del servidor
 * (en la nube suele ser UTC y a las 18:00 de Toluca ya sería el día siguiente).
 */
@Configuration
public class TiempoConfig {

	@Bean
	public Clock clock(@Value("${salon.zona-horaria}") String zonaHoraria) {
		return Clock.system(ZoneId.of(zonaHoraria));
	}
}
