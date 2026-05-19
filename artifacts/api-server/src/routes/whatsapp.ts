import { Router } from "express";
import { db } from "@workspace/db";
import { whatsappSessionsTable, groupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const sessionQRMap = new Map<number, string>();
const sessionStatusMap = new Map<number, string>();
const sessionTimers = new Map<number, ReturnType<typeof setTimeout>>();

function generateMockQR(id: number): string {
  return `shoeflow-auth:${id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

export function getSessionQR(id: number): string | null {
  return sessionQRMap.get(id) ?? null;
}

export function getSessionStatus(id: number): string {
  return sessionStatusMap.get(id) ?? "desconectado";
}

export async function startSession(sessionId: number): Promise<void> {
  sessionStatusMap.set(sessionId, "sincronizando");
  await db
    .update(whatsappSessionsTable)
    .set({ estado: "sincronizando" })
    .where(eq(whatsappSessionsTable.id, sessionId));

  const qr = generateMockQR(sessionId);
  sessionQRMap.set(sessionId, qr);

  const existing = sessionTimers.get(sessionId);
  if (existing) clearTimeout(existing);
}

export async function stopSession(sessionId: number): Promise<void> {
  sessionQRMap.delete(sessionId);
  sessionStatusMap.set(sessionId, "desconectado");
  const t = sessionTimers.get(sessionId);
  if (t) { clearTimeout(t); sessionTimers.delete(sessionId); }
  await db
    .update(whatsappSessionsTable)
    .set({ estado: "desconectado" })
    .where(eq(whatsappSessionsTable.id, sessionId));
}

router.get("/sessions", async (req, res) => {
  try {
    const sessions = await db.select().from(whatsappSessionsTable).orderBy(whatsappSessionsTable.id);
    res.json(sessions.map((s) => ({
      ...s,
      creadoEn: s.creadoEn.toISOString(),
      ultimaConexion: s.ultimaConexion?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching sessions");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      res.status(400).json({ error: "Nombre requerido" });
      return;
    }
    const [session] = await db
      .insert(whatsappSessionsTable)
      .values({ nombre, estado: "desconectado" })
      .returning();
    res.status(201).json({
      ...session,
      creadoEn: session.creadoEn.toISOString(),
      ultimaConexion: session.ultimaConexion?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Error creating session");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/sessions/:id", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(whatsappSessionsTable)
      .where(eq(whatsappSessionsTable.id, parseInt(req.params.id)));
    if (!session) {
      res.status(404).json({ error: "Sesión no encontrada" });
      return;
    }
    res.json({
      ...session,
      creadoEn: session.creadoEn.toISOString(),
      ultimaConexion: session.ultimaConexion?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching session");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/sessions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await stopSession(id);
    await db.delete(whatsappSessionsTable).where(eq(whatsappSessionsTable.id, id));
    res.json({ success: true, message: "Sesión eliminada" });
  } catch (err) {
    req.log.error({ err }, "Error deleting session");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/sessions/:id/connect", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [session] = await db
      .select()
      .from(whatsappSessionsTable)
      .where(eq(whatsappSessionsTable.id, id));
    if (!session) {
      res.status(404).json({ error: "Sesión no encontrada" });
      return;
    }
    startSession(id).catch((err) => {
      req.log.error({ err, sessionId: id }, "Error starting session");
    });
    res.json({ success: true, message: "Conectando sesión..." });
  } catch (err) {
    req.log.error({ err }, "Error connecting session");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/sessions/:id/disconnect", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await stopSession(id);
    res.json({ success: true, message: "Sesión desconectada" });
  } catch (err) {
    req.log.error({ err }, "Error disconnecting session");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/sessions/:id/qr", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const qrCode = getSessionQR(id);
    if (!qrCode) {
      const status = getSessionStatus(id);
      res.json({ qrData: null, status, message: "Sin QR disponible aún" });
      return;
    }
    res.json({ qrData: qrCode, status: "waiting_scan", expiraEn: 60 });
  } catch (err) {
    req.log.error({ err }, "Error getting QR");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/sessions/:id/sync-groups", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [session] = await db
      .select()
      .from(whatsappSessionsTable)
      .where(eq(whatsappSessionsTable.id, id));
    if (!session) {
      res.status(404).json({ error: "Sesión no encontrada" });
      return;
    }

    // When Baileys is connected this would use sock.groupFetchAllParticipating()
    // For now seed realistic shoe-business groups so the UI is fully functional
    const mockGroups = [
      { nombre: "Novedades Zapatos", jid: `novedades-${id}@g.us`, categoria: "clientes", participantes: 312, mensajesDiarios: 45 },
      { nombre: "Proveedores Nike", jid: `prov-nike-${id}@g.us`, categoria: "proveedores", participantes: 12, mensajesDiarios: 18 },
      { nombre: "Proveedores Adidas", jid: `prov-adidas-${id}@g.us`, categoria: "proveedores", participantes: 8, mensajesDiarios: 11 },
      { nombre: "Proveedores Puma", jid: `prov-puma-${id}@g.us`, categoria: "proveedores", participantes: 15, mensajesDiarios: 9 },
      { nombre: "Proveedores Jordan", jid: `prov-jordan-${id}@g.us`, categoria: "proveedores", participantes: 10, mensajesDiarios: 14 },
      { nombre: "Distribuidores Bogotá", jid: `dist-bogota-${id}@g.us`, categoria: "distribuidores", participantes: 23, mensajesDiarios: 22 },
      { nombre: "Distribuidores Medellín", jid: `dist-medellin-${id}@g.us`, categoria: "distribuidores", participantes: 18, mensajesDiarios: 17 },
      { nombre: "Clientes VIP", jid: `clientes-vip-${id}@g.us`, categoria: "clientes", participantes: 67, mensajesDiarios: 31 },
      { nombre: "Catálogo General", jid: `catalogo-${id}@g.us`, categoria: "clientes", participantes: 156, mensajesDiarios: 60 },
      { nombre: "Zapatos Sport", jid: `sport-${id}@g.us`, categoria: "proveedores", participantes: 20, mensajesDiarios: 8 },
      { nombre: "Compras y Ofertas", jid: `ofertas-${id}@g.us`, categoria: "clientes", participantes: 89, mensajesDiarios: 42 },
      { nombre: "Grupo Interno Ventas", jid: `ventas-interno-${id}@g.us`, categoria: "clientes", participantes: 5, mensajesDiarios: 15 },
    ];

    // Remove existing groups for this session and re-insert
    await db.delete(groupsTable).where(eq(groupsTable.sessionId, id));

    const inserted = await db
      .insert(groupsTable)
      .values(
        mockGroups.map((g) => ({
          sessionId: id,
          jid: g.jid,
          nombre: g.nombre,
          categoria: g.categoria,
          participantes: g.participantes,
          mensajesDiarios: g.mensajesDiarios,
          activo: true,
          ultimaActividad: new Date(),
        }))
      )
      .returning();

    // Update session groups count
    await db
      .update(whatsappSessionsTable)
      .set({ gruposSincronizados: inserted.length, estado: "conectado", ultimaConexion: new Date() })
      .where(eq(whatsappSessionsTable.id, id));

    res.json({ success: true, gruposSincronizados: inserted.length, grupos: inserted.map((g) => g.nombre) });
  } catch (err) {
    req.log.error({ err }, "Error syncing groups");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
