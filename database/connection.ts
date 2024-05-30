import { Sequelize } from "sequelize-typescript";
import { config } from "dotenv";

config();

interface dbInterface {
  db_name: string;
  db_user: string;
  db_pass: string;
  db_host: string;
}

const db_info: dbInterface = {
  db_name: process.env.DB_NAME as string,
  db_user: process.env.DB_USER as string,
  db_pass: process.env.DB_PASS as string,
  db_host: process.env.DB_HOST as string,
};

const sequelize: Sequelize = new Sequelize(
  db_info.db_name,
  db_info.db_user,
  db_info.db_pass,
  {
    host: db_info.db_host,
    dialect: "mysql",
    logging: false,
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log(`Database is connected`);
  })
  .catch((error) => {
    if (error) {
      console.log(`Error while creating database`, error);
    }
  });

sequelize
  .sync({})
  .then(() => {
    console.log(`tables are synchronized`);
  })
  .catch((error) => {
    console.log(`Error while synchronizing tables`, error);
  });

export default sequelize;
