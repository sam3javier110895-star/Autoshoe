import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable, insertContactSchema } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { type, search } = req.query as Record<string, string>;
    const conditions = [];

    if (type === "contact" || type === "provider") {
      conditions.push(eq(contactsTable.tipo, type));
    }
    if (search) conditions.push(ilike(contactsTable.nombre, `%${search}%`));

    const contacts = await db
      .select()
      .from(contactsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(contactsTable.id);

    res.json(contacts.map((c) => ({
      ...c,
      creadoEn: c.creadoEn.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching contacts");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = insertContactSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const [contact] = await db.insert(contactsTable).values(parsed.data).returning();
    res.status(201).json({ ...contact, creadoEn: contact.creadoEn.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating contact");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { nombre, clasificacion, activo } = req.body;
    const [updated] = await db
      .update(contactsTable)
      .set({ nombre, clasificacion, activo })
      .where(eq(contactsTable.id, parseInt(req.params.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Contacto no encontrado" });
      return;
    }
    res.json({ ...updated, creadoEn: updated.creadoEn.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating contact");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
