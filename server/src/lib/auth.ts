import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({
  connectionString,
});


const prisma = new PrismaClient({
  adapter,
});

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "PLAYER",
      },
    },
  },

   emailAndPassword: { 
    enabled: true, 
  }, 

  trustedOrigins: [
    "http://localhost:4380",
  ],

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: "http://localhost:4380",
});