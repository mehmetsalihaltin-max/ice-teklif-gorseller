"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatTL } from "@/lib/format";

interface ProductRow {
  id: string;
  name: string;
  brand: string | null;
  kdvRate: number;
  defaultSalePrice: string;
  isActive: boolean;
  category: { id: string; name: string } | null;
  _count: { variants: number };
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => setRole(getUser()?.role ?? null), []);
  const isAdmin = role === "ADMIN";

  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<ProductRow[]>("/products"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ürünler</h1>
          <p className="text-sm text-slate-500">Ürün kataloğu yönetimi</p>
        </div>
        <Link href="/products/new" className="btn-primary">
          + Yeni Ürün
        </Link>
      </div>

      {isLoading && <p className="text-slate-500">Yükleniyor…</p>}
      {error && <p className="text-red-600">Liste yüklenemedi.</p>}

      {data && (
        <div className="card overflow-hidden">
          {/* Masaüstü tablo */}
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Ürün</th>
                <th className="px-4 py-3">Marka</th>
                <th className="px-4 py-3">KDV</th>
                <th className="px-4 py-3">Satış Fiyatı</th>
                <th className="px-4 py-3">Varyant</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.brand ?? "—"}</td>
                  <td className="px-4 py-3">%{p.kdvRate}</td>
                  <td className="px-4 py-3">{formatTL(p.defaultSalePrice)}</td>
                  <td className="px-4 py-3">{p._count.variants}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={p.isActive} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/products/${p.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      Düzenle
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm(`${p.name} silinsin mi?`)) del.mutate(p.id);
                        }}
                        className="ml-3 text-red-600 hover:underline"
                      >
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobil kart listesi */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {data.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-slate-500">
                    {formatTL(p.defaultSalePrice)} · %{p.kdvRate} KDV
                  </div>
                </div>
                <Link
                  href={`/products/${p.id}`}
                  className="text-sm text-brand-600"
                >
                  Düzenle
                </Link>
              </li>
            ))}
          </ul>

          {data.length === 0 && (
            <p className="p-8 text-center text-slate-400">
              Henüz ürün yok. “Yeni Ürün” ile başlayın.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Aktif" : "Pasif"}
    </span>
  );
}
