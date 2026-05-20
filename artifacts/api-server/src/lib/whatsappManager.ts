import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  BufferJSON,
  initAuthCreds,
} from "@whiskeysockets/baileys";
import * as path from "path";
import * as fs from "fs";
import { logger } from "./logger";
import { dbService } from "./dbService";
import { dbFirestore, useFirestore } from "./firebase";

const { makeInMemoryStore } = require("@whiskeysockets/baileys");

// Store multi-session sockets active in memory
const activeSockets = new Map<number, any>();
const sessionStores = new Map<number, any>();

async function useFirestoreAuthState(sessionId: number) {
  const sessionRef = dbFirestore!.collection("whatsapp_sessions").doc(String(sessionId));
  const keysRef = sessionRef.collection("auth_keys");

  // Read creds
  const authDoc = await sessionRef.collection("auth").doc("creds").get();
  let creds: any = null;
  if (authDoc.exists) {
    creds = JSON.parse(JSON.stringify(authDoc.data()), BufferJSON.reviver);
  } else {
    creds = initAuthCreds();
  }

  const saveCreds = async () => {
    const credsJson = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
    await sessionRef.collection("auth").doc("creds").set(credsJson);
  };

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: { [id: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              const docId = `${type}__${id}`;
              const doc = await keysRef.doc(docId).get();
              if (doc.exists) {
                data[id] = JSON.parse(JSON.stringify(doc.data()), BufferJSON.reviver);
              }
            })
          );
          return data;
        },
        set: async (data: any) => {
          const batch = dbFirestore!.batch();
          for (const type of Object.keys(data)) {
            const typeData = data[type];
            for (const id of Object.keys(typeData)) {
              const value = typeData[id];
              const docId = `${type}__${id}`;
              const docRef = keysRef.doc(docId);
              if (value) {
                const valueJson = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
                batch.set(docRef, valueJson);
              } else {
                batch.delete(docRef);
              }
            }
          }
          await batch.commit();
        }
      }
    },
    saveCreds
  };
}

// In-memory queues to group photo batches for Phase 1 Flujos
interface PhotoBatch {
  sessionId: number;
  flujoId: number;
  grupoOrigen: string;
  images: Array<{ buffer: Buffer; mimeType: string }>;
  timer: ReturnType<typeof setTimeout> | null;
}
const photoBatches = new Map<string, PhotoBatch>();

