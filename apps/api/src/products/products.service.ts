import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PrismaClient } from "@tignal/db";
import type { CreateProductInput, UpdateProductInput } from "@tignal/shared";
import { PRISMA } from "../prisma/prisma.module";

@Injectable()
export class ProductsService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  list(companyId: string) {
    return this.prisma.product.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { variants: true } },
      },
    });
  }

  async get(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { category: true, variants: true },
    });
    if (!product) throw new NotFoundException("Ürün bulunamadı");
    return product;
  }

  async create(companyId: string, dto: CreateProductInput) {
    return this.prisma.product.create({
      data: {
        companyId,
        name: dto.name,
        brand: dto.brand ?? null,
        categoryId: dto.categoryId || null,
        barcode: dto.barcode ?? null,
        baseUnit: dto.baseUnit ?? "adet",
        kdvRate: dto.kdvRate ?? 20,
        defaultCostPrice: dto.defaultCostPrice ?? 0,
        defaultSalePrice: dto.defaultSalePrice ?? 0,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
        // Her ürün en az bir varsayılan varyantla başlar (stok varyant bazlı).
        variants: {
          create: {
            name: "Standart",
            sku: `${Date.now().toString(36).toUpperCase()}-STD`,
            isDefault: true,
            costPrice: dto.defaultCostPrice ?? 0,
            salePrice: dto.defaultSalePrice ?? 0,
          },
        },
      },
      include: { variants: true },
    });
  }

  async update(companyId: string, id: string, dto: UpdateProductInput) {
    await this.get(companyId, id);
    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        brand: dto.brand,
        categoryId: dto.categoryId === undefined ? undefined : dto.categoryId || null,
        barcode: dto.barcode,
        baseUnit: dto.baseUnit,
        kdvRate: dto.kdvRate,
        defaultCostPrice: dto.defaultCostPrice,
        defaultSalePrice: dto.defaultSalePrice,
        description: dto.description,
        isActive: dto.isActive,
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.get(companyId, id);
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { ok: true };
  }
}
