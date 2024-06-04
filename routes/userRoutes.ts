import express, { Router } from "express";

import * as userController from "../controllers/userController";
import {
  changePasswordValidator,
  deleteAccountValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  updateProfileValidator,
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
  updateProfileValidator,
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  userController.updateProfile
);
userRouter.put(
  "/resetPassword",
  resetPasswordValidator,
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  userController.resetPassword
);
userRouter.post(
  "/deleteAccount",
  deleteAccountValidator,
  passport.authenticate("jwt", { session: false, failureRedirect: "/" }),
  userController.deleteAccount
);

export default userRouter;
