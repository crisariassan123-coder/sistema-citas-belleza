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

// ---------------------------------------------------------------------------
// Wireframes de baja fidelidad (escala de grises, móvil 390 px)
// ---------------------------------------------------------------------------

// Se usa una paleta de grises para que el wireframe se enfoque en estructura y no en estilo
const G = {
  texto: "222222",
  sec: "777777",
  caja: "E6E6E6",
  borde: "CFCFCF",
  oscuro: "333333",
  claro: "F4F4F4",
  blanco: "FFFFFF",
};

function relleno(hex) {
  return [{ type: "SOLID", color: hexARgb(hex) }];
}

// Se crea un marco con Auto Layout y sin relleno
function marco(nombre, direccion, espacio) {
  const f = figma.createFrame();
  f.name = nombre;
  f.layoutMode = direccion;
  f.itemSpacing = espacio || 0;
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.fills = [];
  return f;
}

// Se crea un marco de tamaño fijo con el contenido centrado
function marcoFijo(nombre, ancho, alto) {
  const f = figma.createFrame();
  f.name = nombre;
  f.layoutMode = "HORIZONTAL";
  f.primaryAxisAlignItems = "CENTER";
  f.counterAxisAlignItems = "CENTER";
  f.resize(ancho, alto);
  f.primaryAxisSizingMode = "FIXED";
  f.counterAxisSizingMode = "FIXED";
  f.fills = [];
  return f;
}

// Se crea un texto con Inter (siempre disponible en Figma)
function txt(contenido, tamano, negrita, color) {
  const t = figma.createText();
  t.fontName = { family: "Inter", style: negrita ? "Bold" : "Regular" };
  t.fontSize = tamano || 14;
  t.characters = contenido;
  t.fills = relleno(color || G.texto);
  return t;
}

// Se agrega un hijo y, si se indica, se estira al ancho del contenedor
function agregar(padre, hijo, estirar) {
  padre.appendChild(hijo);
  if (estirar !== false) {
    hijo.layoutSizingHorizontal = "FILL";
    if (hijo.type === "TEXT") hijo.textAutoResize = "HEIGHT";
  }
  return hijo;
}

function fila(nombre, hijos, espacio, repartir) {
  const f = marco(nombre, "HORIZONTAL", espacio || 8);
  f.counterAxisAlignItems = "CENTER";
  if (repartir) f.primaryAxisAlignItems = "SPACE_BETWEEN";
  hijos.forEach((h) => f.appendChild(h));
  return f;
}

function cajaImagen(alto, etiqueta) {
  const c = marcoFijo(etiqueta, 350, alto);
  c.fills = relleno(G.caja);
  c.cornerRadius = 8;
  c.appendChild(txt(etiqueta, 12, false, G.sec));
  return c;
}

function boton(texto, primario) {
  const b = marcoFijo("Botón", 350, 48);
  b.cornerRadius = 24;
  if (primario !== false) {
    b.fills = relleno(G.oscuro);
    b.appendChild(txt(texto, 15, true, G.blanco));
  } else {
    b.strokes = relleno(G.oscuro);
    b.strokeWeight = 1.5;
    b.appendChild(txt(texto, 15, true, G.texto));
  }
  return b;
}

function campo(etiqueta, placeholder) {
  const c = marco("Input " + etiqueta, "VERTICAL", 6);
  c.appendChild(txt(etiqueta, 12, true));
  const caja = marcoFijo("Campo", 350, 44);
  caja.primaryAxisAlignItems = "MIN";
  caja.paddingLeft = caja.paddingRight = 12;
  caja.cornerRadius = 8;
  caja.fills = relleno(G.blanco);
  caja.strokes = relleno(G.borde);
  caja.appendChild(txt(placeholder, 14, false, G.sec));
  agregar(c, caja);
  return c;
}

function encabezado(titulo, atras) {
  const izquierda = atras
    ? txt("←  " + titulo, 16, true)
    : fila("Marca", [cajaRedonda(32, ""), txt(titulo, 16, true)], 8);
  return fila("Encabezado", [izquierda, txt("☰", 18)], 8, true);
}

function cajaRedonda(tamano, etiqueta, oscuro) {
  const c = marcoFijo("Círculo", tamano, tamano);
  c.cornerRadius = tamano / 2;
  c.fills = relleno(oscuro ? G.oscuro : G.caja);
  if (etiqueta) c.appendChild(txt(etiqueta, tamano / 2.5, true, oscuro ? G.blanco : G.sec));
  return c;
}

// Se crea el indicador de avance del flujo de reserva
function pasos(actual) {
  const p = marco("Pasos", "VERTICAL", 6);
  const nombres = ["Servicio", "Día", "Hora", "Datos"];
  agregar(p, txt(`Paso ${actual} de 4 · ${nombres[actual - 1]}`, 12, false, G.sec));
  const barra = marco("Barra", "HORIZONTAL", 6);
  agregar(p, barra);
  for (let i = 1; i <= 4; i++) {
    const r = figma.createRectangle();
    r.resize(80, 6);
    r.cornerRadius = 3;
    r.fills = relleno(i <= actual ? G.oscuro : G.caja);
    agregar(barra, r);
  }
  return p;
}

// Se crea una tarjeta con líneas de texto; cada línea es [texto, tamaño, negrita, color]
function tarjeta(lineas, seleccionada) {
  const t = marco("Tarjeta", "VERTICAL", 4);
  t.paddingTop = t.paddingBottom = t.paddingLeft = t.paddingRight = 14;
  t.cornerRadius = 10;
  t.fills = relleno(G.blanco);
  t.strokes = relleno(seleccionada ? G.oscuro : G.borde);
  t.strokeWeight = seleccionada ? 2 : 1;
  lineas.forEach((l) => {
    if (typeof l === "string") agregar(t, txt(l, 14));
    else if (l.type) agregar(t, l);
    else agregar(t, txt(l[0], l[1] || 14, l[2], l[3]));
  });
  return t;
}

