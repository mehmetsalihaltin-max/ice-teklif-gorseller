import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tignal/shared"],
  // Container (Cloud Run) için bağımsız çalışan minimal sunucu çıktısı.
  output: "standalone",
  // pnpm monorepo'da workspace bağımlılıklarını doğru izlemek için kök dizin.
  outputFileTracingRoot: join(__dirname, "../../"),
  // Tek-origin önizleme/tünel için: API_PROXY_TARGET verilirse /api istekleri
  // yerel API'ye proxy'lenir (CORS gerekmez). Üretimde bu env ayarlanmaz.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
