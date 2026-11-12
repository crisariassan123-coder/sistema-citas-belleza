# Diseño

Diseño de la interfaz del sistema de citas para el salón de belleza, realizado en Figma antes del desarrollo.

- **Archivo de Figma:** [Sistemas-citas diseño](https://www.figma.com/design/6uMRUxFX94QfGki2HLAC5E/Sistemas-citas-dise%C3%B1o)
- **`plugin-guia-estilo/`:** plugin de Figma que genera por código los estilos de color, los estilos de texto, los componentes base, los wireframes y el prototipo de alta fidelidad.

## Guía de estilo

| Token | Hex | Uso |
|---|---|---|
| primario/base | `#A84D70` | Botones principales, día seleccionado |
| primario/hover | `#8E3D5D` | Hover y estado activo |
| fondo/suave | `#F8E8EC` | Secciones alternas, días disponibles |
| fondo/base | `#FBF6F2` | Fondo general |
| acento/dorado | `#C9A15B` | Detalles decorativos |
| texto/principal | `#3A2A30` | Títulos y texto |
| texto/secundario | `#7A6870` | Descripciones y ayudas |
| estado/deshabilitado | `#D9D0D3` | Días bloqueados u ocupados |

Tipografías: **Playfair Display** (títulos) y **DM Sans** (texto e interfaz).

## Cómo ejecutar el plugin

1. Abrir el archivo en la app de escritorio de Figma.
2. Plugins → Desarrollo → Importar plugin desde manifiesto → seleccionar `plugin-guia-estilo/manifest.json`.
3. Ejecutar en orden:
   - **1. Crear guía de estilo**: estilos de color y de texto.
   - **2. Crear componentes**: botón, input, día del calendario, horario y tarjeta de servicio.
   - **3. Crear wireframes**: 12 pantallas móviles de baja fidelidad en la página *Wireframes*.
   - **4. Crear alta fidelidad (reserva)**: Inicio y flujo de reserva con los estilos y componentes reales, conectados como prototipo navegable en la página *Alta fidelidad*.

## Pantallas (wireframes)

| Sitio público | Panel de la dueña |
|---|---|
| 01 Inicio | 07 Login |
| 02 Reserva · Servicio | 08 Agenda |
| 03 Reserva · Día | 09 Detalle de cita |
| 04 Reserva · Hora | 10 Bloqueos y vacaciones |
| 05 Reserva · Datos | 11 Servicios |
| 06 Confirmación | 12 Horario semanal |

## Prototipo navegable

El flujo **Reserva de cita** recorre: Inicio → Servicio → Día → Hora → Datos → Confirmación. Los botones *Continuar* avanzan y las flechas de regreso vuelven al paso anterior.

- **Ver prototipo:** _(pegar aquí el enlace de presentación de Figma)_
