# Diseño

Diseño de la interfaz del sistema de citas para el salón de belleza, realizado en Figma antes del desarrollo.

- **Archivo de Figma:** [Sistemas-citas diseño](https://www.figma.com/design/6uMRUxFX94QfGki2HLAC5E/Sistemas-citas-dise%C3%B1o)
- **`plugin-guia-estilo/`:** plugin de Figma que genera por código los estilos de color, los estilos de texto y los componentes base.

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
3. Ejecutar **1. Crear guía de estilo** y después **2. Crear componentes**.
