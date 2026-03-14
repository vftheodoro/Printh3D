import { getProductById } from "@/lib/products";
import ProductDetailClient from "./ProductDetailClient";
import { Metadata } from "next";

export const revalidate = 60;

// Dynamic metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) return { title: "Produto Não Encontrado | Printh3D" };
  
  return {
    title: `${product.name} | Printh3D`,
    description: product.shortDesc,
    openGraph: {
      images: [product.image]
    }
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);

  return <ProductDetailClient product={product} />;
}
