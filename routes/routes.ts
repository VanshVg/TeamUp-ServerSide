import express, { Router } from "express";

import userRouter from "./userRoutes";
import teamRouter from "./teamRoutes";

const router: Router = express.Router();

router.use("/auth", userRouter);
router.use("/team", teamRouter);

export default router;