function dato(etiqueta, valor) {
  const f = fila("Dato", [txt(etiqueta, 14, false, G.sec), txt(valor, 14, true)], 8, true);
  return f;
}

function chip(texto, seleccionado) {
  const c = marcoFijo("Horario", 74, 40);
  c.cornerRadius = 20;
  c.strokes = relleno(G.oscuro);
  if (seleccionado) c.fills = relleno(G.oscuro);
  c.appendChild(txt(texto, 14, true, seleccionado ? G.blanco : G.texto));
  return c;
}

function filaFlexible(nombre, hijos, espacio) {
  const f = marco(nombre, "HORIZONTAL", espacio);
  f.layoutWrap = "WRAP";
  f.counterAxisSpacing = espacio;
  hijos.forEach((h) => f.appendChild(h));
  return f;
}

function segmentado(opciones, activa) {
  const s = marco("Selector", "HORIZONTAL", 4);
  s.paddingTop = s.paddingBottom = s.paddingLeft = s.paddingRight = 4;
  s.cornerRadius = 22;
  s.fills = relleno(G.claro);
  opciones.forEach((o, i) => {
    const op = marcoFijo(o, 100, 36);
    op.cornerRadius = 18;
    if (i === activa) {
      op.fills = relleno(G.blanco);
      op.strokes = relleno(G.borde);
    }
    op.appendChild(txt(o, 13, i === activa, i === activa ? G.texto : G.sec));
    agregar(s, op);
  });
  return s;
}

function interruptor(encendido) {
  const s = marcoFijo("Switch", 44, 24);
  s.cornerRadius = 12;
  s.fills = relleno(encendido ? G.oscuro : G.caja);
  s.primaryAxisAlignItems = encendido ? "MAX" : "MIN";
  s.paddingLeft = s.paddingRight = 3;
  const bola = marcoFijo("Bola", 18, 18);
  bola.cornerRadius = 9;
  bola.fills = relleno(G.blanco);
  s.appendChild(bola);
  return s;
}

// Se crea la barra de navegación inferior del panel de la dueña
function navAdmin(activa) {
  const n = marco("Navegación", "HORIZONTAL", 4);
  n.primaryAxisAlignItems = "SPACE_BETWEEN";
  n.paddingTop = n.paddingBottom = 12;
  n.paddingLeft = n.paddingRight = 16;
  n.cornerRadius = 12;
  n.fills = relleno(G.claro);
  ["Agenda", "Bloqueos", "Servicios", "Horario"].forEach((o) => {
    n.appendChild(txt(o, 13, o === activa, o === activa ? G.texto : G.sec));
  });
  return n;
}

// Se construye el calendario de noviembre 2026 con todos los estados de día
function calendario() {
  const cal = marco("Calendario", "VERTICAL", 6);
  agregar(cal, fila("Mes", [txt("‹", 18, true), txt("Noviembre 2026", 15, true), txt("›", 18, true)], 8, true));
  const semana = fila("Días de la semana", [], 0, true);
  ["L", "M", "M", "J", "V", "S", "D"].forEach((d) => {
    const c = marcoFijo(d, 40, 24);
    c.appendChild(txt(d, 12, true, G.sec));
    semana.appendChild(c);
  });
  agregar(cal, semana);

  // El 1 de noviembre de 2026 cae en domingo, por eso se dejan 6 espacios al inicio
  const celdas = Array(6).fill(null);
  for (let d = 1; d <= 30; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);

  for (let i = 0; i < celdas.length; i += 7) {
    const renglon = fila("Semana", [], 0, true);
    celdas.slice(i, i + 7).forEach((d, col) => {
      const c = marcoFijo(d ? String(d) : "vacío", 40, 40);
      c.cornerRadius = 20;
      if (d) {
        const domingo = col === 6;
        let color = G.texto;
        let tachado = false;
        if (d < 11) color = G.borde;
        else if (d === 19) { c.fills = relleno(G.oscuro); color = G.blanco; }
        else if (d === 11) { c.strokes = relleno(G.oscuro); c.strokeWeight = 2; }
        else if (domingo || d === 25) { color = G.borde; tachado = true; }
        else if (d === 24) color = G.sec;
        else c.fills = relleno(G.claro);
        const t = txt(String(d), 14, d === 19 || d === 11, color);
        if (tachado) t.textDecoration = "STRIKETHROUGH";
        c.appendChild(t);
      }
      renglon.appendChild(c);
    });
    agregar(cal, renglon);
  }
  agregar(cal, txt("○ Disponible   ● Seleccionado   ◌ Hoy   — Bloqueado", 11, false, G.sec));
  return cal;
}

// Se crea una pantalla de móvil de 390 px de ancho que crece hacia abajo según su contenido
function pantalla(nombre) {
  const p = figma.createFrame();
  p.name = nombre;
  p.layoutMode = "VERTICAL";
  p.resize(390, 844);
  p.counterAxisSizingMode = "FIXED";
  p.primaryAxisSizingMode = "AUTO";
  p.paddingTop = p.paddingBottom = p.paddingLeft = p.paddingRight = 20;
  p.itemSpacing = 16;
  p.fills = relleno(G.blanco);
  p.strokes = relleno(G.borde);
  p.cornerRadius = 24;
  try { p.minHeight = 844; } catch (e) { /* Se ignora si la versión de Figma no soporta minHeight */ }
  return p;
}

