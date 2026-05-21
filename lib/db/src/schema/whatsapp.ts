import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionEstadoEnum = pgEnum("session_estado", [
  "conectado", "sincronizando", "desconectado", "reconectando"
]);

export const whatsappSessionsTable = pgTable("whatsapp_sessions", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  numero: text("numero"),
  avatar: text("avatar"),
  estado: sessionEstadoEnum("estado").notNull().default("desconectado"),
  gruposSincronizados: integer("grupos_sincronizados").notNull().default(0),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  ultimaConexion: timestamp("ultima_conexion"),
});

export const whatsappAuthKeysTable = pgTable("whatsapp_auth_keys", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  keyId: text("key_id").notNull(),
  data: text("data").notNull(), // JSON string of Baileys keys/creds
});

export const insertWhatsappSessionSchema = createInsertSchema(whatsappSessionsTable).omit({ id: true, creadoEn: true });
export type InsertWhatsappSession = z.infer<typeof insertWhatsappSessionSchema>;
export type WhatsappSession = typeof whatsappSessionsTable.$inferSelect;

