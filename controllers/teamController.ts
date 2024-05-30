import { Request, Response } from "express";
import { Result, ValidationError, validationResult } from "express-validator";
import randomstring from "randomstring";

import teamModel, { teamInstance } from "../database/models/teamModel";
import { generateColor } from "../helpers/generateColor";
import teamMembersModel, {
  teamMembersInstance,
} from "../database/models/teamMembersModel";
import { userInterface } from "../interfaces/interfaces";

export const createTeam = async (req: Request, res: Response) => {
  try {
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(404)
        .json({ success: false, type: "payload", message: "Invalid payload" });
    }

    const { teamName, teamDescription } = req.body;

    let teamCode: string = randomstring.generate({
      length: 6,
      charset: "alphanumeric",
    });
    let bannerUrl: string =
      `/background/teamBackground` +
      (Math.floor(Math.random() * (3 - 1 + 1)) + 1);
    let iconColor: string = generateColor() as string;

    const team: teamInstance = await teamModel.create({
      name: teamName,
      description: teamDescription,
      code: teamCode,
      banner_url: bannerUrl,
      icon_color: iconColor,
    });

    if (!team) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    const teamMembers: teamMembersInstance = await teamMembersModel.create({
      team_id: team.dataValues.id,
      user_id: (req.user as userInterface).id,
      role: "admin",
    });

    if (!teamMembers) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team is created successfully",
    });
  } catch (error) {
    console.log(`Error inside createTeam controller`, error);
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};
