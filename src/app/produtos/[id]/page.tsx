import { getProductById } from "@/lib/products";
import ProductDetailClient from "./ProductDetailClient";
import { Metadata } from "next";

export const revalidate = 60;

// Dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Produto Não Encontrado | Printh3D" };
  
  return {
    title: `${product.name} | Printh3D`,
    description: product.shortDesc,
    openGraph: {
      images: [product.image]
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  return <ProductDetailClient product={product} />;
}
