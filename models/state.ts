import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../db";
import { GeoPoliticalZone } from "./geo-political-zone";

// Define the attributes for the State model
interface StateAttributes {
  id: number; // Primary key
  state_name: string; // Name of the state
  state_code: string; // Unique state code
  geo_political_zone_id: number; // Foreign key reference to GeoPoliticalZone
  // multi_polygon: any; // Type for storing MultiPolygon data
}

// Define the optional attributes for creation
interface StateCreationAttributes extends Optional<StateAttributes, "id"> {}

// Define the State model class
class State
  extends Model<StateAttributes, StateCreationAttributes>
  implements StateAttributes
{
  public id!: number; // Mark as required
  public state_name!: string; // Mark as required
  public state_code!: string; // Mark as required
  public geo_political_zone_id!: number; // Foreign key reference
  // public multi_polygon!: any;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Define the relationship with GeoPoliticalZone
  public static associate() {
    State.belongsTo(GeoPoliticalZone, {
      foreignKey: "geo_political_zone_id",
      as: "geoPoliticalZone",
    });
  }
}

// Initialize the model
State.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    state_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    geo_political_zone_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: GeoPoliticalZone,
        key: "id", // Reference the `id` from the GeoPoliticalZone table
      },
    },
    // multi_polygon: {
    //   type: DataTypes.GEOMETRY("MULTIPOLYGON"), // PostGIS field
    //   allowNull: true,
    // },
  },
  {
    sequelize, // Pass the Sequelize instance
    modelName: "states", // Define table name
    timestamps: true, // Enables createdAt and updatedAt fields
  }
);

export default State;
