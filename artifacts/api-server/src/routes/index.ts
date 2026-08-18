import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import groupsRouter from "./groups";
import logsRouter from "./logs";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuth);
router.use(usersRouter);
router.use(groupsRouter);
router.use(logsRouter);

export default router;
