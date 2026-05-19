import {
  pgTable, serial, text, integer, boolean, timestamp, pgEnum, jsonb, numeric
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const triggerTipoEnum = pgEnum("trigger_tipo", [
  "foto_referencia", "respuesta_disponible", "precio_proveedor", "palabra_clave", "primer_proveedor"
]);

export const accionEnum = pgEnum("accion_tipo", [
  "reenviar", "guardar_contacto", "notificar", "marcar_prioridad"
]);

export const criterioEnum = pgEnum("criterio_tipo", [
  "mejor_precio", "primer_respuesta", "manual"
]);

export const consultaEstadoEnum = pgEnum("consulta_estado", [
  "activa", "completada", "cancelada", "sin_respuestas"
]);

export const automationsTable = pgTable("automations", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  triggerTipo: triggerTipoEnum("trigger_tipo").notNull(),
  palabrasClave: jsonb("palabras_clave").notNull().default([]),
  gruposOrigen: jsonb("grupos_origen").notNull().default([]),
  gruposDestino: jsonb("grupos_destino").notNull().default([]),
  ventanaMinutos: integer("ventana_minutos").notNull().default(10),
  criterio: criterioEnum("criterio").notNull().default("mejor_precio"),
  mensajeConsulta: text("mensaje_consulta"),
  reenviarAlOrigen: boolean("reenviar_al_origen").notNull().default(true),
  accion: accionEnum("accion").notNull(),
  activa: boolean("activa").notNull().default(true),
  ejecuciones: integer("ejecuciones").notNull().default(0),
  ultimaEjecucion: timestamp("ultima_ejecucion"),
  creadaEn: timestamp("creada_en").notNull().defaultNow(),
});

export const consultasActivasTable = pgTable("consultas_activas", {
  id: serial("id").primaryKey(),
  automationId: integer("automation_id").notNull().references(() => automationsTable.id, { onDelete: "cascade" }),
  grupoOrigenJid: text("grupo_origen_jid").notNull(),
  grupoOrigenNombre: text("grupo_origen_nombre").notNull(),
  sessionId: integer("session_id").notNull(),
  imagenBase64: text("imagen_base64"),
  imagenMimetype: text("imagen_mimetype"),
  mensajeOriginal: text("mensaje_original"),
  remitente: text("remitente"),
  estado: consultaEstadoEnum("estado").notNull().default("activa"),
  expiraEn: timestamp("expira_en").notNull(),
  resultadoFinal: jsonb("resultado_final"),
  creadaEn: timestamp("creada_en").notNull().defaultNow(),
  cerradaEn: timestamp("cerrada_en"),
});

export const respuestasConsultaTable = pgTable("respuestas_consulta", {
  id: serial("id").primaryKey(),
  consultaId: integer("consulta_id").notNull().references(() => consultasActivasTable.id, { onDelete: "cascade" }),
  proveedorJid: text("proveedor_jid").notNull(),
  proveedorNumero: text("proveedor_numero").notNull(),
  proveedorNombre: text("proveedor_nombre"),
  imagenBase64: text("imagen_base64"),
  imagenMimetype: text("imagen_mimetype"),
  mensajeTexto: text("mensaje_texto"),
  precioTexto: text("precio_texto"),
  precioNumerico: numeric("precio_numerico", { precision: 12, scale: 2 }),
  esMejorPrecio: boolean("es_mejor_precio").notNull().default(false),
  recibitoEn: timestamp("recibido_en").notNull().defaultNow(),
});

export const insertAutomationSchema = createInsertSchema(automationsTable).omit({
  id: true, creadaEn: true, ejecuciones: true
});
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;
export type Automation = typeof automationsTable.$inferSelect;
export type ConsultaActiva = typeof consultasActivasTable.$inferSelect;
export type RespuestaConsulta = typeof respuestasConsultaTable.$inferSelect;