export const whatsappManager = {
  qrCodes: new Map<number, string>(),
  statuses: new Map<number, string>(),

  async initAllSessions() {
    try {
      const sessions = await dbService.whatsappSessions.list();
      logger.info(`Found ${sessions.length} sessions in database. Initializing active ones...`);
      for (const s of sessions) {
        if (s.estado === "conectado" || s.estado === "sincronizando") {
          logger.info(`Auto-reconnecting WhatsApp Session: ${s.nombre} (ID: ${s.id})`);
          this.connectSession(s.id).catch(err => {
            logger.error({ err, sessionId: s.id }, "Failed to auto-reconnect session");
          });
        }
      }
    } catch (err) {
      logger.error({ err }, "Error initializing WhatsApp sessions");
    }
  },

  async connectSession(sessionId: number): Promise<void> {
    logger.info(`[connectSession] Starting connection process for sessionId=${sessionId}`);
    try {
      // Disconnect existing if any
      logger.info(`[connectSession] Disconnecting existing session ${sessionId} if any`);
      await this.disconnectSession(sessionId);

      let authState: any;
      if (useFirestore) {
        logger.info(`[connectSession] Session ${sessionId} loading authState from Firestore`);
        authState = await useFirestoreAuthState(sessionId);
      } else {
        logger.info(`[connectSession] Session ${sessionId} loading authState from local storage`);
        const sessionDir = path.join(process.cwd(), "sessions", `session_${sessionId}`);
        if (!fs.existsSync(sessionDir)) {
          fs.mkdirSync(sessionDir, { recursive: true });
        }
        authState = await useMultiFileAuthState(sessionDir);
      }
      const { state, saveCreds } = authState;
      logger.info(`[connectSession] Fetching latest Baileys version`);
      const { version } = await fetchLatestBaileysVersion();

      logger.info(`Starting Baileys session ${sessionId} with version ${version.join(".")}`);

      const store = makeInMemoryStore({});
      sessionStores.set(sessionId, store);

      logger.info(`[connectSession] Initializing WASocket for ${sessionId}`);
      const sock = makeWASocket({
        version,
        auth: state,
        logger: logger as any,
        printQRInTerminal: false,
      });

      store.bind(sock.ev);
      activeSockets.set(sessionId, sock);
      logger.info(`[connectSession] WASocket bound and active for ${sessionId}`);

      // Handle credentials update
      sock.ev.on("creds.update", saveCreds);

      // Handle connection updates
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          logger.info(`QR Code received for session ${sessionId}`);
          this.qrCodes.set(sessionId, qr);
          this.statuses.set(sessionId, "waiting_scan");
        }

        if (connection === "close") {
          const shouldReconnect =
            (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
          logger.warn(
            `Connection closed for session ${sessionId}. Reason: ${lastDisconnect?.error}. Reconnecting: ${shouldReconnect}`
          );

          this.qrCodes.delete(sessionId);
          this.statuses.set(sessionId, shouldReconnect ? "reconectando" : "desconectado");

          if (shouldReconnect) {
            this.connectSession(sessionId).catch(err => {
              logger.error({ err, sessionId }, "Reconnection attempt failed");
            });
          } else {
            logger.info(`Session ${sessionId} completely logged out. Cleaning up credentials.`);
            this.clearSessionCredentials(sessionId);
            await dbService.whatsappSessions.update(sessionId, { estado: "desconectado" });
          }
        } else if (connection === "open") {
          logger.info(`Connection established for session ${sessionId}!`);
          this.qrCodes.delete(sessionId);
          this.statuses.set(sessionId, "conectado");
          const userJid = sock.user?.id;
          await dbService.whatsappSessions.update(sessionId, {
            estado: "conectado",
            ultimaConexion: new Date(),
            telefono: userJid?.split(":")[0] ?? "",
          });
        }
      });

      // Handle incoming messages & run automation workflows
      sock.ev.on("messages.upsert", async (m) => {
        if (m.type !== "notify") return;
        for (const msg of m.messages) {
          if (!msg.message || msg.key.fromMe) continue;
          await this.handleIncomingMessage(sessionId, sock, msg);
        }
      });

    } catch (err) {
      logger.error({ err, sessionId }, "Error during connectSession");
      throw err;
    }
  },

  async disconnectSession(sessionId: number): Promise<void> {
    this.qrCodes.delete(sessionId);
    this.statuses.set(sessionId, "desconectado");
    const sock = activeSockets.get(sessionId);
    if (sock) {
      try {
        sock.end(undefined);
      } catch (e) {
        // Safe end
      }
      activeSockets.delete(sessionId);
    }
    sessionStores.delete(sessionId);
    logger.info(`Session ${sessionId} disconnected`);
  },

  clearSessionCredentials(sessionId: number) {
    const sessionDir = path.join(process.cwd(), "sessions", `session_${sessionId}`);
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        logger.info(`Cleaned up session directory for ${sessionId}`);
      } catch (err) {
        logger.error({ err, sessionId }, "Failed to clear session directory");
      }
    }
  },

  // Central agent message processing logic
  async handleIncomingMessage(sessionId: number, sock: any, msg: any) {
    const session = await dbService.whatsappSessions.get(sessionId);
    if (!session || !session.botActivo) {
      logger.info(`Bot is inactive (paused) for session ${sessionId}. Ignoring incoming message.`);
      return;
    }

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith("@g.us");

    const textContent =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      "";

    // ---------------------------------------------------------
    // FLOW: Direct Message (DM / Chat Privado) Handling
    // ---------------------------------------------------------
    if (!isGroup) {
      const fromNumber = from.split("@")[0];
      const lowerText = textContent.toLowerCase();

      // Determine if this is a confirmation response (Fase 3)
      const isConfirmation = lowerText.includes("segura") || 
                             lowerText.includes("seguro") || 
                             lowerText.includes("fija") || 
                             lowerText.includes("fijo") ||
                             lowerText.includes("confirma") ||
                             lowerText.includes("si");

      if (isConfirmation) {
        logger.info(`Received safety confirmation from private contact ${fromNumber}: "${textContent}"`);

        // Extract price using regex
        const priceMatch = textContent.match(/\b\d{2,6}\b/) || textContent.match(/\b\d+k\b/i);
        const price = priceMatch ? priceMatch[0] : "Confirmado";

        // Find Group G (Target)
        const groups = await dbService.groups.list();
        const groupG = groups.find((g: any) => 
          g.nombre.toLowerCase().includes("grupo g") || 
          g.nombre.toLowerCase().includes("confirmados") || 
          g.nombre.toLowerCase().includes("ventas")
        );

        if (groupG) {
          logger.info(`Found target Group G: "${groupG.nombre}" (JID: ${groupG.jid})`);

          // Construct the confirmation message
          const reportMsg = `👟 *ZAPATILLA CONFIRMADA* 👟\n\n` +
                            `📞 *Contacto:* +${fromNumber}\n` +
                            `💵 *Precio:* ${price}\n` +
                            `✅ *Estado:* SEGURA / FIJA\n\n` +
                            `_Confirmado vía bot ShoeFlow Manager_`;

          await sock.sendMessage(groupG.jid, { text: reportMsg });
          logger.info(`Successfully posted confirmation report in Group G`);
        } else {
          logger.warn("Target Group G not found in database. Please name your target group 'Grupo G' or 'Confirmados'.");
        }
      } else {
        // If it's a first contact or general query (Fase 2)
        // Reply asking if it is safe and the price!
        const replyText = `¡Hola! Gracias por escribir. ¿Es segura o fija esta zapatilla? Por favor confírmame el precio.`;
        await sock.sendMessage(from, { text: replyText });
        logger.info(`Sent safety prompt in private to ${fromNumber}`);
      }
      return;
    }

    // Fetch the group info from db
    const groups = await dbService.groups.list();
    const activeGroup = groups.find((g: any) => g.jid === from && g.sessionId === sessionId);
    if (!activeGroup || !activeGroup.activo) return;

    logger.debug(`Incoming message in active group "${activeGroup.nombre}": "${textContent}"`);

    // Let's check: are we running active Phase 1 flujos on this group?
    const flujos = await dbService.flujos.list();
    const activeFlujos = flujos.filter((f: any) => f.activo && f.grupoOrigen === activeGroup.nombre);

    for (const f of activeFlujos) {
      // Check if message contains shoe images
      const hasImage = !!msg.message.imageMessage;
      if (hasImage) {
        await this.handleFlujoPhase1(sessionId, sock, f, activeGroup, msg);
      }
    }

    // Check if we are running active Automations
    const automations = await dbService.automations.list();
    const activeAutomations = automations.filter(
      (a: any) => a.activa && a.gruposOrigen.includes(activeGroup.nombre)
    );

    for (const auto of activeAutomations) {
      const match = auto.palabrasClave.some((keyword: string) =>
        textContent.toLowerCase().includes(keyword.toLowerCase())
      );
      if (match) {
        logger.info(`Automation "${auto.nombre}" triggered by keyword match!`);
        await this.runAutomation(sessionId, sock, auto, activeGroup, textContent, msg);
      }
    }
  },

  // Flujo Phase 1: Buffer pictures and forward to supplier groups
  async handleFlujoPhase1(sessionId: number, sock: any, flujo: any, group: any, msg: any) {
    const key = `${sessionId}_${flujo.id}`;
    let batch = photoBatches.get(key);

    if (!batch) {
      batch = {
        sessionId,
        flujoId: flujo.id,
        grupoOrigen: group.nombre,
        images: [],
        timer: null,
      };
      photoBatches.set(key, batch);
    }

    // Download the image using Baileys built-in decoders
    try {
      const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
      const stream = await downloadContentFromMessage(msg.message.imageMessage, "image");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      batch.images.push({ buffer, mimeType: "image/jpeg" });
      logger.info(`Buffered image ${batch.images.length} of ${flujo.imagenesPorLote} for Flujo "${flujo.nombre}"`);

      if (batch.timer) clearTimeout(batch.timer);

      // Trigger forward if lote size met or after a small timeout of silence
      if (batch.images.length >= flujo.imagenesPorLote) {
        await this.triggerFlujoForward(sock, flujo, batch);
        photoBatches.delete(key);
      } else {
        batch.timer = setTimeout(async () => {
          await this.triggerFlujoForward(sock, flujo, batch!);
          photoBatches.delete(key);
        }, 10000); // 10s timeout
      }
    } catch (err) {
      logger.error({ err, flujoId: flujo.id }, "Failed to process Phase 1 image buffer");
    }
  },

  async triggerFlujoForward(sock: any, flujo: any, batch: PhotoBatch) {
    logger.info(`Phase 1 batch complete for Flujo "${flujo.nombre}". Forwarding ${batch.images.length} shoe images to suppliers...`);

    const groups = await dbService.groups.list();
    const destGroups = groups.filter((g: any) => flujo.gruposDestino.includes(g.nombre));

    // Save forwarded message log
    await dbService.messages.create({
      contenido: flujo.mensajeConsulta,
      grupoOrigen: batch.grupoOrigen,
      gruposDestino: destGroups.map((g: any) => g.nombre),
      estado: "pendiente",
      progreso: 0,
    });

    for (const target of destGroups) {
      try {
        // Send batch of images
        for (let i = 0; i < batch.images.length; i++) {
          const img = batch.images[i];
          const isLast = i === batch.images.length - 1;
          await sock.sendMessage(target.jid, {
            image: img.buffer,
            caption: isLast ? flujo.mensajeConsulta : undefined,
          });
        }
        logger.info(`Successfully forwarded shoe batch to supplier group: "${target.nombre}"`);
      } catch (err) {
        logger.error({ err, target: target.nombre }, "Failed to forward shoe batch to supplier");
      }
    }

    await dbService.flujos.incrementExecutions(flujo.id);
  },

  // Automation Action logic
  async runAutomation(sessionId: number, sock: any, auto: any, group: any, text: string, msg: any) {
    const groups = await dbService.groups.list();
    const destGroups = groups.filter((g: any) => auto.gruposDestino.includes(g.nombre));

    // Create log record
    await dbService.messages.create({
      contenido: text,
      grupoOrigen: group.nombre,
      gruposDestino: destGroups.map((g: any) => g.nombre),
      estado: "completado",
      progreso: 100,
    });

    for (const target of destGroups) {
      try {
        if (auto.accion === "reenviar") {
          // If the automation trigger includes media, forward it, otherwise forward text
          if (msg.message.imageMessage) {
            const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
            const stream = await downloadContentFromMessage(msg.message.imageMessage, "image");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk]);
            }
            await sock.sendMessage(target.jid, {
              image: buffer,
              caption: text,
            });
          } else {
            await sock.sendMessage(target.jid, { text });
          }
          logger.info(`Successfully executed automation reenviar to "${target.nombre}"`);
        }
      } catch (err) {
        logger.error({ err, target: target.nombre }, "Failed to run automation forward");
      }
    }

    await dbService.automations.incrementExecutions(auto.id);
  }
};
