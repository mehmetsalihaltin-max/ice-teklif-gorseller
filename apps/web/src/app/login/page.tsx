"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, type LoginResponse } from "@tignal/shared";
import { api, ApiError } from "@/lib/api";
import { setSession } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("admin@tignal.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Lütfen geçerli e-posta ve şifre girin (min 6 karakter).");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/auth/login", parsed.data);
      setSession(res.accessToken, res.user);
      router.replace(next);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Giriş yapılamadı, tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-brand-700">
            TİGNAL
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Aksesuar İşletme Yönetimi
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Demo: admin@tignal.local
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
