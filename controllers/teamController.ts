import { Request, Response } from "express";
import { Result, ValidationError, validationResult } from "express-validator";
import randomstring from "randomstring";

import teamModel, { teamInstance } from "../database/models/teamModel";
import teamMembersModel, {
  teamMembersInstance,
  teamMembersInterface,
} from "../database/models/teamMembersModel";
import { userInterface } from "../interfaces/interfaces";
import { Op } from "sequelize";

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
      (Math.floor(Math.random() * (5 - 1 + 1)) + 1);

    const team: teamInstance = await teamModel.create({
      name: teamName,
      description: teamDescription,
      code: teamCode,
      members: 1,
      banner_url: bannerUrl,
      is_archived: false,
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

export const joinTeam = async (req: Request, res: Response) => {
  try {
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(404)
        .json({ success: false, type: "payload", message: "Invalid payload" });
    }
    const { teamCode } = req.body;

    let team: teamInstance | null = await teamModel.findOne({
      where: { code: teamCode },
    });
    if (team === null) {
      return res.status(404).json({
        success: false,
        type: "not_found",
        message: "Team not found",
      });
    }

    let user: teamMembersInstance | null = await teamMembersModel.findOne({
      where: {
        [Op.and]: [
          { team_id: team.dataValues.id },
          { user_id: (req.user as userInterface).id },
        ],
      },
    });
    if (user !== null) {
      return res.status(409).json({
        success: false,
        type: "exists",
        message: "You are already part of this team",
      });
    }

    let updateTeam = await teamModel.update(
      { members: team.dataValues.members + 1 },
      { where: { id: team.dataValues.id } }
    );
    if (!updateTeam) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    const teamMember = await teamMembersModel.create({
      team_id: team.dataValues.id,
      user_id: (req.user as userInterface).id,
      role: "member",
    });
    if (!teamMember) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User has joined successfully",
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

export const userTeams = async (req: Request, res: Response) => {
  try {
    const { id } = req.user as userInterface;
    let teams: teamMembersInstance[] = await teamMembersModel.findAll({
      where: { user_id: id },
      include: [
        {
          model: teamModel,
          where: { is_archived: 0 },
        },
      ],
    });

    let data: teamMembersInterface[] = [];
    teams.forEach((element) => {
      data.push(element.dataValues);
    });

    return res.status(200).json({
      success: true,
      userTeams: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const archivedTeams = async (req: Request, res: Response) => {
  try {
    const { id } = req.user as userInterface;
    let teams: teamMembersInstance[] = await teamMembersModel.findAll({
      where: { user_id: id },
      include: [
        {
          model: teamModel,
          where: { is_archived: 1 },
        },
      ],
    });

    let data: teamMembersInterface[] = [];
    teams.forEach((element) => {
      data.push(element.dataValues);
    });
    return res.status(200).json({
      success: true,
      archivedTeams: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const getTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const team: teamInstance = (await teamModel.findOne({
      where: { id: id },
    })) as teamInstance;
    if (team === null) {
      return res.status(404).json({
        success: false,
        type: "not_found",
        message: "Team not found",
      });
    }
    return res.status(200).json({
      success: true,
      teamData: team.dataValues,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};