function resumenServicio() {
  return tarjeta([["Corte y peinado · 60 min · $350", 13, true]]);
}

// ----- Pantallas del sitio público -----

function pInicio() {
  const p = pantalla("01 Inicio");
  agregar(p, encabezado("Salón"));
  agregar(p, cajaImagen(200, "Imagen principal del salón"));
  agregar(p, txt("Belleza que te hace sentir tú", 26, true));
  agregar(p, txt("Agenda tu cita en menos de un minuto, sin llamadas ni esperas.", 14, false, G.sec));
  agregar(p, boton("Agenda tu cita"));
  agregar(p, txt("Servicios destacados", 18, true));
  [["Corte y peinado", "60 min · $350"], ["Tinte completo", "120 min · $900"], ["Manicure", "45 min · $250"]]
    .forEach(([n, d]) => agregar(p, tarjeta([[n, 15, true], [d, 13, false, G.sec]])));
  agregar(p, txt("Ver todos los servicios →", 14, true));
  agregar(p, txt("Ubicación", 18, true));
  agregar(p, cajaImagen(140, "Mapa"));
  agregar(p, txt("Calle ejemplo #123, Toluca · Lun a Sáb 10:00–19:00", 13, false, G.sec));
  agregar(p, boton("Escríbenos por WhatsApp", false));
  return p;
}

function pServicio() {
  const p = pantalla("02 Reserva · Servicio");
  agregar(p, encabezado("Agenda tu cita", true));
  agregar(p, pasos(1));
  agregar(p, txt("¿Qué servicio quieres?", 22, true));
  agregar(p, tarjeta([["Corte y peinado", 15, true], ["Incluye lavado y peinado", 13, false, G.sec], ["60 min · $350", 13, true]], true));
  agregar(p, tarjeta([["Tinte completo", 15, true], ["Color uniforme de raíz a puntas", 13, false, G.sec], ["120 min · $900", 13, true]]));
  agregar(p, tarjeta([["Manicure", 15, true], ["Limado, cutícula y esmaltado", 13, false, G.sec], ["45 min · $250", 13, true]]));
  agregar(p, tarjeta([["Peinado para evento", 15, true], ["Recogido o suelto con ondas", 13, false, G.sec], ["90 min · $600", 13, true]]));
  agregar(p, boton("Continuar"));
  return p;
}

function pDia() {
  const p = pantalla("03 Reserva · Día");
  agregar(p, encabezado("Agenda tu cita", true));
  agregar(p, pasos(2));
  agregar(p, resumenServicio());
  agregar(p, txt("Elige el día", 22, true));
  agregar(p, calendario());
  agregar(p, boton("Continuar"));
  return p;
}

function pHora() {
  const p = pantalla("04 Reserva · Hora");
  agregar(p, encabezado("Agenda tu cita", true));
  agregar(p, pasos(3));
  agregar(p, resumenServicio());
  agregar(p, txt("Elige la hora", 22, true));
  agregar(p, txt("Jueves 19 de noviembre", 14, false, G.sec));
  agregar(p, txt("Mañana", 14, true));
  agregar(p, filaFlexible("Horas mañana", ["10:00", "10:30", "11:00", "11:30", "12:00"].map((h) => chip(h, h === "11:00")), 10));
  agregar(p, txt("Tarde", 14, true));
  agregar(p, filaFlexible("Horas tarde", ["16:00", "16:30", "17:00", "17:30", "18:00"].map((h) => chip(h)), 10));
  agregar(p, txt("Solo se muestran los horarios con espacio para tu servicio.", 12, false, G.sec));
  agregar(p, boton("Continuar"));
  return p;
}

function pDatos() {
  const p = pantalla("05 Reserva · Datos");
  agregar(p, encabezado("Agenda tu cita", true));
  agregar(p, pasos(4));
  agregar(p, txt("Tus datos", 22, true));
  agregar(p, campo("Nombre", "Ej. María López"));
  agregar(p, campo("WhatsApp", "10 dígitos"));
  agregar(p, txt("Te enviaremos la confirmación por WhatsApp.", 12, false, G.sec));
  agregar(p, tarjeta([["Resumen", 14, true], dato("Servicio", "Corte y peinado"), dato("Fecha", "Jue 19 nov"), dato("Hora", "11:00"), dato("Total", "$350")]));
  agregar(p, boton("Confirmar cita"));
  return p;
}

function pConfirmacion() {
  const p = pantalla("06 Confirmación");
  p.counterAxisAlignItems = "CENTER";
  agregar(p, encabezado("Salón"));
  agregar(p, cajaRedonda(80, "✓", true), false);
  const titulo = agregar(p, txt("¡Tu cita está agendada!", 24, true));
  titulo.textAlignHorizontal = "CENTER";
  const sub = agregar(p, txt("Te esperamos. Si necesitas cambiarla, escríbenos.", 14, false, G.sec));
  sub.textAlignHorizontal = "CENTER";
  agregar(p, tarjeta([dato("Servicio", "Corte y peinado"), dato("Fecha", "Jueves 19 nov"), dato("Hora", "11:00 – 12:00"), dato("Total", "$350")]));
  agregar(p, boton("Enviar resumen por WhatsApp"));
  agregar(p, boton("Volver al inicio", false));
  return p;
}

// ----- Pantallas del panel de la dueña -----

function pLogin() {
  const p = pantalla("07 Login");
  p.counterAxisAlignItems = "CENTER";
  p.primaryAxisAlignItems = "CENTER";
  agregar(p, cajaRedonda(72, "Logo"), false);
  const t = agregar(p, txt("Panel del salón", 24, true));
  t.textAlignHorizontal = "CENTER";
  agregar(p, campo("Usuario", "usuario"));
  agregar(p, campo("Contraseña", "••••••••"));
  agregar(p, boton("Entrar"));
  return p;
}

