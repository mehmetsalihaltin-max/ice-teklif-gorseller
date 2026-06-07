"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KDV_ORANLARI, type CreateProductInput } from "@tignal/shared";
import { api, ApiError } from "@/lib/api";

export interface ProductFormValues {
  name: string;
  brand: string;
  barcode: string;
  kdvRate: number;
  defaultCostPrice: number;
  defaultSalePrice: number;
  description: string;
  isActive: boolean;
}

const BOS: ProductFormValues = {
  name: "",
  brand: "",
  barcode: "",
  kdvRate: 20,
  defaultCostPrice: 0,
  defaultSalePrice: 0,
  description: "",
  isActive: true,
};

export function ProductForm({
  productId,
  initial,
}: {
  productId?: string;
  initial?: Partial<ProductFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({
    ...BOS,
    ...initial,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const marj =
    values.defaultSalePrice > 0
      ? (
          ((values.defaultSalePrice - values.defaultCostPrice) /
            values.defaultSalePrice) *
          100
        ).toFixed(1)
      : "0.0";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload: CreateProductInput = {
      name: values.name,
      brand: values.brand || null,
      barcode: values.barcode || null,
      baseUnit: "adet",
      kdvRate: values.kdvRate,
      defaultCostPrice: values.defaultCostPrice,
      defaultSalePrice: values.defaultSalePrice,
      description: values.description || null,
      isActive: values.isActive,
      categoryId: null,
    };
    try {
      if (productId) {
        await api.patch(`/products/${productId}`, payload);
      } else {
        await api.post("/products", payload);
      }
      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-4 p-6">
      <div>
        <label className="label">Ürün Adı *</label>
        <input
          className="input"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Marka</label>
          <input
            className="input"
            value={values.brand}
            onChange={(e) => set("brand", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Barkod</label>
          <input
            className="input"
            value={values.barcode}
            onChange={(e) => set("barcode", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Alış Fiyatı (₺)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={values.defaultCostPrice}
            onChange={(e) => set("defaultCostPrice", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Satış Fiyatı (₺)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={values.defaultSalePrice}
            onChange={(e) => set("defaultSalePrice", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">KDV (%)</label>
          <select
            className="input"
            value={values.kdvRate}
            onChange={(e) => set("kdvRate", Number(e.target.value))}
          >
            {KDV_ORANLARI.map((o) => (
              <option key={o} value={o}>
                %{o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Tahmini brüt marj: <span className="font-semibold">%{marj}</span>
      </p>

      <div>
        <label className="label">Açıklama</label>
        <textarea
          className="input"
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
        />
        Aktif
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.push("/products")}
        >
          İptal
        </button>
      </div>
    </form>
  );
}
