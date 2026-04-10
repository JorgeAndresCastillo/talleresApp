const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("authenticate - token:", token);
  if (!token) return res.status(401).json({ msg: "Token requerido" });
  try {
    const decoded = jwt.verify(token, "TU_SECRETO_SUPER_SEGURO");
    console.log("authenticate - decoded:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("authenticate - error:", err.message);
    res.status(401).json({ msg: "Token inválido" });
  }
};

router.post("/", authenticate, async (req, res) => {
  try {
    const { matricula, marca, modelo, anio, kilometraje, cliente_id } = req.body;
    if (!matricula) return res.status(400).json({ msg: "Matrícula obligatoria" });
    let ownerId, estado;
    if (req.user.rol === "admin") {
      ownerId = cliente_id || req.user.id;
      estado = "aprobado";
    } else {
      ownerId = req.user.id;
      estado = "pendiente";
    }
    const result = await pool.query(
      "INSERT INTO coches (matricula, marca, modelo, anio, kilometraje, cliente_id, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [matricula, marca, modelo, anio, kilometraje, ownerId, estado]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ msg: "Matrícula ya existe" });
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    console.log("GET /coches - user:", req.user);
    let query, params;
    if (req.user.rol === "admin") {
      query = "SELECT c.*, u.nombre as cliente_nombre FROM coches c JOIN usuarios u ON c.cliente_id = u.id";
      params = [];
    } else if (req.user.rol === "mecanico") {
      query = "SELECT c.*, u.nombre as cliente_nombre FROM coches c JOIN usuarios u ON c.cliente_id = u.id";
      params = [];
    } else {
      query = "SELECT * FROM coches WHERE cliente_id = $1";
      params = [req.user.id];
    }
    console.log("Query:", query, "Params:", params);
    const result = await pool.query(query, params);
    console.log("Result rows:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const { marca, modelo, anio, kilometraje, itv_vigencia } = req.body;
    let query, params;
    
    if (req.user.rol === "admin") {
      query = "UPDATE coches SET marca = COALESCE($1, marca), modelo = COALESCE($2, modelo), anio = COALESCE($3, anio), kilometraje = COALESCE($4, kilometraje), itv_vigencia = COALESCE($5, itv_vigencia) WHERE id = $6 RETURNING *";
      params = [marca, modelo, anio, kilometraje, itv_vigencia, req.params.id];
    } else if (req.user.rol === "mecanico") {
      query = "UPDATE coches SET marca = COALESCE($1, marca), modelo = COALESCE($2, modelo), anio = COALESCE($3, anio), kilometraje = COALESCE($4, kilometraje), itv_vigencia = COALESCE($5, itv_vigencia) WHERE id = $6 RETURNING *";
      params = [marca, modelo, anio, kilometraje, itv_vigencia, req.params.id];
    } else {
      query = "UPDATE coches SET marca = COALESCE($1, marca), modelo = COALESCE($2, modelo), anio = COALESCE($3, anio), kilometraje = COALESCE($4, kilometraje), itv_vigencia = COALESCE($5, itv_vigencia) WHERE id = $6 AND cliente_id = $7 RETURNING *";
      params = [marca, modelo, anio, kilometraje, itv_vigencia, req.params.id, req.user.id];
    }
    
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Coche no encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id/matricula", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "admin") {
      return res.status(403).json({ msg: "Solo admin puede cambiar matrícula" });
    }
    const { matricula } = req.body;
    if (!matricula) return res.status(400).json({ msg: "Matrícula obligatoria" });
    
    const result = await pool.query(
      "UPDATE coches SET matricula = $1 WHERE id = $2 RETURNING *",
      [matricula, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: "Coche no encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ msg: "Matrícula ya existe" });
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:matricula", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "admin" && req.user.rol !== "mecanico") {
      return res.status(403).json({ msg: "Solo admin o mecanico" });
    }
    const coche = await pool.query("SELECT id, cliente_id FROM coches WHERE matricula = $1", [req.params.matricula]);
    if (coche.rows.length === 0) return res.status(404).json({ msg: "Coche no encontrado" });
    const cocheId = coche.rows[0].id;
    if (req.user.rol === "mecanico" && coche.rows[0].cliente_id !== req.user.id) {
      return res.status(403).json({ msg: "Solo puedes eliminar tus propios coches" });
    }
    await pool.query("DELETE FROM historial WHERE coche_id = $1", [cocheId]);
    await pool.query("DELETE FROM citas WHERE coche_id = $1", [cocheId]);
    await pool.query("DELETE FROM trabajos WHERE coche_id = $1", [cocheId]);
    const result = await pool.query("DELETE FROM coches WHERE matricula = $1 RETURNING *", [req.params.matricula]);
    res.json({ msg: "Coche eliminado" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:matricula/estado", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "admin") {
      return res.status(403).json({ msg: "Solo admin" });
    }
    const { estado } = req.body;
    const result = await pool.query(
      "UPDATE coches SET estado = $1 WHERE matricula = $2 RETURNING *",
      [estado, req.params.matricula]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: "Coche no encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id/itv", authenticate, async (req, res) => {
  try {
    const { itv_vigencia } = req.body;
    if (req.user.rol === "cliente") {
      const coche = await pool.query("SELECT id FROM coches WHERE id = $1 AND cliente_id = $2", [req.params.id, req.user.id]);
      if (coche.rows.length === 0) return res.status(403).json({ msg: "No tienes permisos" });
    }
    const result = await pool.query(
      "UPDATE coches SET itv_vigencia = $1 WHERE id = $2 RETURNING *",
      [itv_vigencia, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: "Coche no encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/alerts/itv", authenticate, async (req, res) => {
  try {
    let query;
    if (req.user.rol === "admin" || req.user.rol === "mecanico") {
      query = "SELECT c.*, u.nombre as cliente_nombre FROM coches c JOIN usuarios u ON c.cliente_id = u.id WHERE c.itv_vigencia IS NOT NULL ORDER BY c.itv_vigencia ASC";
    } else {
      query = "SELECT * FROM coches WHERE cliente_id = $1 AND itv_vigencia IS NOT NULL ORDER BY itv_vigencia ASC";
    }
    const params = req.user.rol === "cliente" ? [req.user.id] : [];
    const result = await pool.query(query, params);
    
    const today = new Date();
    const alerts = result.rows.map(coche => {
      const itvDate = new Date(coche.itv_vigencia);
      const daysUntil = Math.ceil((itvDate - today) / (1000 * 60 * 60 * 24));
      let status = 'ok';
      if (daysUntil < 0) status = 'expired';
      else if (daysUntil <= 30) status = 'urgent';
      else if (daysUntil <= 60) status = 'warning';
      return { ...coche, days_until_itv: daysUntil, status };
    });
    
    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

module.exports = router;
