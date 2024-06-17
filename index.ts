import express, { Express } from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { Server } from "socket.io";

import "./database/connection";
import routes from "./routes/routes";

config();

const app: Express = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(passport.initialize());
app.use("/", routes);

const PORT: string | 4000 = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
  },
});

io.on("connection", (socket) => {
  socket.on("newUser", (username: string) => {
    console.log("Outside", username);
    if (username) {
      console.log("Inside", username);
      socket.broadcast.emit("join", username);
    }
  });
});
