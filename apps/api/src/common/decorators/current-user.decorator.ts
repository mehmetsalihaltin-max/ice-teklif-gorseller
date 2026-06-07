import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
  id: string;
  email: string;
  role: string;
  companyId: string;
  dealerId: string | null;
}

/** İstek üzerindeki kimliği doğrulanmış kullanıcıyı verir. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser;
  },
);
