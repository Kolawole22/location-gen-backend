import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { generateUniqueCode } from "../utils/codes";

const locationSchema = z.object({
  name: z.string(),
  // address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  isCurrentLocation: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isExcludedFromSharing: z.boolean().optional(),
});

const updateLocationSchema = locationSchema.partial();

const shareLocationSchema = z.object({
  sharedWithCode: z.string(),
  userCode: z.string(),
});

// Get all locations for a user
export const getLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("req.user!.id", req.user!.id);
  try {
    const locations = await prisma.location.findMany({
      where: {
        userId: req.user!.id,
      },
      include: {
        user: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      status: "success",
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};

// Get current location for a user
export const getCurrentLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentLocation = await prisma.location.findFirst({
      where: {
        userId: req.user!.id,
        isCurrentLocation: true,
      },
    });

    if (!currentLocation) {
      throw new AppError(404, "No current location set", "NO_CURRENT_LOCATION");
    }

    res.json({
      status: "success",
      data: currentLocation,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new location
export const createLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const locationData = locationSchema.parse(req.body);
    const code = await generateUniqueCode();
    console.log("locationData", locationData);

    // If this is set as current location, unset any existing current location
    if (locationData.isCurrentLocation) {
      await prisma.location.updateMany({
        where: {
          userId: req.user!.id,
          isCurrentLocation: true,
        },
        data: {
          isCurrentLocation: false,
        },
      });
    }

    const location = await prisma.location.create({
      data: {
        ...locationData,
        code,
        userId: req.user!.id,
      },
    });

    res.json({
      status: "success",
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

// Update a location
export const updateLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const locationData = updateLocationSchema.parse(req.body);

    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new AppError(404, "Location not found", "LOCATION_NOT_FOUND");
    }

    if (location.userId !== req.user!.id) {
      throw new AppError(403, "Not authorized", "NOT_AUTHORIZED");
    }

    // If this is being set as current location, unset any existing current location
    if (locationData.isCurrentLocation) {
      await prisma.location.updateMany({
        where: {
          userId: req.user!.id,
          isCurrentLocation: true,
          id: { not: id },
        },
        data: {
          isCurrentLocation: false,
        },
      });
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: locationData,
    });

    res.json({
      status: "success",
      data: updatedLocation,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a location
export const deleteLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    await prisma.location.delete({
      where: { id },
    });

    res.json({
      status: "success",
      message: "Location deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Set a location as current
export const setCurrentLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    // Unset any existing current location
    await prisma.location.updateMany({
      where: {
        userId: req.user!.id,
        isCurrentLocation: true,
        id: { not: id },
      },
      data: {
        isCurrentLocation: false,
      },
    });

    // Set this location as current
    const updatedLocation = await prisma.location.update({
      where: { id },
      data: {
        isCurrentLocation: true,
      },
    });

    res.json({
      status: "success",
      data: updatedLocation,
    });
  } catch (error) {
    next(error);
  }
};

export const startTracking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
};

export const stopTracking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
};

// Share a location with another user
export const shareLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: locationId } = req.params;
    const { sharedWithCode, userCode } = shareLocationSchema.parse(req.body);

    // 1. Verify the location exists and belongs to the current user
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    console.log("location", location);
    console.log("sharedWithCode", sharedWithCode);
    console.log("userCode", userCode);
    console.log("req.user!.id", req.user!.id);

    if (!location || location.userId !== req.user!.id) {
      throw new AppError(404, "Location not found", "LOCATION_NOT_FOUND");
    }

    // 2. Find the user to share with using their code
    const sharedWithUser = await prisma.user.findFirst({
      where: { code: userCode },
    });

    if (!sharedWithUser) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    // 3. Create the shared location entry
    const sharedLocation = await prisma.sharedLocation.create({
      data: {
        locationId: locationId,
        sharedById: req.user!.id,
        sharedWithId: sharedWithUser.id,
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
      data: sharedLocation,
    });
  } catch (error) {
    next(error);
  }
};

// Unshare a location with another user
export const unshareLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      where: {
        locationId: id,
      },
    });

    res.json({
      status: "success",
      message: "Location unshared successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("req.user!.id", req.user!.id);
    const sharedLocations = await prisma.sharedLocation.findMany({
      where: {
        sharedWithId: req.user!.id,
      },
      include: {
        location: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        sharedBy: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      status: "success",
      data: sharedLocations,
    });
  } catch (error) {
    next(error);
  }
};

export const getMySharedLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const myShared = await prisma.sharedLocation.findMany({
      where: {
        sharedById: req.user!.id,
      },
      include: {
        location: true,
        sharedWith: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      status: "success",
      data: myShared,
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const sharedLocation = await prisma.sharedLocation.findUnique({
      where: { id },
      include: {
        location: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                code: true,
              },
            },
          },
        },
        sharedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            code: true,
          },
        },
      },
    });

    if (!sharedLocation || sharedLocation.sharedWithId !== req.user!.id) {
      throw new AppError(404, "Shared location not found");
    }

    res.json({
      status: "success",
      data: {
        ...sharedLocation.location,
        sharedBy: sharedLocation.sharedBy,
        sharedAt: sharedLocation.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
