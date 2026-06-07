"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { api } from "@/lib/api";

interface ProductDetail {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  kdvRate: number;
  defaultCostPrice: string;
  defaultSalePrice: string;
  description: string | null;
  isActive: boolean;
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.get<ProductDetail>(`/products/${id}`),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Ürün Düzenle</h1>
      {isLoading && <p className="text-slate-500">Yükleniyor…</p>}
      {error && <p className="text-red-600">Ürün yüklenemedi.</p>}
      {data && (
        <ProductForm
          productId={data.id}
          initial={{
            name: data.name,
            brand: data.brand ?? "",
            barcode: data.barcode ?? "",
            kdvRate: data.kdvRate,
            defaultCostPrice: Number(data.defaultCostPrice),
            defaultSalePrice: Number(data.defaultSalePrice),
            description: data.description ?? "",
            isActive: data.isActive,
          }}
        />
      )}
    </div>
  );
}
