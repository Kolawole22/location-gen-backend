import { Op } from "sequelize";
import { states } from "../data/states";
import { GeoPoliticalZone } from "../models/geo-political-zone";
import State from "../models/state";

export const populateStates = async () => {
  // Define the states and their respective geopolitical zones

  try {
    // Loop through the states and insert them into the database
    for (const state of states) {
      const geoZone = await GeoPoliticalZone.findOne({
        where: { zone: state.geo_political_zone },
      });
      if (geoZone) {
        await State.create({
          state_name: state.state_name.toLowerCase(),
          state_code: state.state_code,
          geo_political_zone_id: geoZone.toJSON().id, // Set the GeoPoliticalZone ID as the foreign key
        });
      }
    }
    console.log(
      JSON.stringify(
        await GeoPoliticalZone.findOne({ where: { zone: "South West" } })
      )
    );
    console.log("States populated successfully.");
  } catch (error) {
    console.error("Error populating states:", error);
  }
};

populateStates();
