import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@tignal/db";
import type { LoginInput, LoginResponse } from "@tignal/shared";
import { PRISMA } from "../prisma/prisma.module";
import type { JwtPayload } from "./jwt.strategy";

@Injectable()
export class AuthService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(input: LoginInput): Promise<LoginResponse & { refreshToken: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: input.email, isActive: true },
    });
    if (!user) throw new UnauthorizedException("E-posta veya şifre hatalı");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("E-posta veya şifre hatalı");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      dealerId: user.dealerId,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: (this.config.get<string>("JWT_ACCESS_TTL") ?? "15m") as any,
    });
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id },
      {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: (this.config.get<string>("JWT_REFRESH_TTL") ?? "7d") as any,
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        dealerId: user.dealerId,
        companyId: user.companyId,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = await this.jwt.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });
      if (!user || !user.isActive) throw new Error("user yok");

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        dealerId: user.dealerId,
      };
      const accessToken = await this.jwt.signAsync(payload, {
        secret: this.config.get<string>("JWT_ACCESS_SECRET"),
        expiresIn: (this.config.get<string>("JWT_ACCESS_TTL") ?? "15m") as any,
      });
      return { accessToken };
    } catch {
      throw new UnauthorizedException("Oturum süresi doldu, tekrar giriş yapın");
    }
  }
}
