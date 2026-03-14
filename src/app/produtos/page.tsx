import { getAllProducts, getCategories, Product } from "@/lib/products";
import CatalogClient from "./CatalogClient";

// Revalidates every 1 minute if cache is used by Next.js
export const revalidate = 60;

export default async function Catalog() {
  // Fetch data on the server side
  const products: Product[] = await getAllProducts();
  const categories: string[] = await getCategories();

  return (
    <CatalogClient initialProducts={products} initialCategories={categories} />
  );
}
