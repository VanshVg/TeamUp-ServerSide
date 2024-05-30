import express, { Router } from "express";

import * as teamController from "../controllers/teamController";
import {
  createTeamValidator,
  joinTeamValidator,
} from "../validators/teamValidator";
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
teamRouter.post(
  "/join",
  joinTeamValidator,
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  teamController.joinTeam
);
teamRouter.get(
  "/userTeams",
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  teamController.userTeams
);

export default teamRouter;
