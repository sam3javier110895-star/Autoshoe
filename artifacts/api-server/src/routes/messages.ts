import { Router } from "express";
import { dbService } from "../lib/dbService";

const router = Router();

router.get("/forwarded", async (req, res) => {
  try {
    let messages = await dbService.messages.list();
    messages = messages.slice(0, 50);

    res.json(messages.map((m: any) => ({
      ...m,
      gruposDestino: Array.isArray(m.gruposDestino) ? m.gruposDestino : (typeof m.gruposDestino === 'string' ? JSON.parse(m.gruposDestino) : []),
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString(),
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
      const g = await dbService.groups.get(grupoOrigenId);
      grupoOrigenNombre = g?.nombre;
    }

    const destNames: string[] = [];
    for (const gid of gruposDestinoIds) {
      const g = await dbService.groups.get(gid);
      if (g) destNames.push(g.nombre);
    }

    const message = await dbService.messages.create({
      contenido,
      grupoOrigen: grupoOrigenNombre,
      gruposDestino: destNames,
      estado: "pendiente",
      progreso: 0,
    });

    res.status(201).json({
      ...message,
      gruposDestino: Array.isArray(message.gruposDestino) ? message.gruposDestino : (typeof message.gruposDestino === 'string' ? JSON.parse(message.gruposDestino) : []),
      timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : new Date(message.timestamp).toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error forwarding message");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/responses", async (req, res) => {
  try {
    const { status } = req.query as Record<string, string>;
    let responses = await dbService.responses.list();

    if (status) {
      responses = responses.filter((r: any) => r.estado === status);
    }

    res.json(responses.map((r: any) => ({
      ...r,
      timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : new Date(r.timestamp).toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching responses");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/responses/:id", async (req, res) => {
  try {
    const { estado, prioridad } = req.body;
    const data: any = {};
    if (estado !== undefined) data.estado = estado;
    if (prioridad !== undefined) data.prioridad = prioridad;

    const updated = await dbService.responses.update(parseInt(req.params.id), data);
    if (!updated) {
      res.status(404).json({ error: "Respuesta no encontrada" });
      return;
    }
    res.json({
      ...updated,
      timestamp: updated.timestamp instanceof Date ? updated.timestamp.toISOString() : new Date(updated.timestamp).toISOString()
    });
  } catch (err) {
    req.log.error({ err }, "Error updating response");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
