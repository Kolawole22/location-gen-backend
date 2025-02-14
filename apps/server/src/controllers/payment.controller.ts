import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import axios from "axios";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";

const customCodeSchema = z.object({
  customCode: z.string().min(3).max(20),
});

const CUSTOM_CODE_PRICE = 1000; // ₦1000 or $1 equivalent

// Get all payments for a user
export const getPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      status: "success",
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// Initialize payment for custom code
export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customCode } = customCodeSchema.parse(req.body);

    // Check if custom code is available
    const existingCode = await prisma.user.findFirst({
      where: {
        OR: [{ code: customCode }, { customCode }],
      },
    });

    if (existingCode) {
      throw new AppError(400, "Code already taken", "CODE_TAKEN");
    }

    // Initialize payment with Paystack
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user!.email,
        amount: CUSTOM_CODE_PRICE * 100, // Amount in kobo
        metadata: {
          customCode,
          userId: req.user!.id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: req.user!.id,
        amount: CUSTOM_CODE_PRICE,
        status: "pending",
        reference: response.data.data.reference,
        customCode,
      },
    });

    res.json({
      status: "success",
      data: {
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      next(
        new AppError(
          error.response?.status || 500,
          error.response?.data?.message || "Payment initialization failed",
          "PAYMENT_FAILED"
        )
      );
    } else {
      next(error);
    }
  }
};

// Verify payment and update custom code
export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reference = req.params.reference;

    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      throw new AppError(404, "Payment not found", "PAYMENT_NOT_FOUND");
    }

    if (payment.userId !== req.user!.id) {
      throw new AppError(403, "Not authorized", "NOT_AUTHORIZED");
    }

    if (payment.status === "completed") {
      throw new AppError(400, "Payment already verified", "PAYMENT_VERIFIED");
    }

    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.data.status === "success") {
      // Update payment status
      await prisma.payment.update({
        where: { reference },
        data: { status: "completed" },
      });

      // Update user's custom code
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { customCode: payment.customCode },
      });

      res.json({
        status: "success",
        data: {
          message: "Payment verified and custom code updated",
          customCode: payment.customCode,
        },
      });
    } else {
      await prisma.payment.update({
        where: { reference },
        data: { status: "failed" },
      });

      throw new AppError(400, "Payment verification failed", "PAYMENT_FAILED");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      next(
        new AppError(
          error.response?.status || 500,
          error.response?.data?.message || "Payment verification failed",
          "PAYMENT_FAILED"
        )
      );
    } else {
      next(error);
    }
  }
};
