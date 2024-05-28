import { Request } from "express";
import passport from "passport";
import {
  Strategy,
  StrategyOptions,
  StrategyOptionsWithRequest,
  VerifiedCallback,
} from "passport-jwt";
import { config } from "dotenv";

import userModel from "../database/models/userModel";
import { JwtPayload } from "jsonwebtoken";

config();

const cookieExtractor = (req: Request): string => {
  let token: string = "";
  if (req && req.cookies) {
    token = req.cookies.token;
  }
  return token;
};

export const applyPassportStrategy = () => {
  let jwt;
  try {
    jwt = cookieExtractor;

    const options: StrategyOptions = {
      jwtFromRequest: jwt,
      secretOrKey: process.env.SECRET_KEY as string,
    } as StrategyOptionsWithRequest;

    passport.use(
      new Strategy(
        options,
        async (jwt_payload: JwtPayload, done: VerifiedCallback) => {
          const isUser = await userModel.findOne({
            where: { email: jwt_payload.data.email },
          });
          if (isUser == null) {
            return done(null, false);
          }
          return done(null, isUser.dataValues);
        }
      )
    );
  } catch (error) {
    return null;
  }
};
