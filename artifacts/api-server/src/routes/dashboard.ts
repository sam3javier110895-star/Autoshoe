import { Router } from "express";
import { db } from "@workspace/db";
import {
  whatsappSessionsTable,
  groupsTable,
  automationsTable,
  contactsTable,
  forwardedMessagesTable,
  shoeResponsesTable,
} from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const [sessions] = await db
      .select({ count: count() })
      .from(whatsappSessionsTable)
      .where(eq(whatsappSessionsTable.estado, "conectado"));

    const [groups] = await db
      .select({ count: count() })
      .from(groupsTable)
      .where(eq(groupsTable.activo, true));

    const [activeAutomations] = await db
      .select({ count: count() })
      .from(automationsTable)
      .where(eq(automationsTable.activa, true));

    const [providers] = await db
      .select({ count: count() })
      .from(contactsTable)
      .where(eq(contactsTable.tipo, "provider"));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [forwarded] = await db
      .select({ count: count() })
      .from(forwardedMessagesTable)
      .where(sql`${forwardedMessagesTable.timestamp} >= ${today}`);

    const [responses] = await db
      .select({ count: count() })
      .from(shoeResponsesTable)
      .where(sql`${shoeResponsesTable.timestamp} >= ${today}`);

    const mensajesHoy = Array.from({ length: 12 }, (_, i) => ({
      hour: `${(8 + i).toString().padStart(2, "0")}:00`,
      count: 0,
    }));

    res.json({
      whatsappsConectados: sessions.count,
      gruposSincronizados: groups.count,
      mensajesReenviadosHoy: forwarded.count,
      automatizacionesActivas: activeAutomations.count,
      proveedoresDetectados: providers.count,
      respuestasHoy: responses.count,
      mensajesHoy,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching dashboard stats");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/activity", async (req, res) => {
  try {
    const forwarded = await db
      .select()
      .from(forwardedMessagesTable)
      .orderBy(sql`${forwardedMessagesTable.timestamp} DESC`)
      .limit(20);

    const activity = forwarded.map((m) => ({
      id: m.id,
      tipo: "reenvio",
      descripcion: `Mensaje reenviado a ${(m.gruposDestino as string[]).length} grupos`,
      grupoOrigen: m.grupoOrigen ?? null,
      grupoDestino:
        (m.gruposDestino as string[]).length > 0
          ? (m.gruposDestino as string[])[0]
          : null,
      proveedor: m.proveedor ?? null,
      referencia: m.referencia ?? null,
      timestamp: m.timestamp.toISOString(),
    }));

    res.json(activity);
  } catch (err) {
    req.log.error({ err }, "Error fetching activity");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
