"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { clearSession, getUser } from "@/lib/auth";
import type { AuthUser } from "@tignal/shared";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

// Phase 0'da yalnız Panel ve Ürünler aktif; diğerleri yol haritasında.
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: "🏠" },
  { href: "/products", label: "Ürünler", icon: "📦" },
];

const YAKINDA = ["Stok", "Satış", "Cari", "Fatura", "Bayi", "CRM"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  async function logout() {
    try {
      await api.post("/auth/logout", {});
    } catch {
      /* yoksay */
    }
    clearSession();
    router.replace("/login");
  }

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="min-h-screen md:flex">
      {/* Masaüstü kenar çubuğu */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="px-6 py-5">
          <span className="text-2xl font-bold tracking-tight text-brand-700">
            TİGNAL
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(item.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div className="px-3 pt-4 text-xs font-semibold uppercase text-slate-400">
            Yakında
          </div>
          {YAKINDA.map((m) => (
            <span
              key={m}
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300"
            >
              {m}
            </span>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4 text-sm">
          <div className="font-medium text-slate-700">{user?.fullName}</div>
          <div className="text-xs text-slate-400">{user?.role}</div>
          <button onClick={logout} className="btn-ghost mt-3 w-full">
            Çıkış
          </button>
        </div>
      </aside>

      {/* İçerik */}
      <div className="flex-1 pb-16 md:pb-0">
        {/* Mobil üst bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <span className="text-xl font-bold text-brand-700">TİGNAL</span>
          <button onClick={logout} className="text-sm text-slate-500">
            Çıkış
          </button>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </div>

      {/* Mobil alt navigasyon */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center py-2 text-xs ${
              isActive(item.href) ? "text-brand-700" : "text-slate-500"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
