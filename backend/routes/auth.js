// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // Para encriptar contraseñas
const pool = require("../db"); // Conexión a PostgreSQL

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { nombre, dni, email, contrasena, movil, rol } = req.body;

    // Validación básica
    if (!nombre || !dni || !email || !contrasena || !movil) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    // Verificar si ya existe usuario con mismo email, dni o móvil
    const userCheck = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1 OR dni = $2 OR movil = $3",
      [email, dni, movil],
    );

    if (userCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ msg: "Usuario ya registrado con email, DNI o móvil" });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    // Insertar usuario en la base de datos
    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, dni, email, contrasena, movil, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [nombre, dni, email, hashedPassword, movil, rol || "cliente"],
    );

    // Respuesta exitosa
    res
      .status(201)
      .json({ msg: "Usuario registrado", usuario: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});
// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    // Validación básica
    if (!email || !contrasena) {
      return res
        .status(400)
        .json({ msg: "Email y contrasena son obligatorios" });
    }

    // Buscar usuario por email
    const userQuery = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email],
    );

    if (userQuery.rows.length === 0) {
      return res.status(400).json({ msg: "Usuario no encontrado" });
    }

    const user = userQuery.rows[0];

    // Comparar contraseña con la encriptada
    const isMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!isMatch) {
      return res.status(400).json({ msg: "Contrasena incorrecta" });
    }

    // Crear token JWT
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      "TU_SECRETO_SUPER_SEGURO", // Cambia esto por una variable de entorno
      { expiresIn: "8h" }, // Token válido 8 horas
    );

    res.status(200).json({ msg: "Login exitoso", token, id: user.id, rol: user.rol, email: user.email, nombre: user.nombre });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});
module.exports = router;
