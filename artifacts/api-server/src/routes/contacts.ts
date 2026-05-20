import { Router } from "express";
import { dbService } from "../lib/dbService";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { type, search } = req.query as Record<string, string>;
    let contacts = await dbService.contacts.list();

    if (type === "contact" || type === "provider") {
      contacts = contacts.filter((c: any) => c.tipo === type);
    }
    if (search) {
      const q = search.toLowerCase();
      contacts = contacts.filter((c: any) => c.nombre?.toLowerCase().includes(q));
    }

    res.json(contacts.map((c: any) => ({
      ...c,
      creadoEn: c.creadoEn instanceof Date ? c.creadoEn.toISOString() : new Date(c.creadoEn).toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching contacts");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre, numero, tipo, grupoOrigen, clasificacion } = req.body;
    if (!nombre || !numero || !tipo) {
      res.status(400).json({ error: "Campos requeridos faltantes" });
      return;
    }
    const contact = await dbService.contacts.create({
      nombre, numero, tipo, grupoOrigen, clasificacion
    });
    res.status(201).json({
      ...contact,
      creadoEn: contact.creadoEn instanceof Date ? contact.creadoEn.toISOString() : new Date(contact.creadoEn).toISOString()
    });
  } catch (err) {
    req.log.error({ err }, "Error creating contact");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, clasificacion, activo } = req.body;
    const data: any = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (clasificacion !== undefined) data.clasificacion = clasificacion;
    if (activo !== undefined) data.activo = activo;

    const updated = await dbService.contacts.update(id, data);
    if (!updated) {
      res.status(404).json({ error: "Contacto no encontrado" });
      return;
    }
    res.json({
      ...updated,
      creadoEn: updated.creadoEn instanceof Date ? updated.creadoEn.toISOString() : new Date(updated.creadoEn).toISOString()
    });
  } catch (err) {
    req.log.error({ err }, "Error updating contact");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await dbService.contacts.delete(id);
    res.json({ success: true, message: "Contacto eliminado" });
  } catch (err) {
    req.log.error({ err }, "Error deleting contact");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
