import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";
import { generateUniqueCode } from "../utils/codes";
import {
  createLocation,
  updateLocation,
  deleteLocation,
  getLocations,
  getCurrentLocation,
  setCurrentLocation,
  shareLocation,
  unshareLocation,
  getSharedLocations,
  getMySharedLocations,
  getSharedLocation,
} from "../controllers/location.controller";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Sharing routes
router.get("/shared-with-me", getSharedLocations);
router.get("/my-shared", getMySharedLocations);
router.post("/share/:id", shareLocation);
router.delete("/share/:id", unshareLocation);
router.get("/shared-location/:id", getSharedLocation);
// Location routes
router.get("/", getLocations);
router.post("/", createLocation);

router.get("/current", getCurrentLocation);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);
router.post("/:id/current", setCurrentLocation);

// Add this to your existing routes

export { router as locationRouter };
