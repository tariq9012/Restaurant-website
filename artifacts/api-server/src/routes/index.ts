import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import menuRouter from "./menu";
import operationsRouter from "./operations";
import contentRouter from "./content";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(menuRouter);
router.use(operationsRouter);
router.use(contentRouter);

export default router;
