import type { NextConfig } from "next";
import path from "node:path";

// Monorepo: semua env key disimpan di file .env root, bukan di packages/client.
// Next.js hanya membaca .env dari direktori project-nya sendiri, jadi kita
// load manual .env dari root (root = 2 level di atas packages/client).
// Var yang sudah ada di process.env TIDAK akan tertimpa (semantik dotenv).
try {
  process.loadEnvFile(path.resolve(process.cwd(), "../../.env"));
} catch {
  // .env belum ada di root — biarkan .env.local di packages/client sebagai fallback
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
