import express, { Router } from "express";

import * as teamController from "../controllers/teamController";
import { createTeamValidator } from "../validators/teamValidator";
import passport from "passport";

const teamRouter: Router = express.Router();

teamRouter.post(
  "/create",
  createTeamValidator,
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  teamController.createTeam
);

export default teamRouter;
