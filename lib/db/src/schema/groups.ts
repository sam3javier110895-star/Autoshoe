import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { whatsappSessionsTable } from "./whatsapp";

export const groupsTable = pgTable("groups", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => whatsappSessionsTable.id, { onDelete: "cascade" }),
  jid: text("jid"),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  foto: text("foto"),
  categoria: text("categoria"),
  participantes: integer("participantes").notNull().default(0),
  mensajesDiarios: integer("mensajes_diarios").notNull().default(0),
  ultimaActividad: timestamp("ultima_actividad"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groupsTable).omit({ id: true, creadoEn: true });
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groupsTable.$inferSelect;
