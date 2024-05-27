import express, { Router } from "express";

import * as userController from "../controllers/userController";
import { registerValidator } from "../validators/userValidator";

const userRouter: Router = express.Router();

userRouter.post("/register", registerValidator, userController.register);

export default userRouter;
