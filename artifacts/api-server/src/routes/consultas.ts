import { Router } from "express";
import { dbService } from "../lib/dbService";

const router = Router();

router.get("/activas", async (req, res) => {
  try {
    const consultas = await dbService.consultas.listActivas();

    const result = await Promise.all(
      consultas.map(async (c: any) => {
        const respuestas = await dbService.consultas.respuestasForConsulta(c.id);
        const automation = await dbService.automations.get(c.automationId);

        return {
          id: c.id,
          grupoOrigenNombre: c.grupoOrigenNombre,
          automationNombre: automation?.nombre ?? "Automatización",
          criterio: automation?.criterio ?? "mejor_precio",
          expiraEn: c.expiraEn instanceof Date ? c.expiraEn.toISOString() : new Date(c.expiraEn).toISOString(),
          respuestasCount: respuestas.length,
          respuestasConPrecio: respuestas.filter((r: any) => r.precioTexto).length,
          estado: c.estado,
          creadaEn: c.creadaEn instanceof Date ? c.creadaEn.toISOString() : new Date(c.creadaEn).toISOString(),
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
