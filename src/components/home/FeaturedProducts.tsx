import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getAllProducts } from "@/lib/products";
import ProductCard from "@/components/products/ProductCard";

export default async function FeaturedProducts() {
  const allProducts = await getAllProducts();
  const featured = allProducts.slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="section-space">
      <div className="container-custom">
        <div className="mb-10 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow">
              <Sparkles size={15} aria-hidden="true" />
              Catálogo Printh3D
            </span>
            <h2 className="balanced-title mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Ideias que já podem sair da tela.
            </h2>
            <p className="pretty-copy mt-5 text-lg font-medium text-slate-400">
              Conheça peças prontas e use o catálogo como ponto de partida para
              personalizações.
            </p>
          </div>

          <Link
            href="/produtos"
            className="inline-flex min-h-12 w-fit items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-5 py-3 font-black text-white transition-colors hover:border-sky-400/30 hover:text-sky-300"
          >
            Ver Todos os Produtos
            <ArrowRight size={19} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
