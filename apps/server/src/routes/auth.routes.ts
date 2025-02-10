import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

const generateUniqueCode = async (): Promise<string> => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  while (true) {
    // Generate 4 random letters and 4 random numbers
    const letters = Array.from(
      { length: 4 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)]
    );
    const digits = Array.from(
      { length: 4 },
      () => numbers[Math.floor(Math.random() * numbers.length)]
    );

    // Combine letters and numbers
    const combined = [...letters, ...digits];

    // Shuffle the combined array
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    const code = combined.join("");

    // Check if code is already in use
    const existingUser = await prisma.user.findUnique({
      where: { code },
    });

    if (!existingUser) return code;
  }
};

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(400, "Email already in use", "EMAIL_IN_USE");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = await generateUniqueCode();

    // Create user and their default current location in a transaction
    const { user, token } = await prisma.$transaction(async (tx) => {
      // Create the user first
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          code,
        },
      });

      // Create their default current location
      await tx.location.create({
        data: {
          name: "Current Location",
          code: user.code, // Use the same code as the user
          isCurrentLocation: true,
          isTracking: false,
          isPublic: false,
          userId: user.id,
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || "",
        {
          expiresIn:
            Number(process.env.JWT_EXPIRES_IN?.replace("d", "")) * 24 * 60 * 60,
        }
      );
      return { user, token };
    });

    res.json({
      status: "success",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          code: user.code,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log("user", user);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "",
      {
        expiresIn:
          Number(process.env.JWT_EXPIRES_IN?.replace("d", "")) * 24 * 60 * 60,
      }
    );

    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          code: user.code,
          customCode: user.customCode,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Check authentication and get user details
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        code: true,
        customCode: true,
      },
    });

    if (!user) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    res.json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;
