// src/utils/locationUtils.js

// Normalize coordinates within a specific range (min-max)
export const normalizeCoordinates = (
  coord: number,
  min: number,
  max: number
) => {
  return (coord - min) / (max - min);
};

// Denormalize coordinates (reverse normalization)
export const denormalizeCoordinates = (
  normalizedValue: number,
  min: number,
  max: number
) => {
  return normalizedValue * (max - min) + min;
};

// Encode the normalized value to base-32
export const encodeToBase32 = (normalizedValue: number) => {
  const base32Chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Skipping confusing characters (I, O, etc.)
  let encoded = "";

  // Convert the normalized value to a 5-character string in base-32
  for (let i = 0; i < 5; i++) {
    const index = Math.floor(normalizedValue * base32Chars.length);
    encoded += base32Chars[index % base32Chars.length];
    normalizedValue = (normalizedValue * base32Chars.length) % 1;
  }

  return encoded;
};

// Decode from base-32 to normalized value
export const decodeFromBase32 = (base32Str: string) => {
  const base32Chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let normalizedValue = 0;

  for (let i = 0; i < base32Str.length; i++) {
    const charValue = base32Chars.indexOf(base32Str[i]);
    normalizedValue += charValue / Math.pow(base32Chars.length, i + 1);
  }

  return normalizedValue;
};
