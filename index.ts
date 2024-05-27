import express, { Express } from "express";
import { config } from "dotenv";

import "./database/connection";
import routes from "./routes/routes";

config();

const app: Express = express();

app.use(express.json());
app.use("/", routes);

const PORT: string | 4000 = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
