import { lga } from "../data/lga";
import { GeoPoliticalZone } from "../models/geo-political-zone";
import { LGA } from "../models/lga";

export const populateLGA = async () => {
  try {
    // Use bulkCreate to insert all the zones at once
    await LGA.bulkCreate(lga);
    console.log("LGAs populated successfully.");
  } catch (error) {
    console.error("Error populating LGAs:", error);
  }
};
