import State from "../models/state";
import {
  decodeFromBase32,
  denormalizeCoordinates,
  encodeToBase32,
  normalizeCoordinates,
} from "../utils/locationUtil";

const nigeriaMaximumLatitude = 14;
const nigeriaMinimumLatitude = 4;
const nigeriaMaximumLongitude = 15;
const nigeriaMinimumLongitude = 3;

export const generateLocationCode = async (
  latitude: number,
  longitude: number,
  city: string,
  state: string
) => {
  // Step 1: Normalize latitude and longitude
  const normalizedLat = normalizeCoordinates(
    latitude,
    nigeriaMinimumLatitude,
    nigeriaMaximumLatitude
  ); // Nigeria lat range (4°N - 14°N)
  const normalizedLong = normalizeCoordinates(
    longitude,
    nigeriaMinimumLongitude,
    nigeriaMaximumLongitude
  ); // Nigeria long range (3°E - 15°E)

  // Step 2: Convert to alphanumeric grid code (base-32 encoding)
  const latCode = encodeToBase32(normalizedLat);
  const longCode = encodeToBase32(normalizedLong);
  console.log({ latCode, longCode });

  const stateData = await State.findOne({
    where: { state_name: state.toLowerCase() },
  });
  const stateCode = stateData?.toJSON().state_code.toUpperCase();

  // Step 3: Optional: Add regional code (e.g., LAG for Lagos)
  // const regionCode = stateCode ? `${stateCode?.toUpperCase()}` : "";

  // Step 4: Combine parts to form the final location code
  // console.log({ regionCode });
  console.log(`${stateCode}-${latCode}${longCode}`);

  return `${stateCode}-${latCode}${longCode}`;
};

export const decodeLocationCode = async (locationCode: string) => {
  if (!locationCode) {
    return null;
  }
  const codeWithoutRegion = locationCode.split("-").pop(); // Remove region prefix if present
  if (!codeWithoutRegion) {
    return null;
  }

  const latCode = codeWithoutRegion.slice(0, 5);
  const longCode = codeWithoutRegion.slice(5);

  const normalizedLat = decodeFromBase32(latCode);
  const normalizedLong = decodeFromBase32(longCode);

  const latitude = denormalizeCoordinates(
    normalizedLat,
    nigeriaMinimumLatitude,
    nigeriaMaximumLatitude
  ); // Inverse of normalization (latitude range 4-14)
  const longitude = denormalizeCoordinates(
    normalizedLong,
    nigeriaMinimumLongitude,
    nigeriaMaximumLongitude
  ); // Inverse of normalization (longitude range 3-15)

  const stateData = await State.findOne({
    where: { state_code: locationCode.split("-")[0] },
  });
  const stateName = stateData?.toJSON().state_name.toUpperCase();
  console.log(stateName);

  return { latitude, longitude, stateName };
};
