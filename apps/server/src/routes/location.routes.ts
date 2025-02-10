import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";
import { generateUniqueCode } from "../utils/codes";

const router = Router();

const createLocationSchema = z.object({
  name: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isPublic: z.boolean().optional(),
  isCurrentLocation: z.boolean().optional(),
  isExcludedFromSharing: z.boolean().optional(),
});

const shareLocationSchema = z.object({
  locationId: z.string(),
  userCode: z.string(),
});

// Get all locations
router.get("/", authenticate, async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany({
      where: {
        OR: [
          { userId: req.user!.id },
          { isPublic: true },
          {
            sharedWith: {
              some: {
                sharedWithId: req.user!.id,
                location: { isExcludedFromSharing: false },
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    res.json({ status: "success", data: { locations } });
  } catch (error) {
    next(error);
  }
});

// Create location
router.post("/", authenticate, async (req, res, next) => {
  try {
    const data = createLocationSchema.parse(req.body);

    // If this is meant to be the current location
    if (data.isCurrentLocation) {
      // Find any existing current location
      const existingCurrentLocation = await prisma.location.findFirst({
        where: {
          userId: req.user!.id,
          isCurrentLocation: true,
        },
      });

      if (existingCurrentLocation) {
        // Update existing current location
        const location = await prisma.location.update({
          where: { id: existingCurrentLocation.id },
          data: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        });

        return res.json({
          status: "success",
          data: { location },
        });
      }
    }

    // For new locations (both current and saved)
    const code = await generateUniqueCode();
    const location = await prisma.location.create({
      data: {
        ...data,
        code,
        userId: req.user!.id,
      },
    });

    res.json({
      status: "success",
      data: { location },
    });
  } catch (error) {
    next(error);
  }
});

// Update location
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = createLocationSchema.partial().parse(req.body);

    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new AppError(404, "Location not found");
    }

    if (location.userId !== req.user!.id) {
      throw new AppError(403, "Not authorized");
    }

    // If trying to set as current location
    if (data.isCurrentLocation) {
      // First, unset any existing current location
      await prisma.location.updateMany({
        where: {
          userId: req.user!.id,
          isCurrentLocation: true,
          id: { not: id },
        },
        data: {
          isCurrentLocation: false,
          isTracking: false,
        },
      });
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data,
    });

    res.json({ status: "success", data: { location: updatedLocation } });
  } catch (error) {
    next(error);
  }
});

// Start tracking
router.post("/:id/track", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new AppError(404, "Location not found");
    }

    if (location.userId !== req.user!.id) {
      throw new AppError(403, "Not authorized");
    }

    if (!location.isCurrentLocation) {
      throw new AppError(400, "Only current location can be tracked");
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: { isTracking: true },
    });

    res.json({ status: "success", data: { location: updatedLocation } });
  } catch (error) {
    next(error);
  }
});

// Stop tracking
router.post("/:id/stop", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new AppError(404, "Location not found");
    }

    if (location.userId !== req.user!.id) {
      throw new AppError(403, "Not authorized");
    }

    if (!location.isCurrentLocation) {
      throw new AppError(400, "Only current location can be tracked");
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: { isTracking: false },
    });

    res.json({ status: "success", data: { location: updatedLocation } });
  } catch (error) {
    next(error);
  }
});

// Toggle sharing exclusion
router.post("/:id/toggle-sharing", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new AppError(404, "Location not found");
    }

    if (location.userId !== req.user!.id) {
      throw new AppError(403, "Not authorized");
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: { isExcludedFromSharing: !location.isExcludedFromSharing },
    });

    res.json({ status: "success", data: { location: updatedLocation } });
  } catch (error) {
    next(error);
  }
});

// Share a location with another user
router.post("/share", authenticate, async (req, res, next) => {
  try {
    const { locationId, userCode } = shareLocationSchema.parse(req.body);

    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new AppError(404, "Location not found", "LOCATION_NOT_FOUND");
    }

    if (location.userId !== req.user!.id) {
      throw new AppError(403, "Not authorized", "NOT_AUTHORIZED");
    }

    const targetUser = await prisma.user.findUnique({
      where: { code: userCode },
    });

    if (!targetUser) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    const sharedLocation = await prisma.sharedLocation.create({
      data: {
        locationId,
        sharedById: req.user!.id,
        sharedWithId: targetUser.id,
      },
      include: {
        location: true,
        sharedBy: {
          select: {
            name: true,
            code: true,
          },
        },
        sharedWith: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: { sharedLocation },
    });
  } catch (error) {
    next(error);
  }
});

// Delete a location
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new AppError(404, "Location not found", "LOCATION_NOT_FOUND");
    }

    if (location.userId !== req.user!.id) {
      throw new AppError(403, "Not authorized", "NOT_AUTHORIZED");
    }

    await prisma.sharedLocation.deleteMany({
      where: { locationId: id },
    });

    await prisma.location.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get locations shared with the authenticated user
router.get("/shared/with-me", authenticate, async (req, res, next) => {
  try {
    const sharedLocations = await prisma.sharedLocation.findMany({
      where: {
        sharedWithId: req.user!.id,
      },
      include: {
        location: true,
        sharedBy: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    res.json({
      status: "success",
      data: { sharedLocations },
    });
  } catch (error) {
    next(error);
  }
});

// Get locations shared by the authenticated user
router.get("/shared/by-me", authenticate, async (req, res, next) => {
  try {
    const sharedLocations = await prisma.sharedLocation.findMany({
      where: {
        sharedById: req.user!.id,
      },
      include: {
        location: true,
        sharedWith: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    res.json({
      status: "success",
      data: { sharedLocations },
    });
  } catch (error) {
    next(error);
  }
});

// Unshare a location
router.delete("/shared/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const sharedLocation = await prisma.sharedLocation.findUnique({
      where: { id },
    });

    if (!sharedLocation) {
      throw new AppError(
        404,
        "Shared location not found",
        "SHARED_LOCATION_NOT_FOUND"
      );
    }

    // Check if the user is the one who shared the location
    if (sharedLocation.sharedById !== req.user!.id) {
      throw new AppError(403, "Not authorized", "NOT_AUTHORIZED");
    }

    await prisma.sharedLocation.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const locationRouter = router;