function citaFila(hora, clienta, servicio, estado) {
  return tarjeta([
    fila("Fila cita", [txt(hora, 15, true), txt(estado, 12, true, G.sec)], 8, true),
    [clienta, 14, true],
    [servicio, 13, false, G.sec],
  ]);
}

function pAgenda() {
  const p = pantalla("08 Agenda");
  agregar(p, encabezado("Panel"));
  agregar(p, segmentado(["Día", "Semana"], 0));
  agregar(p, fila("Fecha", [txt("‹", 18, true), txt("Hoy · jueves 19 nov", 15, true), txt("›", 18, true)], 8, true));
  agregar(p, txt("4 citas · 2 horas libres", 13, false, G.sec));
  agregar(p, citaFila("10:00", "Ana Martínez", "Manicure · 45 min", "Confirmada"));
  agregar(p, citaFila("11:00", "María López", "Corte y peinado · 60 min", "Pendiente"));
  agregar(p, tarjeta([["14:00 – 16:00 · Bloqueado", 14, true, G.sec], ["Pendiente personal", 13, false, G.sec]]));
  agregar(p, citaFila("16:00", "Laura Gómez", "Tinte completo · 120 min", "Confirmada"));
  agregar(p, citaFila("18:00", "Sofía Ruiz", "Manicure · 45 min", "Pendiente"));
  agregar(p, navAdmin("Agenda"));
  return p;
}

function pDetalle() {
  const p = pantalla("09 Detalle de cita");
  agregar(p, encabezado("Cita", true));
  agregar(p, tarjeta([
    ["María López", 18, true],
    dato("WhatsApp", "722 123 4567"),
    dato("Servicio", "Corte y peinado"),
    dato("Fecha", "Jue 19 nov"),
    dato("Hora", "11:00 – 12:00"),
    dato("Precio", "$350"),
    dato("Estado", "Pendiente"),
  ]));
  agregar(p, boton("Confirmar cita"));
  agregar(p, boton("Marcar como completada", false));
  agregar(p, boton("Contactar por WhatsApp", false));
  agregar(p, txt("Cancelar cita", 14, true, G.sec));
  return p;
}

function pBloqueos() {
  const p = pantalla("10 Bloqueos y vacaciones");
  agregar(p, encabezado("Panel"));
  agregar(p, txt("Días inhábiles y vacaciones", 22, true));
  agregar(p, tarjeta([["24 – 31 dic · Vacaciones", 14, true], ["Rango de fechas", 13, false, G.sec]]));
  agregar(p, tarjeta([["25 nov · Día completo", 14, true], ["Personal", 13, false, G.sec]]));
  agregar(p, tarjeta([["19 nov · 14:00 – 16:00", 14, true], ["Horas específicas", 13, false, G.sec]]));
  agregar(p, txt("Nuevo bloqueo", 18, true));
  agregar(p, segmentado(["Día", "Rango", "Horas"], 1));
  agregar(p, campo("Fecha inicio", "dd/mm/aaaa"));
  agregar(p, campo("Fecha fin", "dd/mm/aaaa"));
  agregar(p, campo("Motivo (opcional)", "Ej. Vacaciones"));
  agregar(p, txt("⚠ Hay 2 citas dentro de este rango.", 12, true, G.sec));
  agregar(p, boton("Guardar bloqueo"));
  agregar(p, navAdmin("Bloqueos"));
  return p;
}

function servicioFila(nombre, detalle, activo) {
  const info = marco("Info", "VERTICAL", 2);
  info.appendChild(txt(nombre, 15, true, activo ? G.texto : G.sec));
  info.appendChild(txt(detalle, 13, false, G.sec));
  return tarjeta([fila("Servicio", [info, interruptor(activo)], 8, true)]);
}

function pServicios() {
  const p = pantalla("11 Servicios");
  agregar(p, encabezado("Panel"));
  agregar(p, txt("Mis servicios", 22, true));
  agregar(p, boton("+ Nuevo servicio"));
  agregar(p, servicioFila("Corte y peinado", "60 min · $350", true));
  agregar(p, servicioFila("Tinte completo", "120 min · $900", true));
  agregar(p, servicioFila("Manicure", "45 min · $250", true));
  agregar(p, servicioFila("Peinado para evento", "90 min · $600", true));
  agregar(p, servicioFila("Alaciado", "180 min · $1,500 · Inactivo", false));
  agregar(p, navAdmin("Servicios"));
  return p;
}

function pHorario() {
  const p = pantalla("12 Horario semanal");
  agregar(p, encabezado("Panel"));
  agregar(p, txt("Mi horario", 22, true));
  agregar(p, txt("Las clientas solo verán horarios dentro de estos rangos.", 13, false, G.sec));
  [["Lunes", "10:00 – 19:00", true], ["Martes", "10:00 – 19:00", true], ["Miércoles", "10:00 – 19:00", true],
    ["Jueves", "10:00 – 19:00", true], ["Viernes", "10:00 – 19:00", true], ["Sábado", "09:00 – 15:00", true],
    ["Domingo", "No laboro", false]].forEach(([dia, horas, activo]) => {
    const info = marco("Info", "VERTICAL", 2);
    info.appendChild(txt(dia, 15, true, activo ? G.texto : G.sec));
    info.appendChild(txt(horas, 13, false, G.sec));
    agregar(p, fila(dia, [info, interruptor(activo)], 8, true));
  });
  agregar(p, boton("Guardar horario"));
  agregar(p, navAdmin("Horario"));
  return p;
}

