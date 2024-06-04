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
teamRouter.get(
  "/archivedTeams",
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  teamController.archivedTeams
);
teamRouter.get(
  "/get/:id",
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/",
  }),
  teamController.getTeam
);
teamRouter.put(
  "/archive/:id",
  passport.authenticate("jwt", { session: false, failureRedirect: "/" }),
  teamController.updateArchive
);
teamRouter.delete(
  "/remove/:id",
  passport.authenticate("jwt", { session: false, failureRedirect: "/" }),
  teamController.removeTeam
);
teamRouter.put(
  "/resetCode/:id",
  passport.authenticate("jwt", { session: false, failureRedirect: "/" }),
  teamController.resetCode
);

export default teamRouter;
