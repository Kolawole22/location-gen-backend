import { prisma } from "../lib/prisma";
import * as Nanoid from "nanoid";

// Create a custom nanoid with only uppercase letters and numbers
const nanoid = Nanoid.nanoid;
const generateCode = () =>
  nanoid(8)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "0");

export async function generateUniqueCode(): Promise<string> {
  while (true) {
    const code = generateCode();

    // Check if code exists in any table
    const [existingLocation, existingUser] = await Promise.all([
      prisma.location.findUnique({ where: { code } }),
      prisma.user.findFirst({
        where: { OR: [{ code }, { customCode: code }] },
      }),
    ]);

    if (!existingLocation && !existingUser) {
      return code;
    }
  }
}
