import { pgTable, serial, text, integer, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const forwardEstadoEnum = pgEnum("forward_estado", [
  "pendiente", "enviando", "completado", "fallido"
]);

export const responseEstadoEnum = pgEnum("response_estado", [
  "disponible", "agotado", "pendiente", "confirmado"
]);

export const forwardedMessagesTable = pgTable("forwarded_messages", {
  id: serial("id").primaryKey(),
  contenido: text("contenido").notNull(),
  grupoOrigen: text("grupo_origen"),
  gruposDestino: jsonb("grupos_destino").notNull().default([]),
  estado: forwardEstadoEnum("estado").notNull().default("pendiente"),
  progreso: integer("progreso").notNull().default(0),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  proveedor: text("proveedor"),
  referencia: text("referencia"),
});

export const shoeResponsesTable = pgTable("shoe_responses", {
  id: serial("id").primaryKey(),
  referencia: text("referencia").notNull(),
  imagen: text("imagen"),
  proveedorNombre: text("proveedor_nombre").notNull(),
  proveedorNumero: text("proveedor_numero").notNull(),
  precio: text("precio"),
  grupoOrigen: text("grupo_origen").notNull(),
  estado: responseEstadoEnum("estado").notNull().default("pendiente"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  prioridad: boolean("prioridad").notNull().default(false),
});

export const insertForwardedMessageSchema = createInsertSchema(forwardedMessagesTable).omit({ id: true, timestamp: true, progreso: true });
export type InsertForwardedMessage = z.infer<typeof insertForwardedMessageSchema>;
export type ForwardedMessage = typeof forwardedMessagesTable.$inferSelect;

export const insertShoeResponseSchema = createInsertSchema(shoeResponsesTable).omit({ id: true, timestamp: true });
export type InsertShoeResponse = z.infer<typeof insertShoeResponseSchema>;
export type ShoeResponse = typeof shoeResponsesTable.$inferSelect;
