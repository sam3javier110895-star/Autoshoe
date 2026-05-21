import * as admin from "firebase-admin";
import { logger } from "./logger";
import * as fs from "fs";
import * as path from "path";

let dbFirestore: admin.firestore.Firestore | null = null;

// Check multiple possible locations for the service account file
const possiblePaths = [
  path.join(process.cwd(), "firebase-service-account.json"),
  path.join(process.cwd(), "artifacts", "api-server", "firebase-service-account.json"),
  path.join(__dirname, "firebase-service-account.json"),
  path.join(__dirname, "..", "firebase-service-account.json"),
  path.join(__dirname, "..", "..", "firebase-service-account.json"),
];

let saFilePath: string | null = null;
for (const p of possiblePaths) {
  try {
    if (fs.existsSync(p)) {
      saFilePath = p;
      break;
    }
  } catch {}
}

const hasSaFile = !!saFilePath;

// Embedded fallback service account for when the file is gitignored
const EMBEDDED_SA = {
  type: "service_account",
  project_id: "autoshoe",
  private_key_id: "0bf179cfea6b8082467477b22d1cbca6a233bb33",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1Z7oVx3ltM8kl\nDrY5xd159SjSvoOLRmV4OWDpETtqKXaYpD57abT1+zSaVC9gVFF+blWunDaufcjE\nLRCLou+PAR2MlTcWCXdMMqmOxjoUBHOJXAjQibxgqfJSkOFrX24/ccu+h9wuw7HM\nQnWlmqQhUpsU0IK2jwm1LGQs2aJGMR9o+wB+e1+w5lTtmX62KOLBFyFOjQpUz8mp\nKjBYONCfBMgrApMC8NWlaemNACFYL9vAX+ljj53/MG6+3rWDOE5YmRPhgeN2KjA3\nrwnawdMWpMeKf3BexX+0BjydhhRnFAX6IApXanYxpHYNeVBxV/mEpk2vHu2BbeDI\n1pgbwdulAgMBAAECggEAAJAosAgl56P4brKLd0l6CqpRalwfjJZsYwiVMsEJdj3S\nyJXl9nBcaP/2pLWKcME0cE2QGXwEBgxIa8YP8H1wPGPhZzEpYCSMBpfeovnLOWdk\nOHMDL8TSjueG29cBDzcpxxiEUXWEa7u5TIohRODoECjtbJNA7Xe6Vwe8gg7vakiV\nhpZfIP3SK6cc21vjfUPhzFjDhUnk6j8JJPAeidlHTTk0lLFVjQG2RQqulmKUIWmt\nKGUHnk0CdjkJryqBhelMWFFUSroTPaqOE6GGmhddD9/hKNBzsHI1llnm8nYocfgr\n1c2jhkU9rfhd90QUFE7HBd1CxNR6jU8CjKwklua5mQKBgQDjlEi4cQ04iaNG8PF8\n/+OSQoy5aanWeS5qEIPzzLZqjxiUfjy8NCMH3OiTdpZmB5oI73KdQaH30hIUzYAP\nJqEymGt2iYW4abz579aiDe+NCKjmm0M5GD5lNTpkXVPnV2lkmLlvK5o/SMKuka56\nkuWvWJX2dFz5k+ROnTBAsovbcwKBgQDMD0G/G4nYBA4AE0JtdojFdax6UgeOQEw+\niYG1Iv3lJC8mBBbBPq9rdw384RBrhp3n+F04L0znB19W+2aBUi2BqwAwFfbA2BU3\ncBjP24MCB+QJZEIpy+JZtToyRO7ZuYa4YB/b5B3nfjcZZu5IkqYfYL6+bM20Nwqp\n+IXJhXXWhwKBgHhjoBiaDYFkJlDH8yfKAiwEMod/Iw5HKsuHExasq68xJbKgGScC\neamWLh6cNDGjQdQKP1p7NuBva4s/rsfVCp9GTEr3sxp8LTEWtDckIh48f4UGi4gv\nkApgHxSq3lDaR/GkbSwnJ8Dkj8BjZqaHASRCO4qVwf1xQ+xmcPk4uo2LAoGBAJQq\nl9CNzF7/QrMnSNp2cQT/VodSvI27fiECcx31FGmnBl0SJvuV6oWbYpq1SNjqXAmt\nOvKq1aoCnmVoEZvg8Y3vfilsKUkJHQ6t5DY46z00QY3YMHpswiPlBSavCscogPur\nQDbHwjbuXE+jf21OnjS2aImYMxyhwqp7+5jBwThNAoGAcTIlSQjaeLU5b0QupuAw\nRd3VqZyt9xWyGvOiImGNs8Tc0ovCyWIKN0+hs/s2xgey4eKF4D+4MgTmmiCcPrcw\n01KN5vZOAfy1prX5jhTMnN7eXXUIuI0mmIAHvwhIhnkiRigfHriLOPwigAalACdR\nHbv+O2Vz0d896Jh1hhEVrfY=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@autoshoe.iam.gserviceaccount.com",
  client_id: "101126195864866951567",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40autoshoe.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const useFirestore = process.env.DISABLE_FIRESTORE !== "true";

if (useFirestore) {
  try {
    const activeAdmin: any = admin.apps ? admin : (admin as any).default;
    if (activeAdmin.apps.length === 0) {
      let credential: any;

      const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

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
          const sa = JSON.parse(fs.readFileSync(saFilePath!, "utf-8"));
          credential = activeAdmin.credential.cert(sa);
          logger.info(`Initializing Firebase Admin via local file: ${saFilePath}`);
        } catch (e) {
          logger.error({ err: e }, `Failed to read/parse local key file: ${saFilePath}`);
        }
      }

      // Fallback: use embedded credentials
      if (!credential) {
        credential = activeAdmin.credential.cert(EMBEDDED_SA);
        logger.info("Initializing Firebase Admin via embedded service account");
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
  logger.info("Firestore disabled via DISABLE_FIRESTORE env. Operating in SQL mode.");
}

export { dbFirestore, useFirestore };

