import express from "express";
import { getLocation, getLocationCode } from "../controller/locationController";

export const locationRouter = express.Router();

locationRouter.route("/generate-code").post(getLocationCode);
locationRouter.route("/decode-code").post(getLocation);
