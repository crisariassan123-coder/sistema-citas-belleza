// Plugin que genera la guía de estilo del sistema de citas del salón de belleza.
// Se crean los estilos de color, los estilos de texto y un marco visual con muestras.
// Si se ejecuta de nuevo, se actualizan los estilos existentes en lugar de duplicarlos.

// Se define la paleta de colores tomada de la guía de estilo
const COLORES = [
  { nombre: "primario/base", hex: "A84D70", etiqueta: "Primario" },
  { nombre: "primario/hover", hex: "8E3D5D", etiqueta: "Primario hover" },
  { nombre: "fondo/suave", hex: "F8E8EC", etiqueta: "Fondo suave" },
  { nombre: "fondo/base", hex: "FBF6F2", etiqueta: "Fondo base" },
  { nombre: "acento/dorado", hex: "C9A15B", etiqueta: "Acento dorado" },
  { nombre: "texto/principal", hex: "3A2A30", etiqueta: "Texto principal" },
  { nombre: "texto/secundario", hex: "7A6870", etiqueta: "Texto secundario" },
  { nombre: "estado/deshabilitado", hex: "D9D0D3", etiqueta: "Deshabilitado" },
];

// Se define la escala tipográfica para móvil
const TEXTOS = [
  { nombre: "H1", familia: "Playfair Display", estilo: "Bold", tamano: 32, interlineado: 40, ejemplo: "Agenda tu cita" },
  { nombre: "H2", familia: "Playfair Display", estilo: "SemiBold", tamano: 26, interlineado: 34, ejemplo: "Nuestros servicios" },
  { nombre: "H3", familia: "DM Sans", estilo: "Bold", tamano: 20, interlineado: 28, ejemplo: "Corte y peinado" },
  { nombre: "Cuerpo", familia: "DM Sans", estilo: "Regular", tamano: 16, interlineado: 24, ejemplo: "Elige el día y la hora que mejor te acomoden." },
  { nombre: "Pequeño", familia: "DM Sans", estilo: "Regular", tamano: 14, interlineado: 20, ejemplo: "Duración aproximada: 60 min" },
  { nombre: "Botón", familia: "DM Sans", estilo: "Bold", tamano: 16, interlineado: 24, ejemplo: "Reservar ahora" },
];

// Se usa Inter como respaldo si alguna fuente no está disponible
const FUENTE_RESPALDO = { family: "Inter", style: "Regular" };

// Se convierte un color hexadecimal al formato RGB de 0 a 1 que usa Figma
function hexARgb(hex) {
  const valor = parseInt(hex, 16);
  return {
    r: ((valor >> 16) & 255) / 255,
    g: ((valor >> 8) & 255) / 255,
    b: (valor & 255) / 255,
  };
}

// Se carga una fuente y, si falla, se regresa la fuente de respaldo
async function cargarFuente(familia, estilo) {
  const fuente = { family: familia, style: estilo };
  try {
    await figma.loadFontAsync(fuente);
    return fuente;
  } catch (e) {
    await figma.loadFontAsync(FUENTE_RESPALDO);
    figma.notify(`No se encontró ${familia} ${estilo}; se usó Inter.`);
    return FUENTE_RESPALDO;
  }
}

// Se crean o actualizan los estilos de color y se regresan indexados por nombre
async function crearEstilosColor() {
  const existentes = await figma.getLocalPaintStylesAsync();
  const mapa = {};
  for (const c of COLORES) {
    let estilo = existentes.find((s) => s.name === c.nombre);
    if (!estilo) {
      estilo = figma.createPaintStyle();
      estilo.name = c.nombre;
    }
    estilo.paints = [{ type: "SOLID", color: hexARgb(c.hex) }];
    estilo.description = `#${c.hex}`;
    mapa[c.nombre] = estilo;
  }
  return mapa;
}

// Se crean o actualizan los estilos de texto y se regresan indexados por nombre
async function crearEstilosTexto() {
  const existentes = await figma.getLocalTextStylesAsync();
  const mapa = {};
  for (const t of TEXTOS) {
    const fuente = await cargarFuente(t.familia, t.estilo);
    let estilo = existentes.find((s) => s.name === t.nombre);
    if (!estilo) {
      estilo = figma.createTextStyle();
      estilo.name = t.nombre;
    }
    estilo.fontName = fuente;
    estilo.fontSize = t.tamano;
    estilo.lineHeight = { unit: "PIXELS", value: t.interlineado };
    estilo.description = `${t.familia} ${t.estilo} ${t.tamano}/${t.interlineado}`;
    mapa[t.nombre] = estilo;
  }
  return mapa;
}

