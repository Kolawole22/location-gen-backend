import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";

const router = Router();

router.get("/search", authenticate, async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      throw new AppError(400, "Search query required");
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { code: { contains: query, mode: "insensitive" } },
          { customCode: { contains: query, mode: "insensitive" } },
        ],
        NOT: { id: req.user!.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        code: true,
        customCode: true,
        createdAt: true,
      },
    });

    res.json({ status: "success", data: users });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        locations: {
          where: {
            OR: [
              { isPublic: true },
              { sharedWith: { some: { sharedWithId: req.user!.id } } },
            ],
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    res.json({
      status: "success",
      data: {
        ...user,
        password: undefined, // Exclude sensitive fields
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRouter };
