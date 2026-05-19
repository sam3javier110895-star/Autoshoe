import { Router, type IRouter } from "express";
import healthRouter from "./health";
import groupsRouter from "./groups";
import tasksRouter from "./tasks";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(groupsRouter);
router.use(tasksRouter);
router.use(aiRouter);

export default router;
