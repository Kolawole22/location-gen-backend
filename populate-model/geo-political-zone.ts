import { GeoPoliticalZone } from "../models/geo-political-zone";

export const populateGeoPoliticalZones = async () => {
  const zones = [
    { zone: "North Central" },
    { zone: "North East" },
    { zone: "North West" },
    { zone: "South East" },
    { zone: "South South" },
    { zone: "South West" },
  ];

  try {
    // Use bulkCreate to insert all the zones at once
    await GeoPoliticalZone.bulkCreate(zones);
    console.log("Geopolitical zones populated successfully.");
  } catch (error) {
    console.error("Error populating geopolitical zones:", error);
  }
};

populateGeoPoliticalZones();
