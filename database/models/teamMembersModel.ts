import { Model, Optional } from "sequelize";
import sequelize from "../connection";
import { DataType } from "sequelize-typescript";
import users from "./userModel";
import teams from "./teamModel";

interface teamMembersInterface {
  id: number;
  team_id: number;
  user_id: number;
  role: "admin" | "member";
  created_at: Date;
  updated_at: Date;
}

interface teamMembersCreationAttributes
  extends Optional<teamMembersInterface, "id" | "created_at" | "updated_at"> {}

export interface teamMembersInstance
  extends Model<teamMembersInterface, teamMembersCreationAttributes>,
    teamMembersInterface {
  created_at: Date;
  updated_at: Date;
}

const teamMembers = sequelize.define<teamMembersInstance>(
  `team_has_members`,
  {
    id: {
      type: DataType.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
    },
    team_id: {
      type: DataType.INTEGER,
      references: {
        model: "teams",
        key: "id",
      },
    },
    user_id: {
      type: DataType.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
    },
    role: {
      type: DataType.STRING,
    },
    created_at: {
      type: DataType.DATE,
    },
    updated_at: {
      type: DataType.DATE,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

teamMembers.hasMany(users);
teamMembers.hasMany(teams);

export default teamMembers;
