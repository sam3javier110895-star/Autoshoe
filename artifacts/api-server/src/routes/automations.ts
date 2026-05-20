import { Router } from "express";
import { dbService } from "../lib/dbService";

const router = Router();

function serializeAutomation(a: any) {
  return {
    id: a.id,
    nombre: a.nombre,
    descripcion: a.descripcion,
    triggerTipo: a.triggerTipo,
    palabrasClave: Array.isArray(a.palabrasClave) ? a.palabrasClave : (typeof a.palabrasClave === 'string' ? JSON.parse(a.palabrasClave) : []),
    gruposOrigen: Array.isArray(a.gruposOrigen) ? a.gruposOrigen : (typeof a.gruposOrigen === 'string' ? JSON.parse(a.gruposOrigen) : []),
    gruposDestino: Array.isArray(a.gruposDestino) ? a.gruposDestino : (typeof a.gruposDestino === 'string' ? JSON.parse(a.gruposDestino) : []),
    ventanaMinutos: a.ventanaMinutos,
    criterio: a.criterio,
    mensajeConsulta: a.mensajeConsulta,
    reenviarAlOrigen: a.reenviarAlOrigen,
    accion: a.accion,
    activa: a.activa,
    ejecuciones: a.ejecuciones,
    ultimaEjecucion: a.ultimaEjecucion instanceof Date ? a.ultimaEjecucion.toISOString() : (a.ultimaEjecucion ? new Date(a.ultimaEjecucion).toISOString() : null),
    creadaEn: a.creadaEn instanceof Date ? a.creadaEn.toISOString() : new Date(a.creadaEn).toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const automations = await dbService.automations.list();
    res.json(automations.map(serializeAutomation));
  } catch (err) {
    req.log.error({ err }, "Error fetching automations");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      nombre, descripcion, triggerTipo, palabrasClave = [],
      gruposOrigen = [], gruposDestino = [], accion, activa = true,
      ventanaMinutos = 10, criterio = "mejor_precio", mensajeConsulta = "",
      reenviarAlOrigen = true
    } = req.body;

    if (!nombre || !triggerTipo || !accion) {
      res.status(400).json({ error: "Campos requeridos faltantes" });
      return;
    }

    const automation = await dbService.automations.create({
      nombre,
      descripcion,
      triggerTipo,
      palabrasClave,
      gruposOrigen,
      gruposDestino,
      accion,
      activa,
      ventanaMinutos,
      criterio,
      mensajeConsulta,
      reenviarAlOrigen,
    });

    res.status(201).json(serializeAutomation(automation));
  } catch (err) {
    req.log.error({ err }, "Error creating automation");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const automation = await dbService.automations.get(parseInt(req.params.id));
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
    const id = parseInt(req.params.id);
    const {
      nombre, descripcion, triggerTipo, palabrasClave,
      gruposOrigen, gruposDestino, accion, activa,
      ventanaMinutos, criterio, mensajeConsulta, reenviarAlOrigen,
    } = req.body;

    const data: any = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (triggerTipo !== undefined) data.triggerTipo = triggerTipo;
    if (palabrasClave !== undefined) data.palabrasClave = palabrasClave;
    if (gruposOrigen !== undefined) data.gruposOrigen = gruposOrigen;
    if (gruposDestino !== undefined) data.gruposDestino = gruposDestino;
    if (accion !== undefined) data.accion = accion;
    if (activa !== undefined) data.activa = activa;
    if (ventanaMinutos !== undefined) data.ventanaMinutos = ventanaMinutos;
    if (criterio !== undefined) data.criterio = criterio;
    if (mensajeConsulta !== undefined) data.mensajeConsulta = mensajeConsulta;
    if (reenviarAlOrigen !== undefined) data.reenviarAlOrigen = reenviarAlOrigen;

    const updated = await dbService.automations.update(id, data);
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
    await dbService.automations.delete(parseInt(req.params.id));
    res.json({ success: true, message: "Automatización eliminada" });
  } catch (err) {
    req.log.error({ err }, "Error deleting automation");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/:id/toggle", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const automation = await dbService.automations.get(id);
    if (!automation) {
      res.status(404).json({ error: "Automatización no encontrada" });
      return;
    }
    const updated = await dbService.automations.update(id, { activa: !automation.activa });
    res.json(serializeAutomation(updated));
  } catch (err) {
    req.log.error({ err }, "Error toggling automation");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