// Se crea un texto con estilo vinculado; el color puede ser un estilo de Figma o un color hex directo
async function crearTexto(contenido, estiloTexto, color) {
  const nodo = figma.createText();
  await figma.loadFontAsync(estiloTexto.fontName);
  await nodo.setTextStyleIdAsync(estiloTexto.id);
  nodo.characters = contenido;
  if (typeof color === "string") {
    nodo.fills = [{ type: "SOLID", color: hexARgb(color) }];
  } else {
    await nodo.setFillStyleIdAsync(color.id);
  }
  return nodo;
}

// Se crea un marco con Auto Layout para acomodar los elementos sin coordenadas manuales
function crearMarcoAuto(nombre, direccion, espacio) {
  const marco = figma.createFrame();
  marco.name = nombre;
  marco.layoutMode = direccion;
  marco.itemSpacing = espacio;
  marco.primaryAxisSizingMode = "AUTO";
  marco.counterAxisSizingMode = "AUTO";
  marco.fills = [];
  return marco;
}

async function generarGuia() {
  const colores = await crearEstilosColor();
  const textos = await crearEstilosTexto();
  const colorTexto = colores["texto/principal"];
  const colorSecundario = colores["texto/secundario"];

  // Se crea el marco principal de la guía
  const guia = crearMarcoAuto("Guía de estilo", "VERTICAL", 48);
  guia.paddingTop = guia.paddingBottom = guia.paddingLeft = guia.paddingRight = 64;
  await guia.setFillStyleIdAsync(colores["fondo/base"].id);
  guia.cornerRadius = 24;

  guia.appendChild(await crearTexto("Guía de estilo · Salón de belleza", textos["H1"], colorTexto));

  // Se construye la sección de colores
  const seccionColores = crearMarcoAuto("Colores", "VERTICAL", 24);
  seccionColores.appendChild(await crearTexto("Colores", textos["H2"], colorTexto));
  const filaColores = crearMarcoAuto("Paleta", "HORIZONTAL", 24);
  for (const c of COLORES) {
    const tarjeta = crearMarcoAuto(c.etiqueta, "VERTICAL", 8);
    const muestra = figma.createRectangle();
    muestra.name = c.nombre;
    muestra.resize(120, 120);
    muestra.cornerRadius = 16;
    await muestra.setFillStyleIdAsync(colores[c.nombre].id);
    // Se agrega un borde sutil para que los colores claros se distingan del fondo
    muestra.strokes = [{ type: "SOLID", color: hexARgb("D9D0D3") }];
    muestra.strokeWeight = 1;
    tarjeta.appendChild(muestra);
    tarjeta.appendChild(await crearTexto(c.etiqueta, textos["H3"], colorTexto));
    tarjeta.appendChild(await crearTexto(`${c.nombre}\n#${c.hex}`, textos["Pequeño"], colorSecundario));
    filaColores.appendChild(tarjeta);
  }
  seccionColores.appendChild(filaColores);
  guia.appendChild(seccionColores);

  // Se construye la sección de tipografía
  const seccionTexto = crearMarcoAuto("Tipografía", "VERTICAL", 24);
  seccionTexto.appendChild(await crearTexto("Tipografía", textos["H2"], colorTexto));
  for (const t of TEXTOS) {
    const fila = crearMarcoAuto(t.nombre, "HORIZONTAL", 32);
    fila.counterAxisAlignItems = "CENTER";
    const etiqueta = await crearTexto(
      `${t.nombre} · ${t.familia} ${t.estilo} ${t.tamano}/${t.interlineado}`,
      textos["Pequeño"],
      colorSecundario
    );
    etiqueta.resize(320, etiqueta.height);
    etiqueta.textAutoResize = "HEIGHT";
    fila.appendChild(etiqueta);
    fila.appendChild(await crearTexto(t.ejemplo, textos[t.nombre], colorTexto));
    seccionTexto.appendChild(fila);
  }
  guia.appendChild(seccionTexto);

  // Se coloca la guía en la página actual y se centra la vista en ella
  figma.currentPage.appendChild(guia);
  figma.currentPage.selection = [guia];
  figma.viewport.scrollAndZoomIntoView([guia]);

  figma.closePlugin(`Guía creada: ${COLORES.length} colores y ${TEXTOS.length} estilos de texto.`);
}

