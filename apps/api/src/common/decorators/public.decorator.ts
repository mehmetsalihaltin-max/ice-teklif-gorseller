import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
/** Bu uç kimlik doğrulaması gerektirmez. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
