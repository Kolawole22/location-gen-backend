import { Sequelize, DataTypes } from "sequelize";

const dbName = process.env.DB_NAME || "";
const dbUserName = process.env.DB_USERNAME || "";
const dbPassword = process.env.DB_PASSWORD || "";
const dbHostname = process.env.DB_HOSTNAME || "";
const dbUrl = process.env.DB_URL || "";
// console.log(dbName);

export const sequelize = new Sequelize(dbUrl);
