import express, { Router } from "express";

import * as userController from "../controllers/userController";
import { loginValidator, registerValidator } from "../validators/userValidator";

const userRouter: Router = express.Router();

userRouter.post("/register", registerValidator, userController.register);
userRouter.post("/login", loginValidator, userController.login);

export default userRouter;
