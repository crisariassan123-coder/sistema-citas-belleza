package com.cristianarias.salon.servicio;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.validation.Valid;

/**
 * Pantallas del panel para administrar los servicios (HU-03).
 * La ruta /admin/** ya está protegida por SecurityConfig con el rol ADMIN.
 */
@Controller
@RequestMapping("/admin/servicios")
public class AdminServicioController {

	private static final String VISTA_FORM = "admin/servicios/form";

	private final ServicioService servicioService;

	public AdminServicioController(ServicioService servicioService) {
		this.servicioService = servicioService;
	}

	@GetMapping
	public String lista(Model model) {
		model.addAttribute("servicios", servicioService.listarTodos());
		return "admin/servicios/lista";
	}

	@GetMapping("/nuevo")
	public String nuevo(Model model) {
		model.addAttribute("form", new ServicioForm());
		return VISTA_FORM;
	}

	@PostMapping
	public String crear(@Valid @ModelAttribute("form") ServicioForm form, BindingResult resultado,
			RedirectAttributes redirect) {
		// Se regresa al formulario con los errores si la validación falla
		if (resultado.hasErrors()) {
			return VISTA_FORM;
		}
		Servicio servicio = servicioService.crear(form);
		redirect.addFlashAttribute("mensaje", "Se agregó el servicio «" + servicio.getNombre() + "».");
		return "redirect:/admin/servicios";
	}

	@GetMapping("/{id}/editar")
	public String editar(@PathVariable Long id, Model model) {
		model.addAttribute("form", ServicioForm.desde(servicioService.obtener(id)));
		model.addAttribute("servicioId", id);
		return VISTA_FORM;
	}

	@PostMapping("/{id}")
	public String actualizar(@PathVariable Long id, @Valid @ModelAttribute("form") ServicioForm form,
			BindingResult resultado, Model model, RedirectAttributes redirect) {
		if (resultado.hasErrors()) {
			model.addAttribute("servicioId", id);
			return VISTA_FORM;
		}
		Servicio servicio = servicioService.actualizar(id, form);
		redirect.addFlashAttribute("mensaje", "Se guardaron los cambios de «" + servicio.getNombre() + "».");
		return "redirect:/admin/servicios";
	}

	@PostMapping("/{id}/desactivar")
	public String desactivar(@PathVariable Long id, RedirectAttributes redirect) {
		Servicio servicio = servicioService.cambiarEstado(id, false);
		redirect.addFlashAttribute("mensaje", "«" + servicio.getNombre() + "» ya no se muestra a las clientas.");
		return "redirect:/admin/servicios";
	}

	@PostMapping("/{id}/activar")
	public String activar(@PathVariable Long id, RedirectAttributes redirect) {
		Servicio servicio = servicioService.cambiarEstado(id, true);
		redirect.addFlashAttribute("mensaje", "«" + servicio.getNombre() + "» vuelve a estar disponible.");
		return "redirect:/admin/servicios";
	}
}
