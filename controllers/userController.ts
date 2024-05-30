import { Request, Response } from "express";
import { Result, ValidationError, validationResult } from "express-validator";
import randomstring from "randomstring";
import bcrypt from "bcrypt";
import { Op } from "sequelize";

import userModel, { userInstance } from "../database/models/userModel";
import { generateToken } from "../helpers/generateToken";
import { userInterface } from "../interfaces/interfaces";

export const register = async (req: Request, res: Response) => {
  try {
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(404)
        .json({ success: false, type: "payload", message: "Invalid payload" });
    }

    const { firstName, lastName, username, email, password } = req.body;

    const isUsername: userInstance | null = await userModel.findOne({
      where: { username: username },
    });
    if (isUsername != null) {
      const { dataValues } = isUsername;
      if (!dataValues.is_active) {
        let createdAt: number = dataValues.created_at.getTime();
        let currentTime: number = new Date().getTime();
        if ((currentTime - createdAt) / 60000 > 60) {
          let deleteUser: number = await userModel.destroy({
            where: { username: username },
          });
          if (!deleteUser) {
            return res.status(500).json({
              success: false,
              type: "server",
              message: "Something went wrong",
            });
          }
        } else {
          return res.status(409).json({
            success: false,
            type: "username",
            message: "Username is already taken",
          });
        }
      } else {
        return res.status(409).json({
          success: false,
          type: "username",
          message: "Username is already taken",
        });
      }
    }

    const isEmail: userInstance | null = await userModel.findOne({
      where: { email: email },
    });
    if (isEmail != null) {
      const { dataValues } = isEmail;
      if (!dataValues.is_active) {
        let createdAt: number = dataValues.created_at.getTime();
        let currentTime: number = new Date().getTime();
        if ((currentTime - createdAt) / 60000 > 60) {
          let deleteUser: number = await userModel.destroy({
            where: { email: email },
          });
          if (!deleteUser) {
            return res.status(500).json({
              success: false,
              type: "server",
              message: "Something went wrong",
            });
          }
        } else {
          return res.status(409).json({
            success: false,
            type: "email",
            message: "Email is already taken",
          });
        }
      } else {
        return res.status(409).json({
          success: false,
          type: "email",
          message: "Email is already taken",
        });
      }
    }

    let verificationToken: string = randomstring.generate({
      length: 12,
      charset: "alphanumeric",
    });

    let hashedPassword: string = await bcrypt.hash(password, 10);

    const user: userInstance = await userModel.create({
      first_name: firstName,
      last_name: lastName,
      username: username,
      email: email,
      password: hashedPassword,
      verification_token: verificationToken,
      is_active: 0,
    });
    if (!user.dataValues.id) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong",
      });
    }

    let token: string = generateToken(
      firstName,
      lastName,
      username,
      email
    ) as string;
    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        token: token,
        verification_token: verificationToken,
        message: "User registered successfully",
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(404)
        .json({ success: false, type: "payload", message: "Invalid payload" });
    }

    const { username, password } = req.body;

    let isUsername: userInstance = (await userModel.findOne({
      where: { [Op.or]: [{ username: username }, { email: username }] },
    })) as userInstance;
    if (isUsername !== null && isUsername.dataValues.deleted_at === null) {
      const { dataValues } = isUsername;

      let isPassword: boolean = await bcrypt.compare(
        password,
        dataValues.password
      );
      if (isPassword !== true) {
        return res.status(401).json({
          success: false,
          type: "credentials",
          message: "Invalid Credentials",
        });
      }

      if (!dataValues.is_active) {
        return res.status(401).json({
          success: false,
          type: "active",
          message: "Account isn't activated",
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        type: "credentials",
        message: "Invalid Credentials",
      });
    }

    let token: string = generateToken(
      isUsername.dataValues.first_name,
      isUsername.dataValues.last_name,
      isUsername.dataValues.username,
      isUsername.dataValues.email
    ) as string;

    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .json({
        success: true,
        token: token,
        message: "Login successful",
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const activate = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const isUser = await userModel.findOne({
      where: {
        [Op.and]: [
          { id: (req.user as userInterface).id },
          { verification_token: token },
        ],
      },
    });
    if (isUser == null) {
      return res.status(403).json({
        success: false,
        type: "unauthorised",
        message: "User isn't authorised to access this page",
      });
    }
    let { dataValues } = isUser;

    let createdAt: number = dataValues.created_at.getTime();
    let currentTime: number = new Date().getTime();
    if ((currentTime - createdAt) / 60000 > 60) {
      return res.status(403).json({
        success: false,
        type: "unauthorised",
        message: "Token is expired please Register again",
      });
    }
    let updateUser = userModel.update(
      { is_active: 1 },
      { where: { id: (req.user as userInterface).id } }
    );
    if (!updateUser) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User activated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const verifyAccount = async (req: Request, res: Response) => {
  try {
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(404)
        .json({ success: false, type: "payload", message: "Invalid payload" });
    }

    const { username } = req.body;

    const isUser = await userModel.findOne({
      where: { [Op.or]: [{ username: username }, { email: username }] },
    });

    if (isUser == null) {
      return res.status(404).json({
        success: false,
        type: "not_found",
        message: "User not found",
      });
    }
    if (!isUser.dataValues.is_active) {
      return res.status(404).json({
        success: false,
        type: "not_active",
        message: "Account isn't activated",
      });
    }

    let resetToken: string = randomstring.generate({
      length: 12,
      charset: "alphanumeric",
    });

    let updateUser = await userModel.update(
      { reset_token: resetToken },
      { where: { [Op.or]: [{ username: username }, { email: username }] } }
    );
    if (!updateUser) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    return res.status(200).json({
      success: true,
      reset_token: resetToken,
      message: "Account is verified",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { username } = req.body;
    [{ verification_token: token }];
    const isUser = await userModel.findOne({
      where: {
        [Op.and]: [
          { [Op.or]: [{ username: username }, { email: username }] },
          { reset_token: token },
        ],
      },
    });
    if (isUser == null) {
      return res.status(403).json({
        success: false,
        type: "unauthorised",
        message: "User isn't authorised to access this page",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User is authorised",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(404)
        .json({ success: false, type: "payload", message: "Invalid payload" });
    }

    const { password, username } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatePassword = await userModel.update(
      { password: hashedPassword },
      { where: { [Op.or]: [{ username: username }, { email: username }] } }
    );
    if (!updatePassword[0]) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};