// Se agrupan las pantallas en una sección con título y se acomodan en fila
function seccion(titulo, pantallas) {
  const s = marco(titulo, "VERTICAL", 32);
  s.appendChild(txt(titulo, 40, true));
  const filaPantallas = marco("Pantallas", "HORIZONTAL", 80);
  filaPantallas.counterAxisAlignItems = "MIN";
  pantallas.forEach((p) => filaPantallas.appendChild(p));
  s.appendChild(filaPantallas);
  return s;
}

async function generarWireframes() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  // Se crea (o se reutiliza) la página de wireframes para no mezclarla con la guía de estilo
  let pagina = figma.root.children.find((pg) => pg.name === "Wireframes");
  if (!pagina) {
    pagina = figma.createPage();
    pagina.name = "Wireframes";
  }
  await figma.setCurrentPageAsync(pagina);

  const publico = seccion("Sitio público (clienta)", [pInicio(), pServicio(), pDia(), pHora(), pDatos(), pConfirmacion()]);
  const panel = seccion("Panel de la dueña", [pLogin(), pAgenda(), pDetalle(), pBloqueos(), pServicios(), pHorario()]);
  pagina.appendChild(publico);
  pagina.appendChild(panel);

  // Se coloca el panel debajo del sitio público, después de cualquier contenido previo
  const previos = pagina.children.filter((n) => n !== publico && n !== panel);
  const inicio = previos.reduce((max, n) => Math.max(max, n.y + n.height + 200), 0);
  publico.x = 0;
  publico.y = inicio;
  panel.x = 0;
  panel.y = publico.y + publico.height + 200;

  figma.currentPage.selection = [publico, panel];
  figma.viewport.scrollAndZoomIntoView([publico, panel]);
  figma.closePlugin("Wireframes creados: 12 pantallas en la página Wireframes.");
}

// ---------------------------------------------------------------------------
// Alta fidelidad del flujo de reserva con prototipo navegable
// ---------------------------------------------------------------------------

// Se guardan aquí los estilos y componentes para no pasarlos en cada función
const AF = { colores: null, textos: null, comp: {} };
const NOMBRE_SALON = "Salón Aurora";

// Se crea un texto que usa los estilos locales de la guía
async function af_txt(contenido, estilo, color) {
  return crearTexto(contenido, AF.textos[estilo], AF.colores[color || "texto/principal"]);
}

// Se aplica un estilo de color como relleno a un nodo
async function af_fondo(nodo, color) {
  await nodo.setFillStyleIdAsync(AF.colores[color].id);
}

// Se obtiene una variante por nombre dentro de un conjunto de componentes
function variante(conjunto, nombre) {
  return conjunto.children.find((c) => c.name === nombre) || conjunto.defaultVariant || conjunto.children[0];
}

// Se reemplazan los textos de una instancia en el orden en que aparecen
async function af_textos(instancia, valores) {
  const nodos = instancia.findAll((n) => n.type === "TEXT");
  for (let i = 0; i < valores.length && i < nodos.length; i++) {
    if (valores[i] === null || valores[i] === undefined) continue;
    await figma.loadFontAsync(nodos[i].fontName);
    nodos[i].characters = valores[i];
  }
  return instancia;
}

async function af_boton(texto, tipo) {
  const inst = variante(AF.comp.boton, `Tipo=${tipo || "Primario"}`).createInstance();
  inst.name = "Botón · " + texto;
  return af_textos(inst, [texto]);
}

async function af_input(etiqueta, placeholder) {
  const inst = variante(AF.comp.input, "Estado=Normal").createInstance();
  inst.name = "Input · " + etiqueta;
  return af_textos(inst, [etiqueta, placeholder]);
}

async function af_tarjeta(nombre, descripcion, duracion, precio, opciones) {
  const op = opciones || {};
  const inst = AF.comp.tarjeta.createInstance();
  inst.name = "Tarjeta · " + nombre;
  await af_textos(inst, [nombre, descripcion, duracion, precio, op.boton || null]);
  // Se oculta el botón interno cuando la tarjeta se usa como opción seleccionable
  if (op.sinBoton) {
    const b = inst.findOne((n) => n.type === "INSTANCE");
    if (b) b.visible = false;
  }
  if (op.seleccionada) {
    await inst.setStrokeStyleIdAsync(AF.colores["primario/base"].id);
    inst.strokeWeight = 2;
  }
  return inst;
}

// Se crea un marco de pantalla móvil con el fondo de la guía
async function af_pantalla(nombre) {
  const p = pantalla(nombre);
  p.strokes = [];
  p.cornerRadius = 0;
  p.itemSpacing = 20;
  p.paddingLeft = p.paddingRight = 20;
  p.paddingBottom = 32;
  await af_fondo(p, "fondo/base");
  return p;
}

// Se crea el encabezado: marca del salón o botón de regreso con título
async function af_encabezado(titulo, atras) {
  let izquierda;
  if (atras) {
    izquierda = await af_txt("←  " + titulo, "H3");
    izquierda.name = "Regresar";
  } else {
    const logo = marcoFijo("Logo", 36, 36);
    logo.cornerRadius = 18;
    await af_fondo(logo, "primario/base");
    logo.appendChild(await af_txt("A", "Botón", "fondo/base"));
    izquierda = fila("Marca", [logo, await af_txt(NOMBRE_SALON, "H3")], 10);
  }
  const menu = await af_txt("☰", "H3");
  return fila("Encabezado", [izquierda, menu], 8, true);
}

