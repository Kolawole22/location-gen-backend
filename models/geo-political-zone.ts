import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../db";

// Define the attributes for the GeoPoliticalZone model
interface GeoPoliticalZoneAttributes {
  id: number;
  zone: string;
}

// Define the optional attributes for creation
interface GeoPoliticalZoneCreationAttributes
  extends Optional<GeoPoliticalZoneAttributes, "id"> {}

// Define the GeoPoliticalZone model class
export class GeoPoliticalZone
  extends Model<GeoPoliticalZoneAttributes, GeoPoliticalZoneCreationAttributes>
  implements GeoPoliticalZoneAttributes
{
  public id!: number; // Mark as required
  public zone!: string; // Mark as required

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
GeoPoliticalZone.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    zone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize, // Pass the Sequelize instance
    modelName: "geo_political_zones", // Define table name
    timestamps: true, // Enables createdAt and updatedAt fields
  }
);
