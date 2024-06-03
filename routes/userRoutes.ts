import express, { Router } from "express";

import * as userController from "../controllers/userController";
import {
  changePasswordValidator,
  loginValidator,
  registerValidator,
  verifyAccountValidator,
} from "../validators/userValidator";
import passport from "passport";
import { applyPassportStrategy } from "../middlewares/passport";

applyPassportStrategy();
const userRouter: Router = express.Router();

userRouter.post("/register", registerValidator, userController.register);
userRouter.post("/login", loginValidator, userController.login);
userRouter.put(
  "/activate/:token",
  verifyAccountValidator,
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  userController.activate
);
userRouter.post("/verify", userController.verifyAccount);
userRouter.post("/verifyToken/:token", userController.verifyToken);
userRouter.put(
  "/password",
  changePasswordValidator,
  userController.changePassword
);
userRouter.get(
  "/profile",
  passport.authenticate("jwt", { session: false, failureRedirect: "/" }),
  userController.getProfile
);
userRouter.put(
  "/updateProfile",
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  userController.updateProfile
);

export default userRouter;
