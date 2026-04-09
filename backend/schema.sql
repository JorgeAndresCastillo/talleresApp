CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    movil VARCHAR(20) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coches (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    anio INTEGER,
    kilometraje INTEGER,
    cliente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'pendiente',
    itv_vigencia DATE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE citas (
    id SERIAL PRIMARY KEY,
    coche_id INTEGER REFERENCES coches(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    mecanico_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trabajos (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER REFERENCES citas(id) ON DELETE CASCADE,
    mecanico_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    coche_id INTEGER REFERENCES coches(id) ON DELETE CASCADE,
    descripcion TEXT,
    precio DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'pendiente',
    hora_inicio TIMESTAMP,
    hora_fin TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial (
    id SERIAL PRIMARY KEY,
    coche_id INTEGER REFERENCES coches(id) ON DELETE CASCADE,
    descripcion TEXT,
    tipo VARCHAR(50),
    kilometraje INTEGER,
    precio DECIMAL(10,2),
    fecha DATE DEFAULT CURRENT_DATE,
    siguiente_fecha DATE,
    siguiente_kilometraje INTEGER,
    mecanico_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cantidad INTEGER DEFAULT 0,
    precio DECIMAL(10,2),
    categoria VARCHAR(50),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facturas (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER REFERENCES citas(id) ON DELETE SET NULL,
    cliente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    importe DECIMAL(10,2),
    fecha DATE,
    estado VARCHAR(20) DEFAULT 'pendiente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje TEXT,
    leida BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE solicitudes_matricula (
    id SERIAL PRIMARY KEY,
    coche_id INTEGER REFERENCES coches(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    matricula_anterior VARCHAR(20) NOT NULL,
    matricula_nueva VARCHAR(20) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
