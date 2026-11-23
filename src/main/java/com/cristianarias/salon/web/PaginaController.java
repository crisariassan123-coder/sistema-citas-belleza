package com.cristianarias.salon.web;

import java.security.Principal;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.cristianarias.salon.servicio.ServicioService;

/**
 * Rutas de las páginas principales del sitio público y del panel.
 */
@Controller
public class PaginaController {

	// Se limita el número de servicios que se destacan en la página de inicio
	private static final int SERVICIOS_DESTACADOS = 3;

	private final ServicioService servicioService;

	public PaginaController(ServicioService servicioService) {
		this.servicioService = servicioService;
	}

	@GetMapping("/")
	public String inicio(Model model) {
		model.addAttribute("servicios", servicioService.listarActivos().stream()
				.limit(SERVICIOS_DESTACADOS)
				.toList());
		return "index";
	}

	// Se muestra el catálogo completo de servicios activos (HU-04)
	@GetMapping("/servicios")
	public String servicios(Model model) {
		model.addAttribute("servicios", servicioService.listarActivos());
		return "servicios";
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
