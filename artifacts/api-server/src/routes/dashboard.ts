import { Router } from "express";
import { dbService } from "../lib/dbService";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const sessions = await dbService.whatsappSessions.list();
    const whatsappsConectados = sessions.filter((s: any) => s.estado === "conectado").length;

    const groups = await dbService.groups.list();
    const gruposSincronizados = groups.filter((g: any) => g.activo).length;

    const automations = await dbService.automations.list();
    const automatizacionesActivas = automations.filter((a: any) => a.activa).length;

    const contacts = await dbService.contacts.list();
    const proveedoresDetectados = contacts.filter((c: any) => c.tipo === "provider").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const forwarded = await dbService.messages.list();
    const mensajesReenviadosHoy = forwarded.filter((m: any) => {
      const ts = m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp);
      return ts >= today;
    }).length;

    const responses = await dbService.responses.list();
    const respuestasHoy = responses.filter((r: any) => {
      const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
      return ts >= today;
    }).length;

    const mensajesHoy = Array.from({ length: 12 }, (_, i) => ({
      hour: `${(8 + i).toString().padStart(2, "0")}:00`,
      count: 0,
    }));

    res.json({
      whatsappsConectados,
      gruposSincronizados,
      mensajesReenviadosHoy,
      automatizacionesActivas,
      proveedoresDetectados,
      respuestasHoy,
      mensajesHoy,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching dashboard stats");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/activity", async (req, res) => {
  try {
    let forwarded = await dbService.messages.list();
    forwarded = forwarded.slice(0, 20);

    const activity = forwarded.map((m: any) => {
      const dests = Array.isArray(m.gruposDestino) ? m.gruposDestino : (typeof m.gruposDestino === 'string' ? JSON.parse(m.gruposDestino) : []);
      return {
        id: m.id,
        tipo: "reenvio",
        descripcion: `Mensaje reenviado a ${dests.length} grupos`,
        grupoOrigen: m.grupoOrigen ?? null,
        grupoDestino: dests.length > 0 ? dests[0] : null,
        proveedor: m.proveedor ?? null,
        referencia: m.referencia ?? null,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString(),
      };
    });

    res.json(activity);
  } catch (err) {
    req.log.error({ err }, "Error fetching activity");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