// ---------------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------------

// Se crea un componente con Auto Layout horizontal y contenido centrado
function crearComponente(nombre) {
  const comp = figma.createComponent();
  comp.name = nombre;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  comp.fills = [];
  return comp;
}

// Se agrupan los componentes como variantes y se acomodan con Auto Layout
function combinarVariantes(componentes, nombre, contenedor) {
  const conjunto = figma.combineAsVariants(componentes, contenedor);
  conjunto.name = nombre;
  conjunto.layoutMode = "HORIZONTAL";
  conjunto.itemSpacing = 24;
  conjunto.counterAxisAlignItems = "CENTER";
  conjunto.paddingTop = conjunto.paddingBottom = conjunto.paddingLeft = conjunto.paddingRight = 24;
  conjunto.primaryAxisSizingMode = "AUTO";
  conjunto.counterAxisSizingMode = "AUTO";
  return conjunto;
}

// Se crea una sección con título dentro del marco de componentes
async function crearSeccion(titulo, textos, colores) {
  const seccion = crearMarcoAuto(titulo, "VERTICAL", 16);
  seccion.appendChild(await crearTexto(titulo, textos["H3"], colores["texto/principal"]));
  return seccion;
}

// Se generan las variantes del botón: primario, secundario y deshabilitado
async function crearBotones(textos, colores, contenedor) {
  const variantes = [
    { tipo: "Primario", fondo: "primario/base", borde: null, texto: "FFFFFF" },
    { tipo: "Secundario", fondo: null, borde: "primario/base", texto: colores["primario/base"] },
    { tipo: "Deshabilitado", fondo: "estado/deshabilitado", borde: null, texto: colores["texto/secundario"] },
  ];
  const componentes = [];
  for (const v of variantes) {
    const boton = crearComponente(`Tipo=${v.tipo}`);
    boton.resize(160, 48);
    boton.primaryAxisSizingMode = "AUTO";
    boton.counterAxisSizingMode = "FIXED";
    boton.paddingLeft = boton.paddingRight = 28;
    boton.cornerRadius = 999;
    if (v.fondo) await boton.setFillStyleIdAsync(colores[v.fondo].id);
    if (v.borde) {
      await boton.setStrokeStyleIdAsync(colores[v.borde].id);
      boton.strokeWeight = 2;
    }
    boton.appendChild(await crearTexto("Reservar ahora", textos["Botón"], v.texto));
    componentes.push(boton);
  }
  return combinarVariantes(componentes, "Botón", contenedor);
}

// Se generan las variantes del campo de texto: normal, enfocado y error
async function crearInputs(textos, colores, contenedor) {
  const variantes = [
    { estado: "Normal", borde: "estado/deshabilitado", grosor: 1 },
    { estado: "Enfocado", borde: "primario/base", grosor: 2 },
    { estado: "Error", borde: null, grosor: 2 },
  ];
  const componentes = [];
  for (const v of variantes) {
    const input = crearComponente(`Estado=${v.estado}`);
    input.layoutMode = "VERTICAL";
    input.primaryAxisAlignItems = "MIN";
    input.counterAxisAlignItems = "MIN";
    input.itemSpacing = 6;
    input.primaryAxisSizingMode = "AUTO";
    input.counterAxisSizingMode = "AUTO";
    input.appendChild(await crearTexto("Tu nombre", textos["Pequeño"], colores["texto/principal"]));

    // Se crea la caja del campo con ancho fijo
    const caja = figma.createFrame();
    caja.name = "Campo";
    caja.layoutMode = "HORIZONTAL";
    caja.counterAxisAlignItems = "CENTER";
    caja.resize(320, 48);
    caja.primaryAxisSizingMode = "FIXED";
    caja.counterAxisSizingMode = "FIXED";
    caja.paddingLeft = caja.paddingRight = 16;
    caja.cornerRadius = 12;
    caja.fills = [{ type: "SOLID", color: hexARgb("FFFFFF") }];
    if (v.borde) {
      await caja.setStrokeStyleIdAsync(colores[v.borde].id);
    } else {
      caja.strokes = [{ type: "SOLID", color: hexARgb("C0392B") }];
    }
    caja.strokeWeight = v.grosor;
    const placeholder = v.estado === "Normal" ? "Ej. María López" : "María";
    const colorPlaceholder = v.estado === "Normal" ? colores["texto/secundario"] : colores["texto/principal"];
    caja.appendChild(await crearTexto(placeholder, textos["Cuerpo"], colorPlaceholder));
    input.appendChild(caja);

    // Se agrega un mensaje de ayuda solo en la variante de error
    if (v.estado === "Error") {
      input.appendChild(await crearTexto("Escribe tu nombre completo", textos["Pequeño"], "C0392B"));
    }
    componentes.push(input);
  }
  return combinarVariantes(componentes, "Input", contenedor);
}

