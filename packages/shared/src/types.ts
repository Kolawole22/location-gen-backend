import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  code: z.string(),
  customCode: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  code: z.string(),
  isTracking: z.boolean(),
  isPublic: z.boolean(),
  isCurrentLocation: z.boolean(),
  isExcludedFromSharing: z.boolean(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SharedLocationSchema = z.object({
  id: z.string(),
  locationId: z.string(),
  sharedById: z.string(),
  sharedWithId: z.string(),
  createdAt: z.string(),
});

export const PaymentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  status: z.enum(["pending", "completed", "failed"]),
  reference: z.string(),
  customCode: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type SharedLocation = z.infer<typeof SharedLocationSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
