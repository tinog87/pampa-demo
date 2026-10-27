import type { NextConfig } from "next";

// Export 100% estático: `next build` deja la carpeta `out/` lista para
// cualquier hosting (Vercel, GitHub Pages, Netlify) o para abrir local.
// basePath se activa solo en el deploy a GitHub Pages (vía la Action),
// así el desarrollo local y Vercel siguen en la raíz.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
