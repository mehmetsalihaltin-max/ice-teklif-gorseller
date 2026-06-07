import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

/**
 * Tüm uygulama genelinde paylaşılan tekil Prisma istemcisi.
 * Geliştirme sırasında hot-reload'da birden çok bağlantı açılmasını önler.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
