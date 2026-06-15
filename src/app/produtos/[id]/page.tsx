import type { Metadata } from "next";
import { getProductById } from "@/lib/products";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Produto Não Encontrado" };

  return {
    title: product.name,
    description: product.shortDesc,
    openGraph: {
      title: product.name,
      description: product.shortDesc,
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.shortDesc,
        image: product.image,
        material: product.material,
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          price: product.promotional_price ?? product.price,
          availability: "https://schema.org/InStock",
        },
      }
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <ProductDetailClient product={product} />
    </>
  );
}
