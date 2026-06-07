"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";

interface ProductRow {
  id: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<ProductRow[]>("/products"),
  });

  const toplamUrun = products?.length ?? 0;
  const aktifUrun = products?.filter((p) => p.isActive).length ?? 0;

  const kartlar = [
    { baslik: "Toplam Ürün", deger: toplamUrun, renk: "text-brand-700" },
    { baslik: "Aktif Ürün", deger: aktifUrun, renk: "text-emerald-600" },
    { baslik: "Günlük Satış", deger: "—", renk: "text-slate-400" },
    { baslik: "Kasa Bakiyesi", deger: "—", renk: "text-slate-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel</h1>
        <p className="text-sm text-slate-500">
          TİGNAL işletme yönetim sistemine hoş geldiniz.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kartlar.map((k) => (
          <div key={k.baslik} className="card p-4">
            <div className="text-sm text-slate-500">{k.baslik}</div>
            <div className={`mt-1 text-2xl font-bold ${k.renk}`}>{k.deger}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold">Hızlı Erişim</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/products" className="btn-ghost">
            📦 Ürünleri Yönet
          </Link>
          <Link href="/products/new" className="btn-primary">
            + Yeni Ürün
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Stok, satış, cari, fatura, bayi ve CRM modülleri yol haritasında
          (Phase 1–2). Bu sürüm temel kimlik doğrulama ve ürün yönetimini içerir.
        </p>
      </div>
    </div>
  );
}
