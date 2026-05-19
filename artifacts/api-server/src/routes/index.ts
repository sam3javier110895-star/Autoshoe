import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import dashboardRouter from "./dashboard.js";
import whatsappRouter from "./whatsapp.js";
import groupsRouter from "./groups.js";
import automationsRouter from "./automations.js";
import contactsRouter from "./contacts.js";
import messagesRouter from "./messages.js";
import consultasRouter from "./consultas.js";
import aiRouter from "./ai.js";
import flujosRouter from "./flujos.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/dashboard", dashboardRouter);
router.use("/whatsapp", whatsappRouter);
router.use("/groups", groupsRouter);
router.use("/automations", automationsRouter);
router.use("/contacts", contactsRouter);
router.use("/messages", messagesRouter);
router.use("/consultas", consultasRouter);
router.use("/ai", aiRouter);
router.use("/flujos", flujosRouter);

export default router;
