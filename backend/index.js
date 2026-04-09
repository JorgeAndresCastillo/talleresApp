const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Conectar rutas de auth
const authRouter = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
const cochesRouter = require('./routes/coches');
const citasRouter = require('./routes/citas');
const trabajosRouter = require('./routes/trabajos');
const historialRouter = require('./routes/historial');
const inventarioRouter = require('./routes/inventario');
const facturasRouter = require('./routes/facturas');
const notificacionesRouter = require('./routes/notificaciones');
const solicitudesRouter = require('./routes/solicitudes');
app.use('/auth', authRouter);
app.use('/usuarios', usuariosRouter);
app.use('/coches', cochesRouter);
app.use('/citas', citasRouter);
app.use('/trabajos', trabajosRouter);
app.use('/historial', historialRouter);
app.use('/inventario', inventarioRouter);
app.use('/facturas', facturasRouter);
app.use('/notificaciones', notificacionesRouter);
app.use('/solicitudes', solicitudesRouter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend del taller funcionando ✅');
});

// Arrancar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});