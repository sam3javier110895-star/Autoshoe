import { Router } from "express";
import { dbService } from "../lib/dbService";

const router = Router();

function serializeFlujo(f: any) {
  return {
    id: f.id,
    nombre: f.nombre,
    activo: f.activo,
    grupoOrigen: f.grupoOrigen,
    gruposDestino: Array.isArray(f.gruposDestino) ? f.gruposDestino : (typeof f.gruposDestino === 'string' ? JSON.parse(f.gruposDestino) : []),
    imagenesPorLote: f.imagenesPorLote,
    intervaloSegundos: f.intervaloSegundos,
    mensajeConsulta: f.mensajeConsulta,
    preguntaConfirmacion: f.preguntaConfirmacion,
    palabrasConfirmacion: Array.isArray(f.palabrasConfirmacion) ? f.palabrasConfirmacion : (typeof f.palabrasConfirmacion === 'string' ? JSON.parse(f.palabrasConfirmacion) : []),
    timeoutConfirmacionMin: f.timeoutConfirmacionMin,
    grupoPublicacion: f.grupoPublicacion,
    plantillaPublicacion: f.plantillaPublicacion,
    ejecuciones: f.ejecuciones,
    ultimaEjecucion: f.ultimaEjecucion instanceof Date ? f.ultimaEjecucion.toISOString() : (f.ultimaEjecucion ? new Date(f.ultimaEjecucion).toISOString() : null),
    creadoEn: f.creadoEn instanceof Date ? f.creadoEn.toISOString() : new Date(f.creadoEn).toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const list = await dbService.flujos.list();
    res.json(list.map(serializeFlujo));
  } catch (err) {
    req.log.error({ err }, "Error fetching flujos");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      grupoOrigen = "",
      gruposDestino = [],
      imagenesPorLote = 3,
      intervaloSegundos = 15,
      mensajeConsulta = "¿Tienen esta zapatilla? Precio y disponibilidad",
      preguntaConfirmacion = "¿Es segura/fija a ese precio?",
      palabrasConfirmacion = ["si", "sí", "segura", "fija", "confirmado", "dale", "ok", "va"],
      timeoutConfirmacionMin = 30,
      grupoPublicacion = "",
      plantillaPublicacion = "Proveedor confirmado: {numero} — Precio fijo: {precio}",
    } = req.body;

    if (!nombre) {
      res.status(400).json({ error: "Nombre requerido" });
      return;
    }

    const item = await dbService.flujos.create({
      nombre,
      grupoOrigen,
      gruposDestino,
      imagenesPorLote,
      intervaloSegundos,
      mensajeConsulta,
      preguntaConfirmacion,
      palabrasConfirmacion,
      timeoutConfirmacionMin,
      grupoPublicacion,
      plantillaPublicacion,
    });

    res.status(201).json(serializeFlujo(item));
  } catch (err) {
    req.log.error({ err }, "Error creating flujo");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      nombre, activo, grupoOrigen, gruposDestino, imagenesPorLote,
      intervaloSegundos, mensajeConsulta, preguntaConfirmacion,
      palabrasConfirmacion, timeoutConfirmacionMin, grupoPublicacion, plantillaPublicacion,
    } = req.body;

    const data: any = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (activo !== undefined) data.activo = activo;
    if (grupoOrigen !== undefined) data.grupoOrigen = grupoOrigen;
    if (gruposDestino !== undefined) data.gruposDestino = gruposDestino;
    if (imagenesPorLote !== undefined) data.imagenesPorLote = imagenesPorLote;
    if (intervaloSegundos !== undefined) data.intervaloSegundos = intervaloSegundos;
    if (mensajeConsulta !== undefined) data.mensajeConsulta = mensajeConsulta;
    if (preguntaConfirmacion !== undefined) data.preguntaConfirmacion = preguntaConfirmacion;
    if (palabrasConfirmacion !== undefined) data.palabrasConfirmacion = palabrasConfirmacion;
    if (timeoutConfirmacionMin !== undefined) data.timeoutConfirmacionMin = timeoutConfirmacionMin;
    if (grupoPublicacion !== undefined) data.grupoPublicacion = grupoPublicacion;
    if (plantillaPublicacion !== undefined) data.plantillaPublicacion = plantillaPublicacion;

    const item = await dbService.flujos.update(id, data);
    if (!item) {
      res.status(404).json({ error: "Flujo no encontrado" });
      return;
    }
    res.json(serializeFlujo(item));
  } catch (err) {
    req.log.error({ err }, "Error updating flujo");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await dbService.flujos.delete(parseInt(req.params.id));
    res.json({ success: true, message: "Flujo eliminado" });
  } catch (err) {
    req.log.error({ err }, "Error deleting flujo");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/:id/simular", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const f = await dbService.flujos.get(id);
    if (!f) {
      res.status(404).json({ error: "Flujo no encontrado" });
      return;
    }
    const destinos = f.gruposDestino ?? [];
    const palabras = f.palabrasConfirmacion ?? [];
    const proveedor = req.body.proveedor ?? "Proveedor Demo";
    const precio = req.body.precio ?? "$85.000";
    const numero = req.body.numero ?? "+57 310 000 0000";

    const logs: Array<{ fase: number; tiempo: string; mensaje: string; tipo: string }> = [];
    const now = new Date();

    const ts = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();

    logs.push({ fase: 1, tiempo: ts(0), mensaje: `📷 Detectadas ${f.imagenesPorLote} fotos nuevas en "${f.grupoOrigen || 'Grupo A'}"`, tipo: "info" });
    logs.push({ fase: 1, tiempo: ts(200), mensaje: `📤 Reenviando foto 1 de ${f.imagenesPorLote} a ${destinos.length || 5} grupos proveedores...`, tipo: "info" });
    for (let i = 0; i < (destinos.length || 5); i++) {
      logs.push({ fase: 1, tiempo: ts(300 + i * 100), mensaje: `✅ Foto enviada a "${destinos[i] || `Grupo ${String.fromCharCode(66 + i)}`}" + mensaje: "${f.mensajeConsulta.substring(0, 40)}..."`, tipo: "success" });
    }
    logs.push({ fase: 1, tiempo: ts(800), mensaje: `⏱️ Esperando respuestas... (intervalo: cada ${f.intervaloSegundos}s)`, tipo: "wait" });

    logs.push({ fase: 2, tiempo: ts(5000), mensaje: `💬 Respuesta recibida de "${proveedor}": "Sí las tengo, precio ${precio}"`, tipo: "info" });
    logs.push({ fase: 2, tiempo: ts(5200), mensaje: `🤖 Agente pregunta: "${f.preguntaConfirmacion}"`, tipo: "bot" });
    logs.push({ fase: 2, tiempo: ts(8000), mensaje: `💬 "${proveedor}" responde: "${palabras[0] ?? 'sí'}, es fija"`, tipo: "info" });
    logs.push({ fase: 2, tiempo: ts(8100), mensaje: `✅ Confirmación detectada ("${palabras[0] ?? 'sí'}"). Extrayendo: número=${numero}, precio=${precio}`, tipo: "success" });

    logs.push({ fase: 3, tiempo: ts(8200), mensaje: `🔍 Buscando zapatilla en "${f.grupoPublicacion || 'Grupo G'}"...`, tipo: "info" });
    logs.push({ fase: 3, tiempo: ts(8400), mensaje: `📌 Zapatilla encontrada. Generando mensaje de publicación...`, tipo: "info" });
    const msgFinal = f.plantillaPublicacion.replace("{numero}", numero).replace("{precio}", precio);
    logs.push({ fase: 3, tiempo: ts(8500), mensaje: `📢 Publicando en "${f.grupoPublicacion || 'Grupo G'}": "${msgFinal}"`, tipo: "success" });
    logs.push({ fase: 3, tiempo: ts(8600), mensaje: `🎉 Flujo completado. Proveedor: ${numero} | Precio: ${precio}`, tipo: "done" });

    await dbService.flujos.incrementExecutions(id);

    res.json({
      exito: true,
      logs,
      resultado: { proveedor, numero, precio, grupoPublicacion: f.grupoPublicacion, mensajeFinal: msgFinal },
    });
  } catch (err) {
    req.log.error({ err }, "Error simulating flujo");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
