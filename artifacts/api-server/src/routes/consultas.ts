import { Router } from "express";
import { db } from "@workspace/db";
import { consultasActivasTable, respuestasConsultaTable, automationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/activas", async (req, res) => {
  try {
    const consultas = await db
      .select()
      .from(consultasActivasTable)
      .where(eq(consultasActivasTable.estado, "activa"))
      .orderBy(sql`${consultasActivasTable.creadaEn} DESC`);

    const result = await Promise.all(
      consultas.map(async (c) => {
        const respuestas = await db
          .select()
          .from(respuestasConsultaTable)
          .where(eq(respuestasConsultaTable.consultaId, c.id));

        const [automation] = await db
          .select({ nombre: automationsTable.nombre, criterio: automationsTable.criterio })
          .from(automationsTable)
          .where(eq(automationsTable.id, c.automationId));

        return {
          id: c.id,
          grupoOrigenNombre: c.grupoOrigenNombre,
          automationNombre: automation?.nombre ?? "Automatización",
          criterio: automation?.criterio ?? "mejor_precio",
          expiraEn: c.expiraEn.toISOString(),
          respuestasCount: respuestas.length,
          respuestasConPrecio: respuestas.filter((r) => r.precioTexto).length,
          estado: c.estado,
          creadaEn: c.creadaEn.toISOString(),
        };
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error fetching active consultas");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
