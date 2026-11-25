package com.cristianarias.salon.bloqueo;

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
 * Pantalla del panel para bloquear días, vacaciones u horas (HU-06, HU-07 y HU-08).
 */
@Controller
@RequestMapping("/admin/bloqueos")
public class AdminBloqueoController {

	private static final String VISTA = "admin/bloqueos";

	private final BloqueoService bloqueoService;

	public AdminBloqueoController(BloqueoService bloqueoService) {
		this.bloqueoService = bloqueoService;
	}

	// Se agregan a todas las respuestas de este controlador los tipos para los botones de selección
	@ModelAttribute("tipos")
	public TipoBloqueo[] tipos() {
		return TipoBloqueo.values();
	}

	@GetMapping
	public String ver(Model model) {
		model.addAttribute("form", new BloqueoForm());
		return mostrar(model);
	}

	@PostMapping
	public String crear(@Valid @ModelAttribute("form") BloqueoForm form, BindingResult resultado, Model model,
			RedirectAttributes redirect) {
		// Se rechazan fechas pasadas; "hoy" se toma en la zona horaria del salón
		if (form.getFechaInicio() != null && form.getFechaInicio().isBefore(bloqueoService.hoy())) {
			resultado.rejectValue("fechaInicio", "fechaPasada", "Elige hoy o una fecha futura");
		}
		if (resultado.hasErrors()) {
			return mostrar(model);
		}

		Bloqueo bloqueo = bloqueoService.crear(form);
		redirect.addFlashAttribute("mensaje", "Listo, se bloqueó: " + bloqueo.getFechasTexto()
				+ (bloqueo.isTodoElDia() ? "." : ", de " + bloqueo.getHorasTexto() + "."));

		// Se avisa si el bloqueo cae sobre citas ya agendadas (RN-09)
		long citas = bloqueoService.contarCitasAfectadas(bloqueo);
		if (citas > 0) {
			redirect.addFlashAttribute("aviso", citas == 1
					? "Ojo: ya tienes 1 cita agendada en ese periodo. No se canceló; contacta a tu clienta para reagendar."
					: "Ojo: ya tienes " + citas + " citas agendadas en ese periodo. No se cancelaron; contacta a tus clientas para reagendar.");
		}
		return "redirect:/admin/bloqueos";
	}

	@PostMapping("/{id}/eliminar")
	public String eliminar(@PathVariable Long id, RedirectAttributes redirect) {
		Bloqueo bloqueo = bloqueoService.eliminar(id);
		redirect.addFlashAttribute("mensaje", "Se quitó el bloqueo: " + bloqueo.getFechasTexto()
				+ ". Esos horarios vuelven a estar disponibles.");
		return "redirect:/admin/bloqueos";
	}

	// Se completan los datos que la vista necesita además del formulario
	private String mostrar(Model model) {
		model.addAttribute("bloqueos", bloqueoService.listarVigentes());
		model.addAttribute("hoy", bloqueoService.hoy());
		return VISTA;
	}
}
