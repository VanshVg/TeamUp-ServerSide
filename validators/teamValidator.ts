import { ValidationChain, body } from "express-validator";

export const createTeamValidator: ValidationChain[] = [
  body("teamName").notEmpty().withMessage("Team name can't be empty."),
];
