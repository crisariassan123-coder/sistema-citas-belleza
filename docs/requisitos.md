# Requisitos del sistema

Sistema web de citas para un salón de belleza atendido por una sola persona (la dueña). Las clientas reservan en línea según la disponibilidad real de la dueña, y ella administra su agenda, sus servicios, su horario y sus días no laborables desde un panel privado.

## 1. Actores

| Actor | Descripción | Acceso |
|---|---|---|
| **Clienta** | Mujer que agenda una cita desde su celular o computadora. | Sitio público, sin cuenta. Se identifica por su número de WhatsApp. |
| **Dueña** | Única profesional del salón; administra el sistema. | Panel privado con usuario y contraseña (rol `ADMIN`). |

## 2. Requisitos funcionales

### Sitio público (clienta)
| ID | Requisito |
|---|---|
| RF-01 | Se muestra una página de inicio con presentación del salón, servicios destacados, ubicación y acceso a reservar. |
| RF-02 | Se muestra el catálogo de servicios activos con nombre, descripción, duración y precio. |
| RF-03 | Se muestra un calendario donde se distinguen los días con espacio, los días sin espacio y los días bloqueados. |
| RF-04 | Se muestran solo los horarios disponibles para el servicio y día elegidos. |
| RF-05 | La clienta agenda una cita en cuatro pasos: servicio → día → hora → datos (nombre y WhatsApp). |
| RF-06 | Se muestra una confirmación con el resumen de la cita y un botón para enviarlo por WhatsApp. |

### Panel de la dueña
| ID | Requisito |
|---|---|
| RF-07 | La dueña inicia y cierra sesión de forma segura. |
| RF-08 | La dueña da de alta, edita y desactiva servicios. |
| RF-09 | La dueña define su horario semanal por día, incluidos los días que no labora. |
| RF-10 | La dueña bloquea un día completo, un rango de fechas (vacaciones) u horas específicas de un día. |
| RF-11 | La dueña consulta su agenda por día y por semana. |
| RF-12 | La dueña cambia el estado de una cita: confirmar, completar o cancelar. |
| RF-13 | La dueña contacta a la clienta por WhatsApp con un mensaje prellenado. |
| RF-14 | La dueña configura los datos del salón (nombre, WhatsApp, dirección, anticipación mínima). |

## 3. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-01 | Usabilidad | El sitio público se diseña primero para móvil (390 px) y se adapta a escritorio. |
| RNF-02 | Usabilidad | Una reserva se completa en menos de un minuto y en un máximo de cuatro pasos. |
| RNF-03 | Seguridad | Las contraseñas se almacenan cifradas con BCrypt. |
| RNF-04 | Seguridad | Las rutas `/admin/**` requieren el rol `ADMIN`; los formularios usan protección CSRF. |
| RNF-05 | Seguridad | Las credenciales y secretos se leen de variables de entorno y nunca se suben al repositorio. |
| RNF-06 | Integridad | La base de datos impide guardar dos citas activas que se traslapen, aun con reservas simultáneas. |
| RNF-07 | Mantenibilidad | El esquema de base de datos se versiona con migraciones Flyway. |
| RNF-08 | Calidad | La lógica de disponibilidad y de citas tiene pruebas automatizadas que se ejecutan en CI. |
| RNF-09 | Portabilidad | La aplicación y la base de datos se levantan con `docker compose up`. |
| RNF-10 | Accesibilidad | Los textos cumplen contraste WCAG AA y los elementos táctiles miden al menos 44 px. |

## 4. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | La duración de un servicio es múltiplo de 15 minutos. |
| RN-02 | Los horarios se ofrecen en intervalos de `intervalo_min` (15 min por defecto) dentro del horario laboral del día. |
| RN-03 | Una cita debe caber completa dentro del horario laboral: su hora de fin no puede pasar del cierre. |
| RN-04 | No se ofrecen horarios que se traslapen con citas activas (`PENDIENTE` o `CONFIRMADA`) ni con bloqueos. |
| RN-05 | No se ofrecen horarios con menos de `anticipacion_min_horas` de anticipación. |
| RN-06 | No se puede reservar con más de `dias_max_reserva` días de anticipación. |
| RN-07 | Una cita cancelada libera su horario de inmediato. |
| RN-08 | El precio del servicio se copia a la cita al crearla, para conservar lo cobrado aunque el precio cambie después. |
| RN-09 | Si se crea un bloqueo que incluye citas activas, se avisa a la dueña; las citas no se cancelan automáticamente. |
| RN-10 | Un servicio con citas registradas no se elimina, solo se desactiva. |
| RN-11 | La clienta se identifica por su teléfono (10 dígitos); si ya existe, se reutiliza su registro. |
| RN-12 | Transiciones de estado permitidas: `PENDIENTE → CONFIRMADA → COMPLETADA` y `PENDIENTE / CONFIRMADA → CANCELADA`. `COMPLETADA` y `CANCELADA` son estados finales. |
| RN-13 | Antes de guardar una cita se vuelve a validar la disponibilidad en el servidor. |

