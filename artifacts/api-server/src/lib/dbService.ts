import { db as originalDb } from "@workspace/db";
const db = originalDb as any;
import {
  flujosAgenteTable,
  automationsTable,
  whatsappSessionsTable,
  groupsTable,
  contactsTable,
  forwardedMessagesTable,
  shoeResponsesTable,
  consultasActivasTable,
  respuestasConsultaTable,
} from "@workspace/db";
import { eq as rawEq, sql } from "drizzle-orm";
const eq = rawEq as any;
import { dbFirestore, useFirestore } from "./firebase";
import { logger } from "./logger";

// Helper to convert Firestore dates to standard Date objects
function sanitizeFirestoreData(data: any): any {
  if (!data) return data;
  const copy = { ...data };
  for (const key of Object.keys(copy)) {
    if (copy[key] && typeof copy[key].toDate === "function") {
      copy[key] = copy[key].toDate();
    } else if (Array.isArray(copy[key])) {
      copy[key] = copy[key].map((item: any) => {
        if (typeof item === "object") return sanitizeFirestoreData(item);
        return item;
      });
    } else if (typeof copy[key] === "object") {
      copy[key] = sanitizeFirestoreData(copy[key]);
    }
  }
  return copy;
}

// Auto-increment numeric helper for Firestore
async function getNextId(collectionName: string): Promise<number> {
  if (!dbFirestore) return 1;
  const snap = await dbFirestore.collection(collectionName).orderBy("id", "desc").limit(1).get();
  if (snap.empty) return 1;
  const maxDoc = snap.docs[0].data();
  return (maxDoc.id || 0) + 1;
}

