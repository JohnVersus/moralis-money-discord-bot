import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function removeUser(discordId: string) {
  const existingUser = await prisma.userVerification.findUnique({
    where: { discordId },
  });

  if (existingUser) {
    await prisma.userVerification.delete({
      where: { discordId },
    });

    return existingUser;
  }

  return null;
}
