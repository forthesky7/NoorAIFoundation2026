import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import videosRouter from "./videos";
import chatRouter from "./chat";
import careerRouter from "./career";
import subscriptionRouter from "./subscription";
import progressRouter from "./progress";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import requestsRouter from "./requests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(videosRouter);
router.use(chatRouter);
router.use(careerRouter);
router.use(subscriptionRouter);
router.use(progressRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(requestsRouter);

export default router;