// Se crea el indicador de pasos con los colores de la guía
async function af_pasos(actual) {
  const nombres = ["Servicio", "Día", "Hora", "Datos"];
  const p = marco("Pasos", "VERTICAL", 8);
  agregar(p, await af_txt(`Paso ${actual} de 4 · ${nombres[actual - 1]}`, "Pequeño", "texto/secundario"));
  const barra = marco("Barra", "HORIZONTAL", 6);
  agregar(p, barra);
  for (let i = 1; i <= 4; i++) {
    const r = figma.createRectangle();
    r.resize(80, 6);
    r.cornerRadius = 3;
    await af_fondo(r, i <= actual ? "primario/base" : "estado/deshabilitado");
    agregar(barra, r);
  }
  return p;
}

// Se crea la etiqueta con el servicio elegido que acompaña los pasos 2 y 3
async function af_resumenChip() {
  const c = marco("Servicio elegido", "HORIZONTAL", 8);
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 8;
  c.paddingLeft = c.paddingRight = 16;
  c.cornerRadius = 999;
  await af_fondo(c, "fondo/suave");
  c.appendChild(await af_txt("✦ Corte y peinado · 60 min · $350", "Pequeño", "primario/hover"));
  return c;
}

// Se crea una tarjeta blanca con sombra suave
function af_tarjetaBlanca(nombre, espacio) {
  const t = marco(nombre, "VERTICAL", espacio || 12);
  t.paddingTop = t.paddingBottom = t.paddingLeft = t.paddingRight = 20;
  t.cornerRadius = 16;
  t.fills = relleno("FFFFFF");
  t.effects = [{
    type: "DROP_SHADOW", color: { r: 0.227, g: 0.165, b: 0.188, a: 0.08 },
    offset: { x: 0, y: 6 }, radius: 20, spread: 0, visible: true, blendMode: "NORMAL",
  }];
  return t;
}

async function af_dato(etiqueta, valor) {
  return fila("Dato", [await af_txt(etiqueta, "Cuerpo", "texto/secundario"), await af_txt(valor, "Botón")], 8, true);
}

async function af_resumen(titulo) {
  const t = af_tarjetaBlanca("Resumen", 10);
  if (titulo) agregar(t, await af_txt(titulo, "H3"));
  agregar(t, await af_dato("Servicio", "Corte y peinado"));
  agregar(t, await af_dato("Fecha", "Jueves 19 nov"));
  agregar(t, await af_dato("Hora", "11:00 – 12:00"));
  const linea = figma.createRectangle();
  linea.resize(300, 1);
  await af_fondo(linea, "estado/deshabilitado");
  agregar(t, linea);
  agregar(t, fila("Total", [await af_txt("Total", "H3"), await af_txt("$350", "H3", "primario/base")], 8, true));
  return t;
}

// Se crea un bloque decorativo con degradado que sustituye a la foto del salón
async function af_imagen(alto, etiqueta) {
  const c = marcoFijo(etiqueta, 350, alto);
  c.cornerRadius = 20;
  c.primaryAxisAlignItems = "MIN";
  c.counterAxisAlignItems = "MAX";
  c.paddingLeft = c.paddingBottom = 16;
  const a = hexARgb("F8E8EC");
  const b = hexARgb("C98AA3");
  c.fills = [{
    type: "GRADIENT_LINEAR",
    gradientTransform: [[0.7, 0.7, -0.2], [-0.7, 0.7, 0.5]],
    gradientStops: [
      { position: 0, color: { r: a.r, g: a.g, b: a.b, a: 1 } },
      { position: 1, color: { r: b.r, g: b.g, b: b.b, a: 1 } },
    ],
  }];
  c.appendChild(await af_txt(etiqueta, "Pequeño", "texto/principal"));
  return c;
}

// Se arma el calendario con instancias del componente Día calendario
async function af_calendario() {
  const cal = af_tarjetaBlanca("Calendario", 8);
  cal.paddingLeft = cal.paddingRight = 12;
  agregar(cal, fila("Mes", [
    await af_txt("‹", "H3", "primario/base"),
    await af_txt("Noviembre 2026", "H3"),
    await af_txt("›", "H3", "primario/base"),
  ], 8, true));

  const semana = fila("Días de la semana", [], 0, true);
  for (const d of ["L", "M", "M", "J", "V", "S", "D"]) {
    const c = marcoFijo(d, 44, 24);
    c.appendChild(await af_txt(d, "Pequeño", "texto/secundario"));
    semana.appendChild(c);
  }
  agregar(cal, semana);

  // El 1 de noviembre de 2026 cae en domingo, por eso se dejan 6 espacios al inicio
  const celdas = Array(6).fill(null);
  for (let d = 1; d <= 30; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);

  for (let i = 0; i < celdas.length; i += 7) {
    const renglon = fila("Semana", [], 0, true);
    const grupo = celdas.slice(i, i + 7);
    for (let col = 0; col < 7; col++) {
      const d = grupo[col];
      if (!d) {
        renglon.appendChild(marcoFijo("vacío", 44, 44));
        continue;
      }
      let estado = "Disponible";
      if (d < 11 || col === 6 || d === 25) estado = "Bloqueado";
      else if (d === 11) estado = "Hoy";
      else if (d === 19) estado = "Seleccionado";
      else if (d === 24) estado = "Sin espacio";
      const inst = variante(AF.comp.dia, `Estado=${estado}`).createInstance();
      inst.name = `Día ${d}`;
      await af_textos(inst, [String(d)]);
      renglon.appendChild(inst);
    }
    agregar(cal, renglon);
  }
  return cal;
}

