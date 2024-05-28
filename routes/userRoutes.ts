import express, { Router } from "express";

import * as userController from "../controllers/userController";
import { loginValidator, registerValidator } from "../validators/userValidator";
import passport from "passport";
import { applyPassportStrategy } from "../middlewares/passport";

applyPassportStrategy();
const userRouter: Router = express.Router();

userRouter.post("/register", registerValidator, userController.register);
userRouter.post("/login", loginValidator, userController.login);
userRouter.put(
  "/activate/:token",
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  userController.activate
);

export default userRouter;
