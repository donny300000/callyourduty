import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import groupsRouter from "./groups";
import logsRouter from "./logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(logsRouter);

export default router;
