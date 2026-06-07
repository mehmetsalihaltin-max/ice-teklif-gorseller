import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
  Role,
} from "@tignal/shared";
import { ProductsService } from "./products.service";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  type RequestUser,
} from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

@ApiTags("products")
@ApiBearerAuth()
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.products.list(user.companyId);
  }

  @Get(":id")
  get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.products.get(user.companyId, id);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductInput,
  ) {
    return this.products.create(user.companyId, dto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(":id")
  update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductInput,
  ) {
    return this.products.update(user.companyId, id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(":id")
  remove(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.products.remove(user.companyId, id);
  }
}
