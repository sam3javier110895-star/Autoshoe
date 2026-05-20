import { Router } from "express";
import { dbService } from "../lib/dbService";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { sessionId, category, search } = req.query as Record<string, string>;
    let groups = await dbService.groups.list();

    if (sessionId) {
      groups = groups.filter((g: any) => g.sessionId === parseInt(sessionId));
    }
    if (category) {
      groups = groups.filter((g: any) => g.categoria === category);
    }
    if (search) {
      const q = search.toLowerCase();
      groups = groups.filter((g: any) => g.nombre?.toLowerCase().includes(q));
    }

    res.json(groups.map((g: any) => ({
      ...g,
      ultimaActividad: g.ultimaActividad instanceof Date ? g.ultimaActividad.toISOString() : (g.ultimaActividad ? new Date(g.ultimaActividad).toISOString() : null),
      creadoEn: g.creadoEn instanceof Date ? g.creadoEn.toISOString() : new Date(g.creadoEn).toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching groups");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { sessionId, jid, nombre, categoria, participantes, mensajesDiarios } = req.body;
    if (!sessionId || !jid || !nombre) {
      res.status(400).json({ error: "Campos requeridos faltantes" });
      return;
    }
    const group = await dbService.groups.upsert({
      sessionId: parseInt(sessionId),
      jid,
      nombre,
      categoria,
      participantes: participantes ?? 0,
      mensajesDiarios: mensajesDiarios ?? 0,
      activo: true,
      ultimaActividad: new Date(),
    });
    res.status(201).json({
      ...group,
      ultimaActividad: group.ultimaActividad instanceof Date ? group.ultimaActividad.toISOString() : (group.ultimaActividad ? new Date(group.ultimaActividad).toISOString() : null),
      creadoEn: group.creadoEn instanceof Date ? group.creadoEn.toISOString() : new Date(group.creadoEn).toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating group");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    let groups = await dbService.groups.list();
    groups = groups
      .filter((g: any) => g.activo)
      .sort((a: any, b: any) => (b.mensajesDiarios || 0) - (a.mensajesDiarios || 0))
      .slice(0, 10);

    res.json(groups.map((g: any) => ({
      groupId: g.id,
      nombre: g.nombre,
      mensajes: g.mensajesDiarios,
      categoria: g.categoria
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching group stats");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const group = await dbService.groups.get(parseInt(req.params.id));
    if (!group) {
      res.status(404).json({ error: "Grupo no encontrado" });
      return;
    }
    res.json({
      ...group,
      ultimaActividad: group.ultimaActividad instanceof Date ? group.ultimaActividad.toISOString() : (group.ultimaActividad ? new Date(group.ultimaActividad).toISOString() : null),
      creadoEn: group.creadoEn instanceof Date ? group.creadoEn.toISOString() : new Date(group.creadoEn).toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching group");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, categoria, descripcion, activo } = req.body;
    const data: any = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (categoria !== undefined) data.categoria = categoria;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (activo !== undefined) data.activo = activo;

    const updated = await dbService.groups.update(id, data);
    if (!updated) {
      res.status(404).json({ error: "Grupo no encontrado" });
      return;
    }
    res.json({
      ...updated,
      ultimaActividad: updated.ultimaActividad instanceof Date ? updated.ultimaActividad.toISOString() : (updated.ultimaActividad ? new Date(updated.ultimaActividad).toISOString() : null),
      creadoEn: updated.creadoEn instanceof Date ? updated.creadoEn.toISOString() : new Date(updated.creadoEn).toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error updating group");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
