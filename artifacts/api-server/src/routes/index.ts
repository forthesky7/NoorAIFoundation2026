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
import leaderboardRouter from "./leaderboard";
import couponsRouter from "./coupons";
import influencerRouter from "./influencer";

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
router.use(leaderboardRouter);
router.use(couponsRouter);
router.use(influencerRouter);

export default router;
