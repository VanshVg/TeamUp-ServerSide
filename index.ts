import express, { Express, NextFunction, Request, Response } from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import "./database/connection";
import routes from "./routes/routes";
import passport from "passport";

config();

const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.use(passport.initialize());
app.use("/", routes);

const PORT: string | 4000 = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
