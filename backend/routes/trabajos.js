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

router.post("/", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "admin" && req.user.rol !== "mecanico") {
      return res.status(403).json({ msg: "Solo admin o mecanico" });
    }
    const { matricula, descripcion, precio } = req.body;
    if (!matricula || !descripcion) return res.status(400).json({ msg: "Matrícula y descripción obligatorias" });
    const coche = await pool.query("SELECT id FROM coches WHERE matricula = $1", [matricula]);
    if (coche.rows.length === 0) return res.status(404).json({ msg: "Coche no encontrado" });
    const result = await pool.query(
      "INSERT INTO trabajos (coche_id, mecanico_id, descripcion, precio) VALUES ($1, $2, $3, $4) RETURNING *",
      [coche.rows[0].id, req.user.id, descripcion, precio]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    let query, params;
    if (req.user.rol === "admin" || req.user.rol === "mecanico") {
      query = "SELECT t.*, c.matricula, c.marca, c.modelo, m.nombre as mecanico_nombre FROM trabajos t JOIN coches c ON t.coche_id = c.id JOIN usuarios m ON t.mecanico_id = m.id";
      params = [];
    } else {
      query = "SELECT t.*, c.matricula, c.marca, c.modelo FROM trabajos t JOIN coches c ON t.coche_id = c.id WHERE c.cliente_id = $1";
      params = [req.user.id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/mis-trabajos", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "mecanico") {
      return res.status(403).json({ msg: "Solo mecanicos" });
    }
    const result = await pool.query(
      "SELECT t.*, c.matricula, c.marca, c.modelo, ci.fecha as cita_fecha, ci.hora as cita_hora FROM trabajos t JOIN coches c ON t.coche_id = c.id LEFT JOIN citas ci ON t.cita_id = ci.id WHERE t.mecanico_id = $1 ORDER BY t.estado ASC, t.creado_en DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    let query = "SELECT t.*, c.matricula, c.marca, c.modelo, m.nombre as mecanico_nombre FROM trabajos t JOIN coches c ON t.coche_id = c.id LEFT JOIN usuarios m ON t.mecanico_id = m.id WHERE t.id = $1";
    if (req.user.rol === "cliente") {
      query += " AND c.cliente_id = $2";
    }
    const params = req.user.rol === "cliente" ? [req.params.id, req.user.id] : [req.params.id];
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Trabajo no encontrado" });
    
    const trabajo = result.rows[0];
    if (trabajo.hora_inicio && trabajo.hora_fin) {
      const inicio = new Date(trabajo.hora_inicio);
      const fin = new Date(trabajo.hora_fin);
      const duracionMs = fin - inicio;
      const horas = Math.floor(duracionMs / (1000 * 60 * 60));
      const minutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
      trabajo.tiempo_trabajo = `${horas}h ${minutos}m`;
    }
    res.json(trabajo);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "admin" && req.user.rol !== "mecanico") {
      return res.status(403).json({ msg: "Solo admin o mecanico" });
    }
    const { descripcion, precio, estado, matricula } = req.body;
    let cocheId;
    if (matricula) {
      const coche = await pool.query("SELECT id FROM coches WHERE matricula = $1", [matricula]);
      if (coche.rows.length === 0) return res.status(404).json({ msg: "Coche no encontrado" });
      cocheId = coche.rows[0].id;
    }
    let query, params;
    if (req.user.rol === "admin") {
      query = "UPDATE trabajos SET descripcion = COALESCE($1, descripcion), precio = COALESCE($2, precio), estado = COALESCE($3, estado), coche_id = COALESCE($4, coche_id) WHERE id = $5 RETURNING *";
      params = [descripcion, precio, estado, cocheId, req.params.id];
    } else {
      query = "UPDATE trabajos SET descripcion = COALESCE($1, descripcion), precio = COALESCE($2, precio), estado = COALESCE($3, estado) WHERE id = $4 AND mecanico_id = $5 RETURNING *";
      params = [descripcion, precio, estado, req.params.id, req.user.id];
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Trabajo no encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "admin" && req.user.rol !== "mecanico") {
      return res.status(403).json({ msg: "Solo admin o mecanico" });
    }
    let query, params;
    if (req.user.rol === "admin") {
      query = "DELETE FROM trabajos WHERE id = $1 RETURNING id";
      params = [req.params.id];
    } else {
      query = "DELETE FROM trabajos WHERE id = $1 AND mecanico_id = $2 RETURNING id";
      params = [req.params.id, req.user.id];
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Trabajo no encontrado" });
    res.json({ msg: "Trabajo eliminado" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id/iniciar", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "admin" && req.user.rol !== "mecanico") {
      return res.status(403).json({ msg: "Solo admin o mecanico" });
    }
    const result = await pool.query(
      "UPDATE trabajos SET hora_inicio = CURRENT_TIMESTAMP, estado = 'en_proceso' WHERE id = $1 AND (mecanico_id = $2 OR $3 = 'admin') RETURNING *",
      [req.params.id, req.user.id, req.user.rol]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: "Trabajo no encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === "42703") {
      res.status(500).json({ msg: "Columna hora_inicio no existe. Ejecuta: ALTER TABLE trabajos ADD COLUMN hora_inicio TIMESTAMP" });
    } else {
      res.status(500).json({ msg: "Error del servidor" });
    }
  }
});

router.put("/:id/completar", authenticate, async (req, res) => {
  try {
    if (req.user.rol !== "admin" && req.user.rol !== "mecanico") {
      return res.status(403).json({ msg: "Solo admin o mecanico" });
    }
    const { descripcion, precio, sugerencia } = req.body;
    const result = await pool.query(
      "UPDATE trabajos SET hora_fin = CURRENT_TIMESTAMP, estado = 'completado', descripcion = COALESCE($1, descripcion), precio = COALESCE($2, precio) WHERE id = $3 AND (mecanico_id = $4 OR $5 = 'admin') RETURNING *",
      [descripcion, precio, req.params.id, req.user.id, req.user.rol]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: "Trabajo no encontrado" });
    
    const trabajo = result.rows[0];
    
    if (sugerencia && trabajo.coche_id) {
      await pool.query(
        "INSERT INTO historial (coche_id, tipo, descripcion, mecanico_id, siguiente_fecha, siguiente_kilometraje) VALUES ($1, 'sugerencia', $2, $3, $4, $5)",
        [trabajo.coche_id, sugerencia.descripcion, req.user.id, sugerencia.fecha || null, sugerencia.kilometraje || null]
      );
    }
    
    res.json(trabajo);
  } catch (err) {
    console.error(err.message);
    if (err.code === "42703") {
      res.status(500).json({ msg: "Columna hora_fin no existe. Ejecuta: ALTER TABLE trabajos ADD COLUMN hora_fin TIMESTAMP" });
    } else {
      res.status(500).json({ msg: "Error del servidor" });
    }
  }
});

module.exports = router;
