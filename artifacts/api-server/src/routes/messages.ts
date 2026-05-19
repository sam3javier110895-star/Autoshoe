import { Router } from "express";
import { db } from "@workspace/db";
import {
  forwardedMessagesTable,
  shoeResponsesTable,
  groupsTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/forwarded", async (req, res) => {
  try {
    const messages = await db
      .select()
      .from(forwardedMessagesTable)
      .orderBy(sql`${forwardedMessagesTable.timestamp} DESC`)
      .limit(50);

    res.json(messages.map((m) => ({
      ...m,
      gruposDestino: m.gruposDestino as string[],
      timestamp: m.timestamp.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching forwarded messages");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/forwarded", async (req, res) => {
  try {
    const { contenido, grupoOrigenId, gruposDestinoIds } = req.body;

    if (!contenido || !Array.isArray(gruposDestinoIds)) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }

    let grupoOrigenNombre: string | undefined;
    if (grupoOrigenId) {
      const [g] = await db
        .select({ nombre: groupsTable.nombre })
        .from(groupsTable)
        .where(eq(groupsTable.id, grupoOrigenId));
      grupoOrigenNombre = g?.nombre;
    }

    const destNames: string[] = [];
    for (const gid of gruposDestinoIds) {
      const [g] = await db
        .select({ nombre: groupsTable.nombre })
        .from(groupsTable)
        .where(eq(groupsTable.id, gid));
      if (g) destNames.push(g.nombre);
    }

    const [message] = await db
      .insert(forwardedMessagesTable)
      .values({
        contenido,
        grupoOrigen: grupoOrigenNombre,
        gruposDestino: destNames,
        estado: "pendiente",
        progreso: 0,
      })
      .returning();

    res.status(201).json({
      ...message,
      gruposDestino: message.gruposDestino as string[],
      timestamp: message.timestamp.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error forwarding message");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/responses", async (req, res) => {
  try {
    const { status } = req.query as Record<string, string>;

    const responses = status
      ? await db
          .select()
          .from(shoeResponsesTable)
          .where(eq(shoeResponsesTable.estado, status as any))
          .orderBy(sql`${shoeResponsesTable.timestamp} DESC`)
      : await db
          .select()
          .from(shoeResponsesTable)
          .orderBy(sql`${shoeResponsesTable.timestamp} DESC`);

    res.json(responses.map((r) => ({
      ...r,
      timestamp: r.timestamp.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching responses");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/responses/:id", async (req, res) => {
  try {
    const { estado, prioridad } = req.body;
    const [updated] = await db
      .update(shoeResponsesTable)
      .set({ estado, prioridad })
      .where(eq(shoeResponsesTable.id, parseInt(req.params.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Respuesta no encontrada" });
      return;
    }
    res.json({ ...updated, timestamp: updated.timestamp.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating response");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
