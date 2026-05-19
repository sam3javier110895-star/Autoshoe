import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactTipoEnum = pgEnum("contact_tipo", ["contact", "provider"]);
export const clasificacionEnum = pgEnum("clasificacion_tipo", ["rapido", "confiable", "frecuente"]);

export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  numero: text("numero").notNull(),
  tipo: contactTipoEnum("tipo").notNull().default("contact"),
  grupoOrigen: text("grupo_origen"),
  clasificacion: clasificacionEnum("clasificacion"),
  frecuenciaRespuesta: integer("frecuencia_respuesta").notNull().default(0),
  historial: integer("historial").notNull().default(0),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactsTable).omit({ id: true, creadoEn: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactsTable.$inferSelect;
