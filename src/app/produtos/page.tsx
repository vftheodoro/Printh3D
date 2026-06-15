import { Suspense } from "react";
import { getAllProducts, getCategories, Product } from "@/lib/products";
import CatalogClient from "./CatalogClient";

// Revalidates every 1 minute if cache is used by Next.js
export const revalidate = 60;

export default async function Catalog() {
  // Fetch data on the server side
  const products: Product[] = await getAllProducts();
  const categories: string[] = await getCategories();

  return (
    <Suspense fallback={<CatalogLoading />}>
      <CatalogClient
        initialProducts={products}
        initialCategories={categories}
      />
    </Suspense>
  );
}

function CatalogLoading() {
  return (
    <main
      id="conteudo-principal"
      className="flex min-h-screen items-center justify-center bg-[#030712]"
      aria-busy="true"
    >
      <p className="font-bold text-slate-400">Carregando catálogo...</p>
    </main>
  );
}
