import { Model, Optional } from "sequelize";
import sequelize from "../connection";
import { DataType } from "sequelize-typescript";
import users from "./userModel";
import teams from "./teamModel";

export interface teamMembersInterface {
  id: number;
  team_id: number;
  user_id: number;
  role: "admin" | "member";
  is_archived: boolean;
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
    },
    user_id: {
      type: DataType.INTEGER,
    },
    role: {
      type: DataType.STRING,
    },
    is_archived: {
      type: DataType.BOOLEAN,
      allowNull: false,
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

teamMembers.belongsTo(users, {
  foreignKey: "user_id",
});
teamMembers.belongsTo(teams, {
  foreignKey: "team_id",
});

teams.hasMany(teamMembers, { foreignKey: "team_id" });

export default teamMembers;
