import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

interface FlujoRow {
  id: number;
  nombre: string;
  activo: boolean;
  grupo_origen: string;
  grupos_destino: unknown;
  imagenes_por_lote: number;
  intervalo_segundos: number;
  mensaje_consulta: string;
  pregunta_confirmacion: string;
  palabras_confirmacion: unknown;
  timeout_confirmacion_min: number;
  grupo_publicacion: string;
  plantilla_publicacion: string;
  ejecuciones: number;
  ultima_ejecucion: Date | null;
  creado_en: Date;
}

function serializeFlujo(f: FlujoRow) {
  return {
    ...f,
    gruposDestino: f.grupos_destino as string[],
    grupoOrigen: f.grupo_origen,
    imagenesPorLote: f.imagenes_por_lote,
    intervaloSegundos: f.intervalo_segundos,
    mensajeConsulta: f.mensaje_consulta,
    preguntaConfirmacion: f.pregunta_confirmacion,
    palabrasConfirmacion: f.palabras_confirmacion as string[],
    timeoutConfirmacionMin: f.timeout_confirmacion_min,
    grupoPublicacion: f.grupo_publicacion,
    plantillaPublicacion: f.plantilla_publicacion,
    ultimaEjecucion: f.ultima_ejecucion?.toISOString() ?? null,
    creadoEn: f.creado_en.toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const result = await db.execute(sql`SELECT * FROM flujos_agente ORDER BY id`);
    res.json((result.rows as unknown as FlujoRow[]).map(serializeFlujo));
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

    const result = await db.execute(sql`
      INSERT INTO flujos_agente (
        nombre, grupo_origen, grupos_destino, imagenes_por_lote,
        intervalo_segundos, mensaje_consulta, pregunta_confirmacion,
        palabras_confirmacion, timeout_confirmacion_min,
        grupo_publicacion, plantilla_publicacion
      ) VALUES (
        ${nombre}, ${grupoOrigen}, ${JSON.stringify(gruposDestino)}::jsonb,
        ${imagenesPorLote}, ${intervaloSegundos}, ${mensajeConsulta},
        ${preguntaConfirmacion}, ${JSON.stringify(palabrasConfirmacion)}::jsonb,
        ${timeoutConfirmacionMin}, ${grupoPublicacion}, ${plantillaPublicacion}
      ) RETURNING *
    `);

    res.status(201).json(serializeFlujo(result.rows[0] as unknown as FlujoRow));
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

    const result = await db.execute(sql`
      UPDATE flujos_agente SET
        nombre = COALESCE(${nombre}, nombre),
        activo = COALESCE(${activo ?? null}, activo),
        grupo_origen = COALESCE(${grupoOrigen ?? null}, grupo_origen),
        grupos_destino = COALESCE(${gruposDestino ? JSON.stringify(gruposDestino) : null}::jsonb, grupos_destino),
        imagenes_por_lote = COALESCE(${imagenesPorLote ?? null}, imagenes_por_lote),
        intervalo_segundos = COALESCE(${intervaloSegundos ?? null}, intervalo_segundos),
        mensaje_consulta = COALESCE(${mensajeConsulta ?? null}, mensaje_consulta),
        pregunta_confirmacion = COALESCE(${preguntaConfirmacion ?? null}, pregunta_confirmacion),
        palabras_confirmacion = COALESCE(${palabrasConfirmacion ? JSON.stringify(palabrasConfirmacion) : null}::jsonb, palabras_confirmacion),
        timeout_confirmacion_min = COALESCE(${timeoutConfirmacionMin ?? null}, timeout_confirmacion_min),
        grupo_publicacion = COALESCE(${grupoPublicacion ?? null}, grupo_publicacion),
        plantilla_publicacion = COALESCE(${plantillaPublicacion ?? null}, plantilla_publicacion)
      WHERE id = ${id}
      RETURNING *
    `);

    if (!result.rows.length) {
      res.status(404).json({ error: "Flujo no encontrado" });
      return;
    }
    res.json(serializeFlujo(result.rows[0] as unknown as FlujoRow));
  } catch (err) {
    req.log.error({ err }, "Error updating flujo");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.execute(sql`DELETE FROM flujos_agente WHERE id = ${parseInt(req.params.id)}`);
    res.json({ success: true, message: "Flujo eliminado" });
  } catch (err) {
    req.log.error({ err }, "Error deleting flujo");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Simular el flujo con datos de prueba
router.post("/:id/simular", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const flujoResult = await db.execute(sql`SELECT * FROM flujos_agente WHERE id = ${id}`);
    if (!flujoResult.rows.length) {
      res.status(404).json({ error: "Flujo no encontrado" });
      return;
    }
    const f = flujoResult.rows[0] as unknown as FlujoRow;
    const destinos = (f.grupos_destino as string[]) ?? [];
    const palabras = (f.palabras_confirmacion as string[]) ?? [];
    const proveedor = req.body.proveedor ?? "Proveedor Demo";
    const precio = req.body.precio ?? "$85.000";
    const numero = req.body.numero ?? "+57 310 000 0000";

    const logs: Array<{ fase: number; tiempo: string; mensaje: string; tipo: string }> = [];
    const now = new Date();

    const ts = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();

    logs.push({ fase: 1, tiempo: ts(0), mensaje: `📷 Detectadas ${f.imagenes_por_lote} fotos nuevas en "${f.grupo_origen || 'Grupo A'}"`, tipo: "info" });
    logs.push({ fase: 1, tiempo: ts(200), mensaje: `📤 Reenviando foto 1 de ${f.imagenes_por_lote} a ${destinos.length || 5} grupos proveedores...`, tipo: "info" });
    for (let i = 0; i < (destinos.length || 5); i++) {
      logs.push({ fase: 1, tiempo: ts(300 + i * 100), mensaje: `✅ Foto enviada a "${destinos[i] || `Grupo ${String.fromCharCode(66 + i)}`}" + mensaje: "${f.mensaje_consulta.substring(0, 40)}..."`, tipo: "success" });
    }
    logs.push({ fase: 1, tiempo: ts(800), mensaje: `⏱️ Esperando respuestas... (intervalo: cada ${f.intervalo_segundos}s)`, tipo: "wait" });

    logs.push({ fase: 2, tiempo: ts(5000), mensaje: `💬 Respuesta recibida de "${proveedor}": "Sí las tengo, precio ${precio}"`, tipo: "info" });
    logs.push({ fase: 2, tiempo: ts(5200), mensaje: `🤖 Agente pregunta: "${f.pregunta_confirmacion}"`, tipo: "bot" });
    logs.push({ fase: 2, tiempo: ts(8000), mensaje: `💬 "${proveedor}" responde: "${palabras[0] ?? 'sí'}, es fija"`, tipo: "info" });
    logs.push({ fase: 2, tiempo: ts(8100), mensaje: `✅ Confirmación detectada ("${palabras[0] ?? 'sí'}"). Extrayendo: número=${numero}, precio=${precio}`, tipo: "success" });

    logs.push({ fase: 3, tiempo: ts(8200), mensaje: `🔍 Buscando zapatilla en "${f.grupo_publicacion || 'Grupo G'}"...`, tipo: "info" });
    logs.push({ fase: 3, tiempo: ts(8400), mensaje: `📌 Zapatilla encontrada. Generando mensaje de publicación...`, tipo: "info" });
    const msgFinal = f.plantilla_publicacion.replace("{numero}", numero).replace("{precio}", precio);
    logs.push({ fase: 3, tiempo: ts(8500), mensaje: `📢 Publicando en "${f.grupo_publicacion || 'Grupo G'}": "${msgFinal}"`, tipo: "success" });
    logs.push({ fase: 3, tiempo: ts(8600), mensaje: `🎉 Flujo completado. Proveedor: ${numero} | Precio: ${precio}`, tipo: "done" });

    await db.execute(sql`
      UPDATE flujos_agente SET ejecuciones = ejecuciones + 1, ultima_ejecucion = NOW() WHERE id = ${id}
    `);

    res.json({
      exito: true,
      logs,
      resultado: { proveedor, numero, precio, grupoPublicacion: f.grupo_publicacion, mensajeFinal: msgFinal },
    });
  } catch (err) {
    req.log.error({ err }, "Error simulating flujo");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
