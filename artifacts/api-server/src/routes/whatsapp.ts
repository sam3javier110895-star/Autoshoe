import { Router } from "express";
import { dbService } from "../lib/dbService";
import { whatsappManager } from "../lib/whatsappManager";
import { logger } from "../lib/logger";

const router = Router();

export function getSessionQR(id: number): string | null {
  return whatsappManager.qrCodes.get(id) ?? null;
}

export function getSessionStatus(id: number): string {
  return whatsappManager.statuses.get(id) ?? "desconectado";
}

export async function startSession(sessionId: number): Promise<void> {
  logger.info(`[startSession] Trigggered for sessionId=${sessionId}`);
  // Update state in database to synchronizing
  try {
    logger.info(`[startSession] Updating session ${sessionId} state to "sincronizando" in database`);
    const updateResult = await dbService.whatsappSessions.update(sessionId, { estado: "sincronizando" });
    logger.info(`[startSession] Database update success for ${sessionId}: ${JSON.stringify(updateResult)}`);
  } catch (dbErr) {
    logger.error({ err: dbErr, sessionId }, `[startSession] Failed to update session state in database`);
  }
  
  // Set in-memory statuses
  whatsappManager.statuses.set(sessionId, "sincronizando");

  // Asynchronously trigger Baileys connection to generate real QR code
  logger.info(`[startSession] Calling connectSession for ${sessionId}`);
  whatsappManager.connectSession(sessionId).catch((err) => {
    logger.error({ err, sessionId }, "Failed to connect Baileys session in background");
  });
}

export async function stopSession(sessionId: number): Promise<void> {
  await whatsappManager.disconnectSession(sessionId);
  await dbService.whatsappSessions.update(sessionId, { estado: "desconectado" });
}

router.get("/sessions", async (req, res) => {
  try {
    const sessions = await dbService.whatsappSessions.list();
    res.json(sessions.map((s: any) => ({
      ...s,
      creadoEn: s.creadoEn instanceof Date ? s.creadoEn.toISOString() : new Date(s.creadoEn).toISOString(),
      ultimaConexion: s.ultimaConexion instanceof Date ? s.ultimaConexion.toISOString() : (s.ultimaConexion ? new Date(s.ultimaConexion).toISOString() : null),
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
    const session = await dbService.whatsappSessions.create({ nombre, estado: "desconectado" });
    res.status(201).json({
      ...session,
      creadoEn: session.creadoEn instanceof Date ? session.creadoEn.toISOString() : new Date(session.creadoEn).toISOString(),
      ultimaConexion: session.ultimaConexion instanceof Date ? session.ultimaConexion.toISOString() : (session.ultimaConexion ? new Date(session.ultimaConexion).toISOString() : null),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating session");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/sessions/:id", async (req, res) => {
  try {
    const session = await dbService.whatsappSessions.get(parseInt(req.params.id));
    if (!session) {
      res.status(404).json({ error: "Sesión no encontrada" });
      return;
    }
    res.json({
      ...session,
      creadoEn: session.creadoEn instanceof Date ? session.creadoEn.toISOString() : new Date(session.creadoEn).toISOString(),
      ultimaConexion: session.ultimaConexion instanceof Date ? session.ultimaConexion.toISOString() : (session.ultimaConexion ? new Date(session.ultimaConexion).toISOString() : null),
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
    await dbService.whatsappSessions.delete(id);
    res.json({ success: true, message: "Sesión eliminada" });
  } catch (err) {
    req.log.error({ err }, "Error deleting session");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/sessions/:id/connect", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const session = await dbService.whatsappSessions.get(id);
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
    const session = await dbService.whatsappSessions.get(id);
    if (!session) {
      res.status(404).json({ error: "Sesión no encontrada" });
      return;
    }

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

    const inserted = [];
    for (const g of mockGroups) {
      const upserted = await dbService.groups.upsert({
        sessionId: id,
        jid: g.jid,
        nombre: g.nombre,
        categoria: g.categoria,
        participantes: g.participantes,
        mensajesDiarios: g.mensajesDiarios,
        activo: true,
        ultimaActividad: new Date(),
      });
      inserted.push(upserted);
    }

    // Update session groups count
    await dbService.whatsappSessions.update(id, {
      gruposSincronizados: inserted.length,
      estado: "conectado",
      ultimaConexion: new Date()
    });

    res.json({ success: true, gruposSincronizados: inserted.length, grupos: inserted.map((g: any) => g.nombre) });
  } catch (err) {
    req.log.error({ err }, "Error syncing groups");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/sessions/:id/toggle-bot", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const session = await dbService.whatsappSessions.get(id);
    if (!session) {
      res.status(404).json({ error: "Sesión no encontrada" });
      return;
    }
    const currentStatus = session.botActivo ?? false;
    const updated = await dbService.whatsappSessions.update(id, { botActivo: !currentStatus });
    res.json({ success: true, botActivo: updated.botActivo });
  } catch (err) {
    req.log.error({ err }, "Error toggling bot status");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