export const dbService = {
  flujos: {
    async list() {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("flujos").orderBy("id").get();
        return snap.docs.map(doc => sanitizeFirestoreData(doc.data()));
      }
      // Drizzle fallback
      return db.select().from(flujosAgenteTable).orderBy(flujosAgenteTable.id);
    },

    async get(id: number) {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("flujos").where("id", "==", id).limit(1).get();
        if (snap.empty) return null;
        return sanitizeFirestoreData(snap.docs[0].data());
      }
      const [item] = await db.select().from(flujosAgenteTable).where(eq(flujosAgenteTable.id, id));
      return item || null;
    },

    async create(data: any) {
      if (useFirestore && dbFirestore) {
        const id = await getNextId("flujos");
        const docData = {
          ...data,
          id,
          activo: data.activo ?? true,
          ejecuciones: 0,
          ultimaEjecucion: null,
          creadoEn: new Date(),
        };
        await dbFirestore.collection("flujos").doc(id.toString()).set(docData);
        return docData;
      }
      const [item] = await db.insert(flujosAgenteTable).values(data).returning();
      return item;
    },

    async update(id: number, data: any) {
      if (useFirestore && dbFirestore) {
        const docRef = dbFirestore.collection("flujos").doc(id.toString());
        const snap = await docRef.get();
        if (!snap.exists) return null;
        const updatedData = { ...snap.data(), ...data };
        await docRef.update(data);
        return sanitizeFirestoreData(updatedData);
      }
      const [item] = await db.update(flujosAgenteTable).set(data).where(eq(flujosAgenteTable.id, id)).returning();
      return item;
    },

    async delete(id: number) {
      if (useFirestore && dbFirestore) {
        await dbFirestore.collection("flujos").doc(id.toString()).delete();
        return true;
      }
      await db.delete(flujosAgenteTable).where(eq(flujosAgenteTable.id, id));
      return true;
    },

    async incrementExecutions(id: number) {
      if (useFirestore && dbFirestore) {
        const docRef = dbFirestore.collection("flujos").doc(id.toString());
        await dbFirestore.runTransaction(async (transaction) => {
          const doc = await transaction.get(docRef);
          if (doc.exists) {
            const current = doc.data()?.ejecuciones || 0;
            transaction.update(docRef, {
              ejecuciones: current + 1,
              ultimaEjecucion: new Date(),
            });
          }
        });
        return;
      }
      await db
        .update(flujosAgenteTable)
        .set({
          ejecuciones: sql`ejecuciones + 1`,
          ultimaEjecucion: new Date(),
        })
        .where(eq(flujosAgenteTable.id, id));
    }
  },

  automations: {
    async list() {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("automations").orderBy("id").get();
        return snap.docs.map(doc => sanitizeFirestoreData(doc.data()));
      }
      return db.select().from(automationsTable).orderBy(automationsTable.id);
    },

    async get(id: number) {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("automations").where("id", "==", id).limit(1).get();
        if (snap.empty) return null;
        return sanitizeFirestoreData(snap.docs[0].data());
      }
      const [item] = await db.select().from(automationsTable).where(eq(automationsTable.id, id));
      return item || null;
    },

    async create(data: any) {
      if (useFirestore && dbFirestore) {
        const id = await getNextId("automations");
        const docData = {
          ...data,
          id,
          activa: data.activa ?? true,
          ejecuciones: 0,
          ultimaEjecucion: null,
          creadaEn: new Date(),
        };
        await dbFirestore.collection("automations").doc(id.toString()).set(docData);
        return docData;
      }
      const [item] = await db.insert(automationsTable).values(data).returning();
      return item;
    },

    async update(id: number, data: any) {
      if (useFirestore && dbFirestore) {
        const docRef = dbFirestore.collection("automations").doc(id.toString());
        const snap = await docRef.get();
        if (!snap.exists) return null;
        const updatedData = { ...snap.data(), ...data };
        await docRef.update(data);
        return sanitizeFirestoreData(updatedData);
      }
      const [item] = await db.update(automationsTable).set(data).where(eq(automationsTable.id, id)).returning();
      return item;
    },

    async delete(id: number) {
      if (useFirestore && dbFirestore) {
        await dbFirestore.collection("automations").doc(id.toString()).delete();
        return true;
      }
      await db.delete(automationsTable).where(eq(automationsTable.id, id));
      return true;
    },

    async incrementExecutions(id: number) {
      if (useFirestore && dbFirestore) {
        const docRef = dbFirestore.collection("automations").doc(id.toString());
        await dbFirestore.runTransaction(async (transaction) => {
          const doc = await transaction.get(docRef);
          if (doc.exists) {
            const current = doc.data()?.ejecuciones || 0;
            transaction.update(docRef, {
              ejecuciones: current + 1,
              ultimaEjecucion: new Date(),
            });
          }
        });
        return;
      }
      await db
        .update(automationsTable)
        .set({
          ejecuciones: sql`ejecuciones + 1`,
          ultimaEjecucion: new Date(),
        })
        .where(eq(automationsTable.id, id));
    }
  },

  whatsappSessions: {
    async list() {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("whatsapp_sessions").orderBy("id").get();
        return snap.docs.map(doc => sanitizeFirestoreData(doc.data()));
      }
      return db.select().from(whatsappSessionsTable).orderBy(whatsappSessionsTable.id);
    },

    async get(id: number) {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("whatsapp_sessions").where("id", "==", id).limit(1).get();
        if (snap.empty) return null;
        return sanitizeFirestoreData(snap.docs[0].data());
      }
      const [item] = await db.select().from(whatsappSessionsTable).where(eq(whatsappSessionsTable.id, id));
      return item || null;
    },

    async create(data: any) {
      if (useFirestore && dbFirestore) {
        const id = await getNextId("whatsapp_sessions");
        const docData = {
          ...data,
          id,
          creadoEn: new Date(),
          ultimaConexion: null,
        };
        await dbFirestore.collection("whatsapp_sessions").doc(id.toString()).set(docData);
        return docData;
      }
      const [item] = await db.insert(whatsappSessionsTable).values(data).returning();
      return item;
    },

    async update(id: number, data: any) {
      if (useFirestore && dbFirestore) {
        const docRef = dbFirestore.collection("whatsapp_sessions").doc(id.toString());
        const snap = await docRef.get();
        if (!snap.exists) return null;
        const updatedData = { ...snap.data(), ...data };
        await docRef.update(data);
        return sanitizeFirestoreData(updatedData);
      }
      const [item] = await db.update(whatsappSessionsTable).set(data).where(eq(whatsappSessionsTable.id, id)).returning();
      return item;
    },

    async delete(id: number) {
      if (useFirestore && dbFirestore) {
        await dbFirestore.collection("whatsapp_sessions").doc(id.toString()).delete();
        return true;
      }
      await db.delete(whatsappSessionsTable).where(eq(whatsappSessionsTable.id, id));
      return true;
    }
  },

  groups: {
    async list() {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("groups").orderBy("nombre").get();
        return snap.docs.map(doc => sanitizeFirestoreData(doc.data()));
      }
      return db.select().from(groupsTable).orderBy(groupsTable.id);
    },

    async get(id: number) {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("groups").where("id", "==", id).limit(1).get();
        if (snap.empty) return null;
        return sanitizeFirestoreData(snap.docs[0].data());
      }
      const [item] = await db.select().from(groupsTable).where(eq(groupsTable.id, id));
      return item || null;
    },

    async upsert(data: any) {
      if (useFirestore && dbFirestore) {
        // Use JID as document ID — no read needed, pure upsert with merge
        const safeDocId = data.jid.replace(/[/]/g, "__");
        const docRef = dbFirestore.collection("groups").doc(safeDocId);
        const docData = {
          ...data,
          id: data.id ?? safeDocId,
          creadoEn: new Date(),
        };
        await docRef.set(docData, { merge: true });
        return docData;
      }
      // Drizzle upsert
      const existing = await db
        .select()
        .from(groupsTable)
        .where(sql`${groupsTable.jid} = ${data.jid} AND ${groupsTable.sessionId} = ${data.sessionId}`)
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(groupsTable)
          .set(data)
          .where(eq(groupsTable.id, existing[0].id))
          .returning();
        return updated;
      } else {
        const [inserted] = await db.insert(groupsTable).values(data).returning();
        return inserted;
      }
    },

    async bulkUpsert(groups: any[]) {
      if (useFirestore && dbFirestore) {
        // Write all groups in one batched operation — zero reads
        let batch = dbFirestore.batch();
        let count = 0;
        const results: any[] = [];
        for (const data of groups) {
          const safeDocId = data.jid.replace(/[/]/g, "__");
          const docRef = dbFirestore.collection("groups").doc(safeDocId);
          const docData = { ...data, id: data.id ?? safeDocId, creadoEn: new Date() };
          batch.set(docRef, docData, { merge: true });
          results.push(docData);
          count++;
          if (count % 400 === 0) {
            await batch.commit();
            batch = dbFirestore.batch();
          }
        }
        if (count % 400 !== 0) await batch.commit();
        return results;
      }
      // Drizzle fallback: sequential upserts
      const results: any[] = [];
      for (const data of groups) {
        const result = await this.upsert(data);
        results.push(result);
      }
      return results;
    },

    async update(id: number, data: any) {
      if (useFirestore && dbFirestore) {
        const docRef = dbFirestore.collection("groups").doc(id.toString());
        const snap = await docRef.get();
        if (!snap.exists) return null;
        const updatedData = { ...snap.data(), ...data };
        await docRef.update(data);
        return sanitizeFirestoreData(updatedData);
      }
      const [item] = await db.update(groupsTable).set(data).where(eq(groupsTable.id, id)).returning();
      return item;
    },

    async delete(id: number) {
      if (useFirestore && dbFirestore) {
        await dbFirestore.collection("groups").doc(id.toString()).delete();
        return true;
      }
      await db.delete(groupsTable).where(eq(groupsTable.id, id));
      return true;
    }
  },

  contacts: {
    async list() {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("contacts").orderBy("id").get();
        return snap.docs.map(doc => sanitizeFirestoreData(doc.data()));
      }
      return db.select().from(contactsTable).orderBy(contactsTable.id);
    },

    async create(data: any) {
      if (useFirestore && dbFirestore) {
        const id = await getNextId("contacts");
        const docData = {
          ...data,
          id,
          activo: data.activo ?? true,
          frecuenciaRespuesta: data.frecuenciaRespuesta ?? 0,
          historial: data.historial ?? 0,
          creadoEn: new Date(),
        };
        await dbFirestore.collection("contacts").doc(id.toString()).set(docData);
        return docData;
      }
      const [item] = await db.insert(contactsTable).values(data).returning();
      return item;
    },

    async update(id: number, data: any) {
      if (useFirestore && dbFirestore) {
        const docRef = dbFirestore.collection("contacts").doc(id.toString());
        const snap = await docRef.get();
        if (!snap.exists) return null;
        const updatedData = { ...snap.data(), ...data };
        await docRef.update(data);
        return sanitizeFirestoreData(updatedData);
      }
      const [item] = await db.update(contactsTable).set(data).where(eq(contactsTable.id, id)).returning();
      return item;
    },

    async delete(id: number) {
      if (useFirestore && dbFirestore) {
        await dbFirestore.collection("contacts").doc(id.toString()).delete();
        return true;
      }
      await db.delete(contactsTable).where(eq(contactsTable.id, id));
      return true;
    }
  },

  messages: {
    async list() {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("forwarded_messages").orderBy("id", "desc").get();
        return snap.docs.map(doc => sanitizeFirestoreData(doc.data()));
      }
      return db.select().from(forwardedMessagesTable).orderBy(sql`${forwardedMessagesTable.id} DESC`);
    },

    async create(data: any) {
      if (useFirestore && dbFirestore) {
        const id = await getNextId("forwarded_messages");
        const docData = {
          ...data,
          id,
          estado: data.estado ?? "pendiente",
          progreso: data.progreso ?? 0,
          timestamp: new Date(),
        };
        await dbFirestore.collection("forwarded_messages").doc(id.toString()).set(docData);
        return docData;
      }
      const [item] = await db.insert(forwardedMessagesTable).values(data).returning();
      return item;
    }
  },

  responses: {
    async list() {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("shoe_responses").orderBy("id", "desc").get();
        return snap.docs.map(doc => sanitizeFirestoreData(doc.data()));
      }
      return db.select().from(shoeResponsesTable).orderBy(sql`${shoeResponsesTable.id} DESC`);
    },

    async create(data: any) {
      if (useFirestore && dbFirestore) {
        const id = await getNextId("shoe_responses");
        const docData = {
          ...data,
          id,
          estado: data.estado ?? "pendiente",
          prioridad: data.prioridad ?? false,
          timestamp: new Date(),
        };
        await dbFirestore.collection("shoe_responses").doc(id.toString()).set(docData);
        return docData;
      }
      const [item] = await db.insert(shoeResponsesTable).values(data).returning();
      return item;
    },

    async update(id: number, data: any) {
      if (useFirestore && dbFirestore) {
        const docRef = dbFirestore.collection("shoe_responses").doc(id.toString());
        const snap = await docRef.get();
        if (!snap.exists) return null;
        const updatedData = { ...snap.data(), ...data };
        await docRef.update(data);
        return sanitizeFirestoreData(updatedData);
      }
      const [item] = await db.update(shoeResponsesTable).set(data).where(eq(shoeResponsesTable.id, id)).returning();
      return item;
    }
  },

  consultas: {
    async listActivas() {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("consultas_activas").where("estado", "==", "activa").get();
        return snap.docs.map(doc => sanitizeFirestoreData(doc.data()));
      }
      return db.select().from(consultasActivasTable).where(sql`${consultasActivasTable.estado} = 'activa'` as any).orderBy(sql`${consultasActivasTable.creadaEn} DESC` as any);
    },

    async respuestasForConsulta(consultaId: number) {
      if (useFirestore && dbFirestore) {
        const snap = await dbFirestore.collection("respuestas_consulta").where("consultaId", "==", consultaId).get();
        return snap.docs.map(doc => sanitizeFirestoreData(doc.data()));
      }
      return db.select().from(respuestasConsultaTable).where(sql`${respuestasConsultaTable.consultaId} = ${consultaId}` as any);
    }
  }
};