async function af_leyenda() {
  const items = [["fondo/suave", "Disponible"], ["primario/base", "Seleccionado"], ["estado/deshabilitado", "No disponible"]];
  const f = marco("Leyenda", "HORIZONTAL", 16);
  f.counterAxisAlignItems = "CENTER";
  for (const [color, texto] of items) {
    const punto = marcoFijo("Punto", 12, 12);
    punto.cornerRadius = 6;
    await af_fondo(punto, color);
    f.appendChild(fila(texto, [punto, await af_txt(texto, "Pequeño", "texto/secundario")], 6));
  }
  return f;
}

async function af_horarios(horas, seleccionada) {
  const f = marco("Horarios", "HORIZONTAL", 10);
  f.layoutWrap = "WRAP";
  f.counterAxisSpacing = 10;
  for (const h of horas) {
    const inst = variante(AF.comp.horario, `Estado=${h === seleccionada ? "Seleccionado" : "Disponible"}`).createInstance();
    inst.name = "Hora " + h;
    await af_textos(inst, [h]);
    f.appendChild(inst);
  }
  return f;
}

// ----- Pantallas -----

async function afInicio() {
  const p = await af_pantalla("Alta · 01 Inicio");
  agregar(p, await af_encabezado());
  agregar(p, await af_imagen(240, "Foto del salón"));
  agregar(p, await af_txt("Belleza que te hace sentir tú", "H1"));
  agregar(p, await af_txt("Agenda tu cita en menos de un minuto, sin llamadas ni esperas.", "Cuerpo", "texto/secundario"));
  const cta = agregar(p, await af_boton("Agenda tu cita"));
  agregar(p, await af_txt("Servicios", "H2"));
  agregar(p, await af_tarjeta("Corte y peinado", "Corte a tu medida con lavado y peinado incluido.", "60 min", "$350", { boton: "Reservar" }));
  agregar(p, await af_tarjeta("Tinte completo", "Color uniforme de raíz a puntas con productos profesionales.", "120 min", "$900", { boton: "Reservar" }));
  agregar(p, await af_txt("Ver todos los servicios →", "Botón", "primario/base"));
  agregar(p, await af_txt("Encuéntranos", "H2"));
  const mapa = agregar(p, marcoFijo("Mapa", 350, 150));
  mapa.cornerRadius = 20;
  await af_fondo(mapa, "fondo/suave");
  mapa.appendChild(await af_txt("📍 Mapa", "Cuerpo", "primario/hover"));
  agregar(p, await af_txt("Calle ejemplo #123, Toluca, Edo. de México\nLunes a sábado · 10:00 – 19:00", "Pequeño", "texto/secundario"));
  agregar(p, await af_boton("Escríbenos por WhatsApp", "Secundario"));
  return { p, siguiente: cta };
}

async function afServicio() {
  const p = await af_pantalla("Alta · 02 Reserva · Servicio");
  const atras = agregar(p, await af_encabezado("Agenda tu cita", true));
  agregar(p, await af_pasos(1));
  agregar(p, await af_txt("¿Qué servicio quieres?", "H2"));
  agregar(p, await af_tarjeta("Corte y peinado", "Corte a tu medida con lavado y peinado incluido.", "60 min", "$350", { sinBoton: true, seleccionada: true }));
  agregar(p, await af_tarjeta("Tinte completo", "Color uniforme de raíz a puntas.", "120 min", "$900", { sinBoton: true }));
  agregar(p, await af_tarjeta("Manicure", "Limado, cutícula y esmaltado.", "45 min", "$250", { sinBoton: true }));
  agregar(p, await af_tarjeta("Peinado para evento", "Recogido o suelto con ondas.", "90 min", "$600", { sinBoton: true }));
  const sig = agregar(p, await af_boton("Continuar"));
  return { p, siguiente: sig, atras: atras.children[0] };
}

async function afDia() {
  const p = await af_pantalla("Alta · 03 Reserva · Día");
  const atras = agregar(p, await af_encabezado("Agenda tu cita", true));
  agregar(p, await af_pasos(2));
  agregar(p, await af_resumenChip(), false);
  agregar(p, await af_txt("Elige el día", "H2"));
  agregar(p, await af_calendario());
  agregar(p, await af_leyenda(), false);
  const sig = agregar(p, await af_boton("Continuar"));
  return { p, siguiente: sig, atras: atras.children[0] };
}

async function afHora() {
  const p = await af_pantalla("Alta · 04 Reserva · Hora");
  const atras = agregar(p, await af_encabezado("Agenda tu cita", true));
  agregar(p, await af_pasos(3));
  agregar(p, await af_resumenChip(), false);
  agregar(p, await af_txt("Elige la hora", "H2"));
  agregar(p, await af_txt("Jueves 19 de noviembre", "Cuerpo", "texto/secundario"));
  agregar(p, await af_txt("Mañana", "H3"));
  agregar(p, await af_horarios(["10:00", "10:30", "11:00", "11:30", "12:00"], "11:00"));
  agregar(p, await af_txt("Tarde", "H3"));
  agregar(p, await af_horarios(["16:00", "16:30", "17:00", "17:30", "18:00"]));
  agregar(p, await af_txt("Solo se muestran los horarios con espacio para tu servicio.", "Pequeño", "texto/secundario"));
  const sig = agregar(p, await af_boton("Continuar"));
  return { p, siguiente: sig, atras: atras.children[0] };
}

async function afDatos() {
  const p = await af_pantalla("Alta · 05 Reserva · Datos");
  const atras = agregar(p, await af_encabezado("Agenda tu cita", true));
  agregar(p, await af_pasos(4));
  agregar(p, await af_txt("Tus datos", "H2"));
  for (const [etq, ph] of [["Nombre", "Ej. María López"], ["WhatsApp", "10 dígitos"]]) {
    const inp = agregar(p, await af_input(etq, ph));
    // Se estira la caja interna del input al ancho de la pantalla
    const campo = inp.findOne((n) => n.name === "Campo");
    try { if (campo) campo.layoutSizingHorizontal = "FILL"; } catch (e) { /* Se conserva el ancho original */ }
  }
  agregar(p, await af_txt("Te enviaremos la confirmación por WhatsApp.", "Pequeño", "texto/secundario"));
  agregar(p, await af_resumen("Resumen de tu cita"));
  const sig = agregar(p, await af_boton("Confirmar cita"));
  return { p, siguiente: sig, atras: atras.children[0] };
}

