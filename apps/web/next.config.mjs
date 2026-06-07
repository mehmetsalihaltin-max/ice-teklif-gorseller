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
};

export default nextConfig;
