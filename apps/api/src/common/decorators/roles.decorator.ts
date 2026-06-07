import { SetMetadata } from "@nestjs/common";
import type { Role } from "@tignal/shared";

export const ROLES_KEY = "roles";
/** Bu uca yalnızca belirtilen rollerin erişebileceğini işaretler. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
