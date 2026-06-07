/**
 * Paylaşılan zod şemaları ve türetilen DTO tipleri.
 * Hem API (doğrulama) hem web (form) tarafından kullanılır.
 */
import { z } from "zod";
import { KDV_ORANLARI } from "./enums.js";

const kdvOraniSchema = z
  .number()
  .refine((v) => (KDV_ORANLARI as readonly number[]).includes(v), {
    message: "Geçersiz KDV oranı",
  });

/* ----------------------------- Auth ----------------------------- */

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  dealerId: string | null;
  companyId: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/* --------------------------- Ürünler ---------------------------- */

export const createProductSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalı"),
  brand: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  baseUnit: z.string().default("adet"),
  kdvRate: kdvOraniSchema.default(20),
  defaultCostPrice: z.coerce.number().min(0).default(0),
  defaultSalePrice: z.coerce.number().min(0).default(0),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
