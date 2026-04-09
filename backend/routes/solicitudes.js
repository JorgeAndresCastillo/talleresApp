const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "Token requerido" });
  try {
    req.user = jwt.verify(token, "TU_SECRETO_SUPER_SEGURO");
    next();
  } catch {
    res.status(401).json({ msg: "Token inválido" });
  }
};

router.get("/", authenticate, async (req, res) => {
  try {
    if (req.user.rol === "admin") {
      const result = await pool.query(
        "SELECT s.*, c.matricula as coche_matricula, c.marca, c.modelo, u.nombre as cliente_nombre FROM solicitudes_matricula s JOIN coches c ON s.coche_id = c.id JOIN usuarios u ON s.cliente_id = u.id WHERE s.estado = 'pendiente' ORDER BY s.creado_en DESC"
      );
      res.json(result.rows);
    } else {
      const result = await pool.query(
        "SELECT * FROM solicitudes_matricula WHERE cliente_id = $1 ORDER BY creado_en DESC",
        [req.user.id]
      );
      res.json(result.rows);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { coche_id, matricula_nueva } = req.body;
    
    const coche = await pool.query("SELECT id, matricula, cliente_id FROM coches WHERE id = $1", [coche_id]);
    if (coche.rows.length === 0) return res.status(404).json({ msg: "Coche no encontrado" });
    if (coche.rows[0].cliente_id !== req.user.id && req.user.rol !== "admin") {
      return res.status(403).json({ msg: "No tienes permisos" });
    }
    
    const result = await pool.query(
      "INSERT INTO solicitudes_matricula (coche_id, cliente_id, matricula_anterior, matricula_nueva) VALUES ($1, $2, $3, $4) RETURNING *",
      [coche_id, req.user.id, coche.rows[0].matricula, matricula_nueva]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ msg: "Ya existe una solicitud pendiente para este coche" });
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id/aprobar", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "admin") return res.status(403).json({ msg: "Solo admin" });
    
    const solicitud = await pool.query("SELECT * FROM solicitudes_matricula WHERE id = $1", [req.params.id]);
    if (solicitud.rows.length === 0) return res.status(404).json({ msg: "Solicitud no encontrada" });
    
    await pool.query("UPDATE coches SET matricula = $1 WHERE id = $2", [solicitud.rows[0].matricula_nueva, solicitud.rows[0].coche_id]);
    await pool.query("UPDATE solicitudes_matricula SET estado = 'aprobada' WHERE id = $1", [req.params.id]);
    
    res.json({ msg: "Matrícula actualizada" });
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ msg: "La nueva matrícula ya existe" });
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id/rechazar", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "admin") return res.status(403).json({ msg: "Solo admin" });
    
    await pool.query("UPDATE solicitudes_matricula SET estado = 'rechazada' WHERE id = $1", [req.params.id]);
    res.json({ msg: "Solicitud rechazada" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

module.exports = router;
