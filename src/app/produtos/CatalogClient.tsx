"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  PackageOpen,
  Search,
  X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import ShopeeBanner from "@/components/common/ShopeeBanner";
import type { Product } from "@/lib/products";

const PAGE_SIZE = 9;

export default function CatalogClient({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[];
  initialCategories: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("busca") || "");
  const deferredQuery = useDeferredValue(query);
  const category = searchParams.get("categoria") || "all";
  const page = Math.max(1, Number(searchParams.get("pagina")) || 1);

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("pt-BR");
    return initialProducts.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        product.shortDesc
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedQuery);
      const matchesCategory =
        category === "all" || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, deferredQuery, initialProducts]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleProducts = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const cleanQuery = query.trim();
    if (cleanQuery) params.set("busca", cleanQuery);
    else params.delete("busca");
    params.delete("pagina");

    const timeout = window.setTimeout(() => {
      const nextQuery = params.toString();
      if (nextQuery !== searchParams.toString()) {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
          scroll: false,
        });
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [pathname, query, router, searchParams]);

  function setFilter(name: "categoria" | "pagina", value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all" || value === "1") params.delete(name);
    else params.set(name, value);
    if (name !== "pagina") params.delete("pagina");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearFilters() {
    setQuery("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <main id="conteudo-principal" className="min-h-screen bg-[#030712]">
      <Navbar />

      <section className="px-4 pb-16 pt-32 sm:px-6 sm:pt-40">
        <div className="container-custom">
          <div className="grid items-end gap-9 lg:grid-cols-[1fr_30rem]">
            <div className="max-w-3xl">
              <span className="eyebrow">Catálogo Printh3D</span>
              <h1 className="balanced-title mt-5 text-5xl font-black tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
                Escolha um modelo ou comece uma personalização.
              </h1>
              <p className="pretty-copy mt-6 max-w-2xl text-lg font-medium text-slate-400">
                Produtos prontos, variações e ideias que podem ser adaptadas em
                cor, tamanho e acabamento.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-white/8 bg-[#08111f] p-4 sm:p-5">
              <label
                htmlFor="catalog-search"
                className="mb-2 block text-sm font-black text-slate-200"
              >
                Pesquisar no catálogo
              </label>
              <div className="flex min-h-12 items-center rounded-xl border border-white/8 bg-[#040912] focus-within:border-sky-400/45">
                <Search
                  size={19}
                  className="ml-4 shrink-0 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="catalog-search"
                  name="busca"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ex.: chaveiro, suporte, decoração…"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 font-bold text-white placeholder:text-slate-600"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
                    aria-label="Limpar pesquisa"
                  >
                    <X size={17} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/7 pt-7">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <Filter size={15} aria-hidden="true" />
              Filtrar por categoria
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <FilterButton
                active={category === "all"}
                onClick={() => setFilter("categoria")}
              >
                Todos
              </FilterButton>
              {initialCategories.map((item) => (
                <FilterButton
                  key={item}
                  active={category === item}
                  onClick={() => setFilter("categoria", item)}
                >
                  {item}
                </FilterButton>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="container-custom">
          <div className="mb-7 flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-slate-500" aria-live="polite">
              {filtered.length}{" "}
              {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
            {category !== "all" || query ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-black text-sky-300 hover:text-sky-200"
              >
                Limpar Filtros
              </button>
            ) : null}
          </div>

          {visibleProducts.length ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {pageCount > 1 ? (
                <nav
                  className="mt-12 flex items-center justify-center gap-3"
                  aria-label="Paginação do catálogo"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setFilter("pagina", String(Math.max(1, safePage - 1)))
                    }
                    disabled={safePage === 1}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/8 bg-white/[0.025] text-white disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={19} aria-hidden="true" />
                  </button>
                  <span className="px-3 text-sm font-black text-slate-300">
                    Página {safePage} de {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFilter(
                        "pagina",
                        String(Math.min(pageCount, safePage + 1)),
                      )
                    }
                    disabled={safePage === pageCount}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/8 bg-white/[0.025] text-white disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Próxima página"
                  >
                    <ChevronRight size={19} aria-hidden="true" />
                  </button>
                </nav>
              ) : null}
            </>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.018] px-6 py-20 text-center">
              <PackageOpen
                size={44}
                className="mx-auto text-slate-600"
                aria-hidden="true"
              />
              <h2 className="mt-5 text-2xl font-black text-white">
                Nenhum produto encontrado
              </h2>
              <p className="mx-auto mt-3 max-w-md font-medium text-slate-400">
                Tente outro termo ou remova a categoria selecionada.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-xl bg-sky-400 px-5 py-3 font-black text-slate-950"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="content-auto">
        <ShopeeBanner />
      </div>
      <Footer />
    </main>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "shrink-0 rounded-xl border border-sky-300 bg-sky-400 px-5 py-2.5 text-sm font-black text-slate-950"
          : "shrink-0 rounded-xl border border-white/8 bg-white/[0.025] px-5 py-2.5 text-sm font-black text-slate-300 hover:border-white/16 hover:text-white"
      }
    >
      {children}
    </button>
  );
}