## 5. Historias de usuario

### Acceso
**HU-01 · Iniciar sesión como dueña**
*Como dueña quiero iniciar sesión para administrar mi salón sin que otras personas entren.*
- [ ] Contraseña cifrada con BCrypt (RNF-03).
- [ ] Las rutas `/admin/**` exigen el rol `ADMIN` (RNF-04).
- [ ] El usuario inicial se crea por migración y su contraseña se toma de una variable de entorno.

**HU-02 · Cerrar sesión**
*Como dueña quiero cerrar sesión para proteger mi panel en equipos compartidos.*
- [ ] Botón visible en el panel; al cerrar se redirige al inicio.

### Servicios
**HU-03 · Gestionar servicios**
*Como dueña quiero registrar mis servicios con duración y precio para que las clientas sepan qué ofrezco.*
- [ ] Alta, edición y desactivación (RN-10).
- [ ] Duración en múltiplos de 15 minutos (RN-01).
- [ ] Validación de campos obligatorios.

**HU-04 · Ver catálogo de servicios**
*Como clienta quiero ver los servicios con precio y duración para decidir qué agendar.*
- [ ] Solo se muestran servicios activos.
- [ ] Tarjetas legibles en móvil.

### Horario y bloqueos
**HU-05 · Definir horario semanal**
*Como dueña quiero indicar qué días y en qué horario trabajo para que solo se ofrezcan esos horarios.*
- [ ] Hora de inicio y fin por día; un día puede marcarse como no laborable.
- [ ] Se valida que la hora de inicio sea menor que la de fin.

**HU-06 · Bloquear un día completo**
*Como dueña quiero marcar un día como inhábil para que nadie agende ese día.*

**HU-07 · Registrar vacaciones**
*Como dueña quiero bloquear un rango de fechas para tomar vacaciones.*
- [ ] Fecha de inicio menor o igual a la de fin.
- [ ] Aviso si ya existen citas dentro del rango (RN-09).

**HU-08 · Bloquear horas específicas**
*Como dueña quiero bloquear solo unas horas de un día para atender un pendiente.*

### Reserva
**HU-09 · Calcular horarios disponibles**
*Como clienta quiero ver solo horarios realmente libres para no elegir uno ocupado.*
- [ ] Considera horario semanal, bloqueos, citas activas y duración del servicio (RN-02 a RN-06).
- [ ] Endpoint `GET /api/disponibilidad?servicioId=&fecha=`.
- [ ] Pruebas con casos límite: cita al final del turno, bloqueo parcial, día de vacaciones.

**HU-10 · Ver calendario de días disponibles**
*Como clienta quiero ver un calendario donde se distingan los días con espacio.*
- [ ] Días pasados, bloqueados o sin espacio aparecen deshabilitados.
- [ ] Navegación entre meses.

**HU-11 · Agendar cita por pasos**
*Como clienta quiero agendar en pocos pasos para hacerlo rápido desde mi celular.*
- [ ] Flujo: servicio → día → hora → datos → confirmación, con indicador de progreso.
- [ ] Se vuelve a validar la disponibilidad al guardar (RN-13).

**HU-12 · Ver confirmación de cita**
*Como clienta quiero ver el resumen de mi cita para tener la información a la mano.*
- [ ] Muestra servicio, fecha, hora y precio.
- [ ] Botón para enviar el resumen por WhatsApp a la dueña.

**HU-13 · Página de inicio atractiva**
*Como clienta quiero una página clara y bonita que me invite a agendar.*

### Panel de citas
**HU-14 · Ver agenda del día y la semana**
*Como dueña quiero ver mis citas por día y semana para organizarme.*

**HU-15 · Cambiar estado de una cita**
*Como dueña quiero confirmar, completar o cancelar citas para llevar el control de mi agenda.*
- [ ] Solo se permiten las transiciones de RN-12.
- [ ] Al cancelar, el horario vuelve a quedar libre (RN-07).

**HU-16 · Contactar a la clienta por WhatsApp**
*Como dueña quiero escribirle a la clienta con un clic para confirmar o recordarle su cita.*

**HU-17 · Configurar datos del salón**
*Como dueña quiero editar el nombre, teléfono, dirección y anticipación mínima para personalizar el sitio.*

## 6. Fuera de alcance (versión 1)

- Pagos en línea o anticipos.
- Cuentas de usuario para clientas.
- Envío automático de recordatorios (WhatsApp Business API o correo).
- Más de una profesional o sucursal.

## Referencias

- Modelo de datos: [diagrama-er.md](diagrama-er.md)
- Diseño y prototipo: [diseno/README.md](diseno/README.md)
