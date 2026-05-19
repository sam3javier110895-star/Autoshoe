import { Router } from "express";
import { db } from "@workspace/db";
import { automationsTable, insertAutomationSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function serializeAutomation(a: typeof automationsTable.$inferSelect) {
  return {
    ...a,
    palabrasClave: a.palabrasClave as string[],
    gruposOrigen: a.gruposOrigen as string[],
    gruposDestino: a.gruposDestino as string[],
    ultimaEjecucion: a.ultimaEjecucion?.toISOString() ?? null,
    creadaEn: a.creadaEn.toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const automations = await db.select().from(automationsTable).orderBy(automationsTable.id);
    res.json(automations.map(serializeAutomation));
  } catch (err) {
    req.log.error({ err }, "Error fetching automations");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = insertAutomationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
      return;
    }
    const [automation] = await db.insert(automationsTable).values(parsed.data).returning();
    res.status(201).json(serializeAutomation(automation));
  } catch (err) {
    req.log.error({ err }, "Error creating automation");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [automation] = await db
      .select()
      .from(automationsTable)
      .where(eq(automationsTable.id, parseInt(req.params.id)));
    if (!automation) {
      res.status(404).json({ error: "Automatización no encontrada" });
      return;
    }
    res.json(serializeAutomation(automation));
  } catch (err) {
    req.log.error({ err }, "Error fetching automation");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const {
      nombre, descripcion, triggerTipo, palabrasClave,
      gruposOrigen, gruposDestino, accion, activa,
      ventanaMinutos, criterio, mensajeConsulta, reenviarAlOrigen,
    } = req.body;

    const [updated] = await db
      .update(automationsTable)
      .set({
        nombre, descripcion, triggerTipo, palabrasClave,
        gruposOrigen, gruposDestino, accion, activa,
        ventanaMinutos, criterio, mensajeConsulta, reenviarAlOrigen,
      })
      .where(eq(automationsTable.id, parseInt(req.params.id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Automatización no encontrada" });
      return;
    }
    res.json(serializeAutomation(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating automation");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(automationsTable).where(eq(automationsTable.id, parseInt(req.params.id)));
    res.json({ success: true, message: "Automatización eliminada" });
  } catch (err) {
    req.log.error({ err }, "Error deleting automation");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/:id/toggle", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [automation] = await db.select().from(automationsTable).where(eq(automationsTable.id, id));
    if (!automation) {
      res.status(404).json({ error: "Automatización no encontrada" });
      return;
    }
    const [updated] = await db
      .update(automationsTable)
      .set({ activa: !automation.activa })
      .where(eq(automationsTable.id, id))
      .returning();
    res.json(serializeAutomation(updated));
  } catch (err) {
    req.log.error({ err }, "Error toggling automation");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
