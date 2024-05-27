import { Request, Response } from "express";
import { Result, ValidationError, validationResult } from "express-validator";
import randomstring from "randomstring";
import bcrypt from "bcrypt";

import userModel, { userInstance } from "../database/models/userModel";
import { generateToken } from "../helpers/generateToken";

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

    let hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
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

    let token = generateToken(firstName, lastName, username, email);

    return res
      .status(200)
      .cookie("userToken", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      })
      .json({
        success: true,
        verification_token: verificationToken,
        message: "User registered successfully",
      });
  } catch (error) {
    console.log(`Error inside register controller`, error);
  }
};