// Se generan las variantes del día del calendario
async function crearDiasCalendario(textos, colores, contenedor) {
  const variantes = [
    { estado: "Disponible", fondo: "fondo/suave", borde: null, texto: colores["texto/principal"], tachado: false },
    { estado: "Seleccionado", fondo: "primario/base", borde: null, texto: "FFFFFF", tachado: false },
    { estado: "Hoy", fondo: null, borde: "acento/dorado", texto: colores["texto/principal"], tachado: false },
    { estado: "Bloqueado", fondo: null, borde: null, texto: colores["estado/deshabilitado"], tachado: true },
    { estado: "Sin espacio", fondo: null, borde: null, texto: colores["texto/secundario"], tachado: false },
  ];
  const componentes = [];
  for (const v of variantes) {
    const dia = crearComponente(`Estado=${v.estado}`);
    dia.resize(44, 44);
    dia.primaryAxisSizingMode = "FIXED";
    dia.counterAxisSizingMode = "FIXED";
    dia.cornerRadius = 22;
    if (v.fondo) await dia.setFillStyleIdAsync(colores[v.fondo].id);
    if (v.borde) {
      await dia.setStrokeStyleIdAsync(colores[v.borde].id);
      dia.strokeWeight = 2;
    }
    const numero = await crearTexto("15", textos["Cuerpo"], v.texto);
    if (v.tachado) numero.textDecoration = "STRIKETHROUGH";
    dia.appendChild(numero);
    componentes.push(dia);
  }
  return combinarVariantes(componentes, "Día calendario", contenedor);
}

// Se generan las variantes del botón de horario (10:00, 10:30, etc.)
async function crearHorarios(textos, colores, contenedor) {
  const variantes = [
    { estado: "Disponible", fondo: null, texto: colores["primario/base"] },
    { estado: "Seleccionado", fondo: "primario/base", texto: "FFFFFF" },
  ];
  const componentes = [];
  for (const v of variantes) {
    const hora = crearComponente(`Estado=${v.estado}`);
    hora.resize(96, 44);
    hora.primaryAxisSizingMode = "FIXED";
    hora.counterAxisSizingMode = "FIXED";
    hora.cornerRadius = 999;
    await hora.setStrokeStyleIdAsync(colores["primario/base"].id);
    hora.strokeWeight = 1.5;
    if (v.fondo) await hora.setFillStyleIdAsync(colores[v.fondo].id);
    hora.appendChild(await crearTexto("10:30", textos["Botón"], v.texto));
    componentes.push(hora);
  }
  return combinarVariantes(componentes, "Horario", contenedor);
}

