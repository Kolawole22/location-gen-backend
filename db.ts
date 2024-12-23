import { Sequelize, DataTypes } from "sequelize";

const dbName = process.env.DB_NAME || "";
const dbUserName = process.env.DB_USERNAME || "";
const dbPassword = process.env.DB_PASSWORD || "";

export const sequelize = new Sequelize(dbName, dbUserName, dbPassword, {
  host: "localhost",
  dialect: "postgres",
});
