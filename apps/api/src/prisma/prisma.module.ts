import { Global, Module } from "@nestjs/common";
import { prisma } from "@tignal/db";

/** Prisma istemcisini DI üzerinden sağlayan token. */
export const PRISMA = "PRISMA";

@Global()
@Module({
  providers: [{ provide: PRISMA, useValue: prisma }],
  exports: [PRISMA],
})
export class PrismaModule {}
