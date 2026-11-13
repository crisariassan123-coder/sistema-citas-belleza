-- =============================================================================
-- V1: Esquema inicial del sistema de citas del salón de belleza
-- Se crean las tablas del modelo de datos (docs/diagrama-er.md), sus
-- restricciones, índices y los datos base de horario y configuración.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- usuarios: cuenta de acceso al panel (la dueña)
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id            BIGSERIAL    PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    usuario       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    rol           VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- servicios: catálogo que ofrece el salón
-- -----------------------------------------------------------------------------
CREATE TABLE servicios (
    id             BIGSERIAL     PRIMARY KEY,
    nombre         VARCHAR(100)  NOT NULL,
    descripcion    VARCHAR(255),
    duracion_min   SMALLINT      NOT NULL,
    precio         NUMERIC(10,2) NOT NULL,
    activo         BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT now(),
    -- Se exige una duración en múltiplos de 15 minutos (RN-01)
    CONSTRAINT servicios_duracion_valida CHECK (duracion_min > 0 AND duracion_min % 15 = 0),
    CONSTRAINT servicios_precio_valido   CHECK (precio >= 0)
);

-- -----------------------------------------------------------------------------
-- horario_semanal: un registro por día (1 = lunes ... 7 = domingo, ISO-8601)
-- -----------------------------------------------------------------------------
CREATE TABLE horario_semanal (
    id          BIGSERIAL PRIMARY KEY,
    dia_semana  SMALLINT  NOT NULL UNIQUE,
    laborable   BOOLEAN   NOT NULL DEFAULT FALSE,
    hora_inicio TIME,
    hora_fin    TIME,
    CONSTRAINT horario_dia_valido CHECK (dia_semana BETWEEN 1 AND 7),
    -- Se exige un rango de horas válido solo en los días laborables
    CONSTRAINT horario_horas_validas CHECK (
        NOT laborable
        OR (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL AND hora_inicio < hora_fin)
    )
);

-- -----------------------------------------------------------------------------
-- bloqueos: días inhábiles, vacaciones u horas específicas
-- -----------------------------------------------------------------------------
CREATE TABLE bloqueos (
    id           BIGSERIAL    PRIMARY KEY,
    tipo         VARCHAR(10)  NOT NULL,
    fecha_inicio DATE         NOT NULL,
    fecha_fin    DATE         NOT NULL,
    hora_inicio  TIME,
    hora_fin     TIME,
    motivo       VARCHAR(150),
    creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT bloqueos_tipo_valido   CHECK (tipo IN ('DIA', 'RANGO', 'HORAS')),
    CONSTRAINT bloqueos_fechas_validas CHECK (fecha_fin >= fecha_inicio),
    -- Se valida la forma de cada tipo: solo HORAS lleva horas y es de un solo día
    CONSTRAINT bloqueos_forma_valida CHECK (
        (tipo = 'HORAS'
            AND fecha_inicio = fecha_fin
            AND hora_inicio IS NOT NULL AND hora_fin IS NOT NULL
            AND hora_inicio < hora_fin)
        OR (tipo = 'DIA'
            AND fecha_inicio = fecha_fin
            AND hora_inicio IS NULL AND hora_fin IS NULL)
        OR (tipo = 'RANGO'
            AND hora_inicio IS NULL AND hora_fin IS NULL)
    )
);

CREATE INDEX idx_bloqueos_fechas ON bloqueos (fecha_inicio, fecha_fin);

-- -----------------------------------------------------------------------------
-- clientas: se identifican por su WhatsApp a 10 dígitos (RN-11)
-- -----------------------------------------------------------------------------
CREATE TABLE clientas (
    id        BIGSERIAL    PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL,
    telefono  VARCHAR(10)  NOT NULL UNIQUE,
    creado_en TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT clientas_telefono_valido CHECK (telefono ~ '^[0-9]{10}$')
);

-- -----------------------------------------------------------------------------
-- citas
-- -----------------------------------------------------------------------------
CREATE TABLE citas (
    id             BIGSERIAL     PRIMARY KEY,
    clienta_id     BIGINT        NOT NULL REFERENCES clientas (id),
    servicio_id    BIGINT        NOT NULL REFERENCES servicios (id),
    fecha          DATE          NOT NULL,
    hora_inicio    TIME          NOT NULL,
    hora_fin       TIME          NOT NULL,
    precio         NUMERIC(10,2) NOT NULL,
    estado         VARCHAR(12)   NOT NULL DEFAULT 'PENDIENTE',
    notas          VARCHAR(255),
    creado_en      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT citas_horas_validas  CHECK (hora_inicio < hora_fin),
    CONSTRAINT citas_precio_valido  CHECK (precio >= 0),
    CONSTRAINT citas_estado_valido  CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA')),
    -- Se impide que dos citas activas se traslapen en el tiempo (RNF-06, RN-07)
    CONSTRAINT citas_sin_empalmes EXCLUDE USING gist (
        tsrange(fecha + hora_inicio, fecha + hora_fin) WITH &&
    ) WHERE (estado IN ('PENDIENTE', 'CONFIRMADA'))
);

CREATE INDEX idx_citas_fecha   ON citas (fecha);
CREATE INDEX idx_citas_clienta ON citas (clienta_id);

-- -----------------------------------------------------------------------------
-- configuracion: una sola fila con los datos del salón
-- -----------------------------------------------------------------------------
CREATE TABLE configuracion (
    id                     SMALLINT     PRIMARY KEY DEFAULT 1,
    nombre_salon           VARCHAR(100) NOT NULL,
    whatsapp               VARCHAR(10)  NOT NULL,
    direccion              VARCHAR(200),
    anticipacion_min_horas SMALLINT     NOT NULL DEFAULT 2,
    intervalo_min          SMALLINT     NOT NULL DEFAULT 15,
    dias_max_reserva       SMALLINT     NOT NULL DEFAULT 60,
    -- Se garantiza que solo exista una fila
    CONSTRAINT configuracion_fila_unica       CHECK (id = 1),
    CONSTRAINT configuracion_whatsapp_valido  CHECK (whatsapp ~ '^[0-9]{10}$'),
    CONSTRAINT configuracion_valores_validos  CHECK (
        anticipacion_min_horas >= 0 AND intervalo_min > 0 AND dias_max_reserva > 0
    )
);

-- -----------------------------------------------------------------------------
-- Datos base
-- -----------------------------------------------------------------------------

-- Se registra un horario inicial que la dueña podrá ajustar desde el panel
INSERT INTO horario_semanal (dia_semana, laborable, hora_inicio, hora_fin) VALUES
    (1, TRUE,  '10:00', '19:00'),
    (2, TRUE,  '10:00', '19:00'),
    (3, TRUE,  '10:00', '19:00'),
    (4, TRUE,  '10:00', '19:00'),
    (5, TRUE,  '10:00', '19:00'),
    (6, TRUE,  '09:00', '15:00'),
    (7, FALSE, NULL,    NULL);

-- Se crea la configuración con datos de ejemplo que se editarán desde el panel
INSERT INTO configuracion (id, nombre_salon, whatsapp, direccion)
VALUES (1, 'Salón Aurora', '7220000000', 'Toluca, Estado de México');
