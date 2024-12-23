import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../db";
import State from "./state";

interface LGAAttributes {
  id: number;
  state_id: number;
  lga_name: string;
}

interface LGACreationAttributes extends Optional<LGAAttributes, "id"> {}

export class LGA
  extends Model<LGAAttributes, LGACreationAttributes>
  implements LGAAttributes
{
  public id!: number; // Mark as required
  public state_id!: number; // Mark as required
  public lga_name!: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
LGA.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    state_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: State,
        key: "id",
      },
    },
    lga_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize, // Pass the Sequelize instance
    modelName: "lga", // Define table name
    timestamps: true, // Enables createdAt and updatedAt fields
  }
);
