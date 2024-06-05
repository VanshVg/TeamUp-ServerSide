import { Model, Optional } from "sequelize";

import sequelize from "../connection";
import { DataType } from "sequelize-typescript";
import teamMembers from "./teamMembersModel";

export interface teamInterface {
  id: number;
  name: string;
  description: string;
  code: string;
  members: number;
  banner_url: string;
  created_at: Date;
  updated_at: Date;
}

interface teamCreationAttribute
  extends Optional<
    teamInterface,
    "id" | "description" | "created_at" | "updated_at"
  > {}

export interface teamInstance
  extends Model<teamInterface, teamCreationAttribute>,
    teamInterface {
  created_at: Date;
  updated_at: Date;
}

const teams = sequelize.define<teamInstance>(
  `teams`,
  {
    id: {
      type: DataType.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
    },
    name: {
      type: DataType.STRING,
      allowNull: false,
    },
    description: {
      type: DataType.STRING,
    },
    code: {
      type: DataType.STRING,
      allowNull: false,
    },
    members: {
      type: DataType.INTEGER,
      allowNull: false,
    },
    banner_url: {
      type: DataType.STRING,
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

export default teams;
