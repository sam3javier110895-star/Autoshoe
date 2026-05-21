import * as admin from "firebase-admin";
import { logger } from "./logger";
import * as fs from "fs";
import * as path from "path";

let dbFirestore: admin.firestore.Firestore | null = null;
const localSaPath = path.join(process.cwd(), "firebase-service-account.json");
const nestedSaPath = path.join(process.cwd(), "artifacts", "api-server", "firebase-service-account.json");
const hasSaFile = fs.existsSync(localSaPath) || fs.existsSync(nestedSaPath);

const useFirestore = !!(
  (process.env.FIREBASE_CONFIG ||
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  hasSaFile) &&
  process.env.DISABLE_FIRESTORE !== "true"
);

if (useFirestore) {
  try {
    const activeAdmin: any = admin.apps ? admin : (admin as any).default;
    if (activeAdmin.apps.length === 0) {
      let credential = activeAdmin.credential.applicationDefault();

      const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
      const saPath = fs.existsSync(localSaPath) ? localSaPath : nestedSaPath;

      if (saEnv) {
        try {
          const sa = JSON.parse(saEnv);
          credential = activeAdmin.credential.cert(sa);
          logger.info("Initializing Firebase Admin via env service account");
        } catch (e) {
          logger.error({ err: e }, "Failed to parse FIREBASE_SERVICE_ACCOUNT env var");
        }
      } else if (hasSaFile) {
        try {
          const sa = JSON.parse(fs.readFileSync(saPath, "utf-8"));
          credential = activeAdmin.credential.cert(sa);
          logger.info(`Initializing Firebase Admin via local file: ${saPath}`);
        } catch (e) {
          logger.error({ err: e }, `Failed to read/parse local key file: ${saPath}`);
        }
      }

      activeAdmin.initializeApp({
        credential,
      });
    }
    dbFirestore = activeAdmin.firestore();
    logger.info("Firebase Admin successfully initialized");
  } catch (err) {
    logger.error({ err }, "Error initializing Firebase Admin SDK. Fallback to SQL mode.");
  }
} else {
  logger.info("Firebase credentials not detected. Operating in SQL fallback mode.");
}

export { dbFirestore, useFirestore };
