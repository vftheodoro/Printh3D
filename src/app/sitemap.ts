import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://printh3d.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  const staticRoutes = [
    "",
    "/produtos",
    "/materiais",
    "/orcamento",
    "/contato",
    "/privacidade",
    "/termos",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: new Date(),
      changeFrequency:
        route === "" || route === "/produtos"
          ? ("weekly" as const)
          : ("monthly" as const),
      priority: route === "" ? 1 : route === "/produtos" ? 0.9 : 0.7,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/produtos/${encodeURIComponent(product.id)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
