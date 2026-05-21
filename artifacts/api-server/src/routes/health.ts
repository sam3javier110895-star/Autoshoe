import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { dbService } from "../lib/dbService";
import { useFirestore, dbFirestore } from "../lib/firebase";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/diagnostics", async (req, res) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    useFirestore,
    hasDbFirestore: !!dbFirestore,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    errors: {} as any
  };

  // Test Firestore session list
  try {
    const sessions = await dbService.whatsappSessions.list();
    diagnostics.firestoreSessionsCount = sessions.length;
  } catch (err: any) {
    diagnostics.errors.firestoreSessions = {
      message: err.message,
      code: err.code,
      stack: err.stack
    };
  }

  // Test Drizzle connection
  try {
    const { db, whatsappSessionsTable } = await import("@workspace/db");
    const result = await db.select().from(whatsappSessionsTable).limit(1);
    diagnostics.drizzleConnection = "ok";
    diagnostics.drizzleSessionsCount = result.length;
  } catch (err: any) {
    diagnostics.errors.drizzle = {
      message: err.message,
      stack: err.stack
    };
  }

  res.json(diagnostics);
});

export default router;
