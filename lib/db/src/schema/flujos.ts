import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flujosAgenteTable = pgTable("flujos_agente", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  activo: boolean("activo").notNull().default(true),
  grupoOrigen: text("grupo_origen").notNull(),
  gruposDestino: jsonb("grupos_destino").notNull().default([]),
  imagenesPorLote: integer("imagenes_por_lote").notNull().default(3),
  intervaloSegundos: integer("intervalo_segundos").notNull().default(15),
  mensajeConsulta: text("mensaje_consulta").notNull(),
  preguntaConfirmacion: text("pregunta_confirmacion").notNull(),
  palabrasConfirmacion: jsonb("palabras_confirmacion").notNull().default([]),
  timeoutConfirmacionMin: integer("timeout_confirmacion_min").notNull().default(30),
  grupoPublicacion: text("grupo_publicacion").notNull(),
  plantillaPublicacion: text("plantilla_publicacion").notNull(),
  ejecuciones: integer("ejecuciones").notNull().default(0),
  ultimaEjecucion: timestamp("ultima_ejecucion"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const insertFlujoAgenteSchema = createInsertSchema(flujosAgenteTable).omit({
  id: true, creadoEn: true, ejecuciones: true
});
export type InsertFlujoAgente = z.infer<typeof insertFlujoAgenteSchema>;
export type FlujoAgente = typeof flujosAgenteTable.$inferSelect;
