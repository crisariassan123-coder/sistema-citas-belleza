package com.cristianarias.salon.horario;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.validation.Valid;

/**
 * Pantalla del panel para definir el horario semanal (HU-05).
 */
@Controller
@RequestMapping("/admin/horario")
public class AdminHorarioController {

	private static final String VISTA = "admin/horario";

	private final HorarioService horarioService;

	public AdminHorarioController(HorarioService horarioService) {
		this.horarioService = horarioService;
	}

	@GetMapping
	public String ver(Model model) {
		model.addAttribute("form", HorarioForm.desde(horarioService.obtenerSemana()));
		return VISTA;
	}

	@PostMapping
	public String guardar(@Valid @ModelAttribute("form") HorarioForm form, BindingResult resultado,
			RedirectAttributes redirect) {
		// Se regresa a la pantalla con los errores marcados en cada día
		if (resultado.hasErrors()) {
			return VISTA;
		}
		horarioService.guardar(form);
		redirect.addFlashAttribute("mensaje", "Se guardó tu horario semanal.");
		return "redirect:/admin/horario";
	}
}
