import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../db";

interface UserAttributes {
  id: string;
  username: string;
  email: string;
  password?: string;
  photo?: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

export class User extends Model<UserAttributes, UserCreationAttributes> {
  declare id: string;
  declare username: string;
  declare email: string;
  declare password: string;
  declare photo?: string;

  static associate(models: any) {
    // Define associations here if needed
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "user",
    defaultScope: {
      attributes: {
        exclude: ["password"],
      },
    },
  }
);

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};
