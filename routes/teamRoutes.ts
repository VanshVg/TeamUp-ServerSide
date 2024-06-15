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
    failureRedirect: "/login",
  }),
  teamController.createTeam
);
teamRouter.post(
  "/join",
  joinTeamValidator,
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/login",
  }),
  teamController.joinTeam
);
teamRouter.get(
  "/userTeams",
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/login",
  }),
  teamController.userTeams
);
teamRouter.get(
  "/archivedTeams",
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/login",
  }),
  teamController.archivedTeams
);
teamRouter.get(
  "/get/:id",
  passport.authenticate("jwt", {
    session: false,
    failureRedirect: "/login",
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
teamRouter.get(
  "/members/:id",
  passport.authenticate("jwt", { session: false, failureRedirect: "/" }),
  teamController.getMembers
);
teamRouter.put(
  "/update/:id",
  passport.authenticate("jwt", { session: false, failureRedirect: "/" }),
  teamController.updateTeam
);
teamRouter.delete(
  "/leave/:id",
  passport.authenticate("jwt", { session: false, failureRedirect: "/" }),
  teamController.leaveTeam
);
teamRouter.put(
  "/makeAdmin/:id",
  passport.authenticate("jwt", { session: false, failureRedirect: "/" }),
  teamController.makeAdmin
);
teamRouter.delete(
  "/removeMember/:id",
  passport.authenticate("jwt", { session: false, failureRedirect: "/" }),
  teamController.removeMember
);

export default teamRouter;
