import type { Request, Response } from "express";
import {
  decodeLocationCode,
  generateLocationCode,
} from "../services/codeGeneration";

export const getLocationCode = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, city, state } = req.body;
    console.log("req body", req.body);

    if (!latitude || !longitude) {
      res.status(400).json({ error: "Latitude and Longitude are required" });
      return;
    }

    const locationCode = await generateLocationCode(
      latitude,
      longitude,
      city,
      state
    );
    // console.log('loc code', locationCode)
    res.status(200).json({ locationCode });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getLocation = async (req: Request, res: Response) => {
  try {
    const { locationCode } = req.body;
    console.log({ locationCode });

    if (!locationCode) {
      res.status(400).json({ error: "Location code is required" });
      return;
    }

    const decodedLocation = await decodeLocationCode(locationCode);
    res.status(200).json({ decodedLocation });
  } catch (error) {
    res.status(500).json({ error: "Failed to decode location code" });
  }
};
