import { Router } from "express";
import { db } from "@workspace/db";
import { groupsTable, insertGroupSchema } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { sessionId, category, search } = req.query as Record<string, string>;
    const conditions = [];

    if (sessionId) conditions.push(eq(groupsTable.sessionId, parseInt(sessionId)));
    if (category) conditions.push(eq(groupsTable.categoria, category));
    if (search) conditions.push(ilike(groupsTable.nombre, `%${search}%`));

    const groups = await db
      .select()
      .from(groupsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(groupsTable.id);

    res.json(groups.map((g) => ({
      ...g,
      ultimaActividad: g.ultimaActividad?.toISOString() ?? null,
      creadoEn: g.creadoEn.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching groups");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = insertGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const [group] = await db.insert(groupsTable).values(parsed.data).returning();
    res.status(201).json({
      ...group,
      ultimaActividad: group.ultimaActividad?.toISOString() ?? null,
      creadoEn: group.creadoEn.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating group");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const groups = await db
      .select({
        id: groupsTable.id,
        nombre: groupsTable.nombre,
        mensajes: groupsTable.mensajesDiarios,
        categoria: groupsTable.categoria,
      })
      .from(groupsTable)
      .where(eq(groupsTable.activo, true))
      .orderBy(sql`${groupsTable.mensajesDiarios} DESC`)
      .limit(10);

    res.json(groups.map((g) => ({ groupId: g.id, nombre: g.nombre, mensajes: g.mensajes, categoria: g.categoria })));
  } catch (err) {
    req.log.error({ err }, "Error fetching group stats");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [group] = await db
      .select()
      .from(groupsTable)
      .where(eq(groupsTable.id, parseInt(req.params.id)));
    if (!group) {
      res.status(404).json({ error: "Grupo no encontrado" });
      return;
    }
    res.json({
      ...group,
      ultimaActividad: group.ultimaActividad?.toISOString() ?? null,
      creadoEn: group.creadoEn.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching group");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { nombre, categoria, descripcion, activo } = req.body;
    const [updated] = await db
      .update(groupsTable)
      .set({ nombre, categoria, descripcion, activo })
      .where(eq(groupsTable.id, parseInt(req.params.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Grupo no encontrado" });
      return;
    }
    res.json({
      ...updated,
      ultimaActividad: updated.ultimaActividad?.toISOString() ?? null,
      creadoEn: updated.creadoEn.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error updating group");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