// Se crea la tarjeta de servicio usando una instancia del botón primario
async function crearTarjetaServicio(textos, colores, contenedor, botones) {
  const tarjeta = figma.createComponent();
  tarjeta.name = "Tarjeta servicio";
  tarjeta.layoutMode = "VERTICAL";
  tarjeta.resize(320, 200);
  tarjeta.primaryAxisSizingMode = "AUTO";
  tarjeta.counterAxisSizingMode = "FIXED";
  tarjeta.itemSpacing = 12;
  tarjeta.paddingTop = tarjeta.paddingBottom = tarjeta.paddingLeft = tarjeta.paddingRight = 20;
  tarjeta.cornerRadius = 16;
  tarjeta.fills = [{ type: "SOLID", color: hexARgb("FFFFFF") }];
  // Se aplica una sombra suave con el tono del texto principal
  tarjeta.effects = [{
    type: "DROP_SHADOW",
    color: { r: 0.227, g: 0.165, b: 0.188, a: 0.08 },
    offset: { x: 0, y: 6 },
    radius: 20,
    spread: 0,
    visible: true,
    blendMode: "NORMAL",
  }];

  tarjeta.appendChild(await crearTexto("Corte y peinado", textos["H3"], colores["texto/principal"]));
  const descripcion = await crearTexto(
    "Corte a tu medida con lavado y peinado incluido.",
    textos["Pequeño"],
    colores["texto/secundario"]
  );
  tarjeta.appendChild(descripcion);
  descripcion.layoutSizingHorizontal = "FILL";

  // Se crea la fila de duración y precio repartida a los extremos
  const fila = crearMarcoAuto("Duración y precio", "HORIZONTAL", 8);
  fila.primaryAxisAlignItems = "SPACE_BETWEEN";
  fila.counterAxisAlignItems = "CENTER";
  fila.appendChild(await crearTexto("60 min", textos["Pequeño"], colores["texto/secundario"]));
  fila.appendChild(await crearTexto("$350", textos["H3"], colores["primario/base"]));
  tarjeta.appendChild(fila);
  fila.layoutSizingHorizontal = "FILL";

  // Se inserta una instancia del botón primario para que herede cambios futuros
  const primario = botones.children.find((c) => c.name === "Tipo=Primario");
  const boton = primario.createInstance();
  tarjeta.appendChild(boton);
  boton.layoutSizingHorizontal = "FILL";

  contenedor.appendChild(tarjeta);
  return tarjeta;
}

async function generarComponentes() {
  const colores = await crearEstilosColor();
  const textos = await crearEstilosTexto();

  // Se crea el marco contenedor de todos los componentes
  const marco = crearMarcoAuto("Componentes", "VERTICAL", 40);
  marco.paddingTop = marco.paddingBottom = marco.paddingLeft = marco.paddingRight = 64;
  await marco.setFillStyleIdAsync(colores["fondo/base"].id);
  marco.cornerRadius = 24;
  marco.appendChild(await crearTexto("Componentes", textos["H1"], colores["texto/principal"]));

  // Se coloca el marco debajo de lo que ya existe en la página
  const nodos = figma.currentPage.children;
  const fondo = nodos.reduce((max, n) => Math.max(max, n.y + n.height), 0);
  figma.currentPage.appendChild(marco);
  marco.x = 0;
  marco.y = nodos.length > 1 ? fondo + 120 : 0;

  const secBotones = await crearSeccion("Botón", textos, colores);
  const botones = await crearBotones(textos, colores, secBotones);
  marco.appendChild(secBotones);

  const secInputs = await crearSeccion("Input", textos, colores);
  await crearInputs(textos, colores, secInputs);
  marco.appendChild(secInputs);

  const secDias = await crearSeccion("Día del calendario", textos, colores);
  await crearDiasCalendario(textos, colores, secDias);
  marco.appendChild(secDias);

  const secHorarios = await crearSeccion("Horario", textos, colores);
  await crearHorarios(textos, colores, secHorarios);
  marco.appendChild(secHorarios);

  const secTarjeta = await crearSeccion("Tarjeta de servicio", textos, colores);
  await crearTarjetaServicio(textos, colores, secTarjeta, botones);
  marco.appendChild(secTarjeta);

  figma.currentPage.selection = [marco];
  figma.viewport.scrollAndZoomIntoView([marco]);
  figma.closePlugin("Componentes creados: Botón, Input, Día calendario, Horario y Tarjeta servicio.");
}

// Se ejecuta el comando elegido en el menú del plugin
const comandos = { guia: generarGuia, componentes: generarComponentes };
const ejecutar = comandos[figma.command] || generarGuia;
ejecutar().catch((error) => {
  figma.closePlugin(`Error: ${error.message}`);
});
