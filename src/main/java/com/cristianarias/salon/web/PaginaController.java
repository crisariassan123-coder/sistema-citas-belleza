package com.cristianarias.salon.web;

import java.security.Principal;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Rutas de las páginas principales.
 * El inicio y el panel son provisionales; se completan en las siguientes historias.
 */
@Controller
public class PaginaController {

	@GetMapping("/")
	public String inicio() {
		return "index";
	}

	@GetMapping("/login")
	public String login() {
		return "login";
	}

	@GetMapping("/admin")
	public String panel(Principal principal, Model model) {
		// Se muestra el usuario que inició sesión
		model.addAttribute("usuario", principal.getName());
		return "admin/panel";
	}
}
