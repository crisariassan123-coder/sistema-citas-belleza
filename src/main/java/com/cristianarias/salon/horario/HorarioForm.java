package com.cristianarias.salon.horario;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

/**
 * Formulario con los 7 días de la semana; se guarda completo en una sola acción.
 */
public class HorarioForm {

	// Se valida cada día de la lista con @Valid
	@Valid
	@Size(min = 7, max = 7, message = "Se deben enviar los 7 días de la semana")
	private List<DiaForm> dias = new ArrayList<>();

	public static HorarioForm desde(List<HorarioSemanal> semana) {
		HorarioForm form = new HorarioForm();
		semana.forEach(dia -> form.getDias().add(DiaForm.desde(dia)));
		return form;
	}

	public List<DiaForm> getDias() {
		return dias;
	}

	public void setDias(List<DiaForm> dias) {
		this.dias = dias;
	}
}
