import { Request, Response } from "express";
import { Result, ValidationError, validationResult } from "express-validator";
import randomstring from "randomstring";
import bcrypt from "bcrypt";
import { Op } from "sequelize";

import userModel, { userInstance } from "../database/models/userModel";
import { generateToken } from "../helpers/generateToken";
import { userInterface } from "../interfaces/interfaces";
import teamMembers from "../database/models/teamMembersModel";

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
    return res.status(200).json({
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
        userData: isUsername.dataValues,
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
    const isUser: userInstance | null = await userModel.findOne({
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
    let updateUser: [affectedRows: number] = await userModel.update(
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
      userData: dataValues,
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

    const isUser: userInstance | null = await userModel.findOne({
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

    let updateUser: [affectedRows: number] = await userModel.update(
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
    const isUser: userInstance | null = await userModel.findOne({
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

    const hashedPassword: string = await bcrypt.hash(password, 10);
    const updatePassword: [affectedRows: number] = await userModel.update(
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

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId: number =
      Number(req.params.id) || (req.user as userInterface).id;
    const user: userInstance | null = await userModel.findOne({
      where: { id: userId },
    });
    if (!user?.dataValues.id) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    return res.status(200).json({
      success: true,
      userData: user.dataValues,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(404)
        .json({ success: false, type: "payload", message: "Invalid payload" });
    }

    const { firstName, lastName, username, email } = req.body;
    const { id } = req.user as userInterface;

    const isUsername: userInstance | null = await userModel.findOne({
      where: { username: username },
    });
    const currentUsername: userInstance | null = await userModel.findOne({
      where: { username: (req.user as userInterface).username },
    });
    if (currentUsername === null) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    if (isUsername != null) {
      const { dataValues } = isUsername;
      if (currentUsername.dataValues.username !== username) {
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
    }

    const isEmail: userInstance | null = await userModel.findOne({
      where: { email: email },
    });
    const currentEmail: userInstance | null = await userModel.findOne({
      where: { email: (req.user as userInterface).email },
    });
    if (currentEmail === null) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong",
      });
    }
    if (isEmail != null) {
      const { dataValues } = isEmail;
      if (currentEmail.dataValues.email != email) {
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
    }

    let token: string = generateToken(
      firstName,
      lastName,
      username,
      email
    ) as string;

    const updateProfile: [affectedRows: number] = await userModel.update(
      {
        first_name: firstName,
        last_name: lastName,
        username: username,
        email: email,
      },
      { where: { id: id } }
    );
    if (!updateProfile) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      token: token,
      message: "User updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(404)
        .json({ success: false, type: "payload", message: "Invalid payload" });
    }

    const { currentPassword, password } = req.body;
    const { username } = req.user as userInterface;

    const user: userInstance | null = await userModel.findOne({
      where: { username: username },
    });
    if (user === null) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    const passwordResult: boolean = await bcrypt.compare(
      currentPassword,
      user.dataValues.password
    );
    if (!passwordResult) {
      return res.status(401).json({
        success: false,
        type: "password",
        message: "Current password is wrong",
      });
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);
    const updatePassword: [affectedRows: number] = await userModel.update(
      { password: hashedPassword },
      { where: { username: (req.user as userInterface).username } }
    );
    if (!updatePassword) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Password is updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const errors: Result<ValidationError> = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(404)
        .json({ success: false, type: "payload", message: "Invalid payload" });
    }

    const { currentPassword } = req.body;
    const user: userInstance | null = await userModel.findOne({
      where: { username: (req.user as userInterface).username },
    });
    if (user === null) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }
    const passwordResult: boolean = await bcrypt.compare(
      currentPassword,
      user.dataValues.password
    );
    if (!passwordResult) {
      return res.status(401).json({
        success: false,
        type: "password",
        message: "Current password is wrong",
      });
    }

    await teamMembers.destroy({
      where: { user_id: (req.user as userInterface).id },
    });

    const deleteUser: number = await userModel.destroy({
      where: { username: (req.user as userInterface).username },
    });
    if (!deleteUser) {
      return res.status(500).json({
        success: false,
        type: "server",
        message: "Something went wrong!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account is deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      type: "server",
      message: "Something went wrong!",
    });
  }
};
