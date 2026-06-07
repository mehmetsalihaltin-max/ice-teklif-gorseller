import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { loginSchema, type LoginInput } from "@tignal/shared";
import { AuthService } from "./auth.service";
import { Public } from "../common/decorators/public.decorator";
import {
  CurrentUser,
  type RequestUser,
} from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

const REFRESH_COOKIE = "tignal_refresh";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.auth.login(body);
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });
    return result;
  }

  @Public()
  @Post("refresh")
  async refresh(@Req() req: Request) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException("Yenileme tokenı yok");
    return this.auth.refresh(token);
  }

  @Public()
  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    return { ok: true };
  }

  @ApiBearerAuth()
  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return user;
  }
}
