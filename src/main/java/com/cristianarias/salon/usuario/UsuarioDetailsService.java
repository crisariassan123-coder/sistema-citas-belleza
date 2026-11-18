package com.cristianarias.salon.usuario;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Puente entre Spring Security y la tabla "usuarios".
 * Spring Security llama a este servicio cuando alguien intenta iniciar sesión.
 */
@Service
public class UsuarioDetailsService implements UserDetailsService {

	private final UsuarioRepository usuarioRepository;

	public UsuarioDetailsService(UsuarioRepository usuarioRepository) {
		this.usuarioRepository = usuarioRepository;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		Usuario usuario = usuarioRepository.findByUsuario(username)
				// Se usa un mensaje genérico para no revelar qué usuarios existen
				.orElseThrow(() -> new UsernameNotFoundException("Credenciales inválidas"));

		// Se convierte la entidad al formato que entiende Spring Security
		return User.withUsername(usuario.getUsuario())
				.password(usuario.getPasswordHash())
				.roles(usuario.getRol())
				.disabled(!usuario.isActivo())
				.build();
	}
}