async function afConfirmacion() {
  const p = await af_pantalla("Alta · 06 Confirmación");
  p.counterAxisAlignItems = "CENTER";
  agregar(p, await af_encabezado());
  const check = marcoFijo("Éxito", 96, 96);
  check.cornerRadius = 48;
  await af_fondo(check, "primario/base");
  check.appendChild(await af_txt("✓", "H1", "fondo/base"));
  agregar(p, check, false);
  const t = agregar(p, await af_txt("¡Tu cita está agendada!", "H1"));
  t.textAlignHorizontal = "CENTER";
  const s = agregar(p, await af_txt("Te esperamos con mucho gusto. Si necesitas cambiarla, escríbenos.", "Cuerpo", "texto/secundario"));
  s.textAlignHorizontal = "CENTER";
  agregar(p, await af_resumen());
  agregar(p, await af_boton("Enviar resumen por WhatsApp"));
  const volver = agregar(p, await af_boton("Volver al inicio", "Secundario"));
  return { p, siguiente: volver };
}

// Se conecta un elemento con otra pantalla para el prototipo navegable
async function conectar(origen, destino) {
  if (!origen || !destino) return false;
  try {
    await origen.setReactionsAsync([{
      trigger: { type: "ON_CLICK" },
      actions: [{
        type: "NODE",
        destinationId: destino.id,
        navigation: "NAVIGATE",
        transition: { type: "DISSOLVE", easing: { type: "EASE_OUT" }, duration: 0.25 },
        preserveScrollPosition: false,
      }],
    }]);
    return true;
  } catch (e) {
    return false;
  }
}

async function generarAltaFidelidad() {
  AF.colores = await crearEstilosColor();
  AF.textos = await crearEstilosTexto();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  // Se buscan los componentes creados con el comando 2 en todas las páginas
  await figma.loadAllPagesAsync();
  const conjuntos = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET"] });
  const sueltos = figma.root.findAllWithCriteria({ types: ["COMPONENT"] });
  AF.comp.boton = conjuntos.find((c) => c.name === "Botón");
  AF.comp.input = conjuntos.find((c) => c.name === "Input");
  AF.comp.dia = conjuntos.find((c) => c.name === "Día calendario");
  AF.comp.horario = conjuntos.find((c) => c.name === "Horario");
  AF.comp.tarjeta = sueltos.find((c) => c.name === "Tarjeta servicio");
  const faltantes = Object.keys(AF.comp).filter((k) => !AF.comp[k]);
  if (faltantes.length) {
    figma.closePlugin(`Faltan componentes (${faltantes.join(", ")}). Ejecuta primero "2. Crear componentes".`);
    return;
  }

  // Se crea la página de alta fidelidad
  let pagina = figma.root.children.find((pg) => pg.name === "Alta fidelidad");
  if (!pagina) {
    pagina = figma.createPage();
    pagina.name = "Alta fidelidad";
  }
  await figma.setCurrentPageAsync(pagina);

  const pantallas = [];
  for (const crear of [afInicio, afServicio, afDia, afHora, afDatos, afConfirmacion]) {
    pantallas.push(await crear());
  }

  // Se colocan las pantallas como marcos de primer nivel para que el prototipo pueda navegar entre ellas
  const previos = pagina.children.filter((n) => !pantallas.some((x) => x.p === n));
  const baseY = previos.reduce((max, n) => Math.max(max, n.y + n.height + 200), 0);
  const titulo = await af_txt("Reserva · Alta fidelidad", "H1");
  pagina.appendChild(titulo);
  titulo.x = 0;
  titulo.y = baseY;
  pantallas.forEach((s, i) => {
    pagina.appendChild(s.p);
    s.p.x = i * (390 + 80);
    s.p.y = baseY + 100;
  });

  // Se conectan los botones "Continuar" hacia adelante y las flechas de regreso hacia atrás
  let conexiones = 0;
  for (let i = 0; i < pantallas.length; i++) {
    const destino = i === pantallas.length - 1 ? pantallas[0].p : pantallas[i + 1].p;
    if (await conectar(pantallas[i].siguiente, destino)) conexiones++;
    if (pantallas[i].atras && await conectar(pantallas[i].atras, pantallas[i - 1].p)) conexiones++;
  }
  try {
    pagina.flowStartingPoints = [{ nodeId: pantallas[0].p.id, name: "Reserva de cita" }];
  } catch (e) { /* Se puede marcar el inicio del flujo a mano en la pestaña Prototipo */ }

  figma.currentPage.selection = pantallas.map((s) => s.p);
  figma.viewport.scrollAndZoomIntoView(pantallas.map((s) => s.p));
  figma.closePlugin(`Alta fidelidad creada: ${pantallas.length} pantallas y ${conexiones} conexiones de prototipo.`);
}

// Se ejecuta el comando elegido en el menú del plugin
const comandos = {
  guia: generarGuia,
  componentes: generarComponentes,
  wireframes: generarWireframes,
  altaFidelidad: generarAltaFidelidad,
};
const ejecutar = comandos[figma.command] || generarGuia;
ejecutar().catch((error) => {
  figma.closePlugin(`Error: ${error.message}`);
});
