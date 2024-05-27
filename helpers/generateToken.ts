import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

export const generateToken = (
  firstName: string,
  lastName: string,
  username: string,
  email: string
) => {
  try {
    return jwt.sign(
      {
        data: {
          firstName: firstName,
          lastName: lastName,
          username: username,
          email: email,
        },
      },
      process.env.SECRET_KEY
    );
  } catch (error) {
    console.log(`Error while generating token`, error);
  }
};
