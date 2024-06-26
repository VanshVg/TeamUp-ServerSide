import { Request, Response } from "express";
import { Result, ValidationError, validationResult } from "express-validator";
import randomstring from "randomstring";
import { Op } from "sequelize";

import teamModel, { teamInstance } from "../database/models/teamModel";
import teamMembersModel, {
  teamMembersInstance,
  teamMembersInterface,
} from "../database/models/teamMembersModel";
import userModel from "../database/models/userModel";
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

    const teamCode: string = randomstring.generate({
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
      is_archived: false,
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
      teamId: team.dataValues.id,
    });
  } catch (error) {
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
      is_archived: false,
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
      teamId: team.dataValues.id,
    });
  } catch (error) {
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
      where: { [Op.and]: [{ user_id: id }, { is_archived: 0 }] },
      include: [
        {
          model: teamModel,
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
      where: { [Op.and]: [{ user_id: id }, { is_archived: 1 }] },
      include: [
        {
          model: teamModel,
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
    const team = await teamModel.findOne({
      where: { id: id },
      include: {
        model: teamMembersModel,
        where: {
          [Op.and]: [
            { team_id: id },
            { user_id: (req.user as userInterface).id },
          ],
        },
      },
    });
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

export const updateArchive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const getTeam = await teamMembersModel.findOne({
      where: {
        [Op.and]: [
          { user_id: (req.user as userInterface).id },
          { team_id: id },
        ],
      },
    });
    if (getTeam === null) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Data not found",
      });
    }
    const is_archived = getTeam.dataValues.is_archived;
    const updateTeam: [affectedRows: number] = await teamMembersModel.update(
      { is_archived: !is_archived },
      {
        where: {
          [Op.and]: [
            { user_id: (req.user as userInterface).id },
            { team_id: id },
          ],
        },
      }
    );
    if (!updateTeam) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Team archived successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const removeTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleteUserTeam = await teamMembersModel.destroy({
      where: { team_id: id },
    });
    if (!deleteUserTeam) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    const deleteTeam = await teamModel.destroy({ where: { id: id } });
    if (!deleteTeam) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const resetCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let teamCode: string = randomstring.generate({
      length: 6,
      charset: "alphanumeric",
    });
    const updateCode: [affectedRows: number] = await teamModel.update(
      { code: teamCode },
      { where: { id: id } }
    );
    if (!updateCode) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team code updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const getMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const members: teamMembersInstance[] = await teamMembersModel.findAll({
      where: { team_id: id },
      order: ["created_at"],
      include: [
        {
          model: userModel,
        },
      ],
    });

    let teamMembers: teamMembersInterface[] = [];
    let member: number = 0;

    members.forEach((element) => {
      teamMembers.push(element.dataValues);
      if (element.dataValues.role === "member") {
        member++;
      }
    });
    if (teamMembers.length === 0) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    return res.status(200).json({
      success: true,
      teamMembers: teamMembers,
      members: member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const team: [affectedRows: number] = await teamModel.update(
      { name: name, description: description },
      { where: { id: id } }
    );
    if (!team) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const leaveTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userTeam: teamMembersInstance | null = await teamMembersModel.findOne(
      {
        where: {
          [Op.and]: [
            { team_id: id },
            { user_id: (req.user as userInterface).id },
          ],
        },
      }
    );
    if (userTeam === null) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    const deleteUserTeam: number = await teamMembersModel.destroy({
      where: {
        [Op.and]: [
          { team_id: id },
          { user_id: (req.user as userInterface).id },
        ],
      },
    });
    if (!deleteUserTeam) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    const getMembers: teamMembersInstance[] | null =
      await teamMembersModel.findAll({
        where: { team_id: id },
        order: ["created_at"],
      });
    if (getMembers.length == 0) {
      const deleteTeam: number = await teamModel.destroy({ where: { id: id } });
      if (!deleteTeam) {
        return res.status(500).json({
          success: false,
          type: "server",
          message: "Something went wrong!",
        });
      }
    }
    if (userTeam.dataValues.role === "admin") {
      const { user_id } = getMembers[0];

      const getAdmin: teamMembersInstance | null =
        await teamMembersModel.findOne({
          where: { [Op.and]: [{ team_id: id }, { role: "admin" }] },
        });
      if (getAdmin === null) {
        const makeAdmin: [affectedRows: number] = await teamMembersModel.update(
          { role: "admin" },
          { where: { [Op.and]: [{ team_id: id }, { user_id: user_id }] } }
        );
        if (!makeAdmin) {
          return res.status(500).json({
            success: false,
            type: "server",
            message: "Something went wrong!",
          });
        }
      }
    }
    const updateTeam = await teamModel.decrement(["members"], {
      by: 1,
      where: { id: id },
    });
    if (!updateTeam) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Team leaving successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const changeRole = async (req: Request, res: Response) => {
  try {
    const { userId, teamId } = req.params;

    const teamMember = await teamMembersModel.findOne({
      where: { [Op.and]: [{ user_id: userId }, { team_id: teamId }] },
    });

    if (!teamMember) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    let newRole: "member" | "admin" = "admin";

    if (teamMember.role === "admin") {
      newRole = "member";
    }

    const changeRole = await teamMembersModel.update(
      { role: newRole },
      { where: { [Op.and]: [{ user_id: userId }, { team_id: teamId }] } }
    );
    if (!changeRole) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User has been made admin successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { userId, teamId } = req.params;

    const deleteTeamMember = await teamMembersModel.destroy({
      where: { [Op.and]: [{ user_id: userId }, { team_id: teamId }] },
    });
    if (!deleteTeamMember) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    const updateTeam = await teamModel.decrement(["members"], {
      by: 1,
      where: { id: teamId },
    });
    if (!updateTeam) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User removed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};
