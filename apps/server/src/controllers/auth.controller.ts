import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { generateUniqueCode } from "../utils/codes";
import { sendEmail } from "../utils/email";

const signupSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(400, "Email already registered", "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = await generateUniqueCode();

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        code,
      },
    });

    // await sendEmail({
    //   to: email,
    //   subject: "Verify your email",
    //   text: `Please verify your email by clicking this link: ${process.env.CLIENT_URL}/verify-email/${verificationToken}`,
    // });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
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
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
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
          customCode: user.customCode,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json({
        status: "success",
        message:
          "If an account exists with that email, a password reset link has been sent.",
      });
    }

    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken },
    });

    await sendEmail({
      to: email,
      subject: "Reset your password",
      text: `Click this link to reset your password: ${process.env.CLIENT_URL}/reset-password/${resetToken}`,
    });

    res.json({
      status: "success",
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        resetToken: token,
      },
    });

    if (!user) {
      throw new AppError(
        400,
        "Invalid or expired reset token",
        "INVALID_TOKEN"
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
      },
    });

    res.json({
      status: "success",
      message: "Password has been reset successfully",
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(
        new AppError(400, "Invalid or expired reset token", "INVALID_TOKEN")
      );
    } else {
      next(error);
    }
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      email: string;
    };

    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
        verificationToken: token,
      },
    });

    if (!user) {
      throw new AppError(
        400,
        "Invalid or expired verification token",
        "INVALID_TOKEN"
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });

    res.json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(
        new AppError(
          400,
          "Invalid or expired verification token",
          "INVALID_TOKEN"
        )
      );
    } else {
      next(error);
    }
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json({
        status: "success",
        message:
          "If an account exists with that email, a verification link has been sent.",
      });
    }

    if (user.isEmailVerified) {
      throw new AppError(400, "Email is already verified", "EMAIL_VERIFIED");
    }

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    await sendEmail({
      to: email,
      subject: "Verify your email",
      text: `Please verify your email by clicking this link: ${process.env.CLIENT_URL}/verify-email/${verificationToken}`,
    });

    res.json({
      status: "success",
      message:
        "If an account exists with that email, a verification link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};
