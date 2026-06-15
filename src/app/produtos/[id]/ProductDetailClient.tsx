"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Info,
  MessageCircle,
  Palette,
  Ruler,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Product } from "@/lib/products";
import { cleanProductDescription, formatCurrency } from "@/lib/format";
import { getWhatsAppLink, productMessage } from "@/lib/whatsapp";

function resolveImageUrl(image: string) {
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/")
  ) {
    return image;
  }
  return `/assets/imagens/${image}`;
}

export default function ProductDetailClient({
  product,
}: {
  product: Product | undefined;
}) {
  const [color, setColor] = useState(product?.colors?.[0] || "");
  const [finish, setFinish] = useState(product?.finishes?.[0] || "");
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(
    null,
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const selectedVariation = product?.variations?.find(
    (variation) => variation.id === selectedVariationId,
  );
  const currentProduct = selectedVariation || product;
  const currentPrice =
    currentProduct?.promotional_price ?? currentProduct?.price ?? 0;
  const originalPrice = currentProduct?.price ?? 0;

  const images = useMemo(() => {
    if (!product) return [];
    const result: { id: string; url: string; name: string }[] = [];
    if (product.image) {
      result.push({
        id: "main",
        url: resolveImageUrl(product.image),
        name: product.name,
      });
    }
    product.variations?.forEach((variation) => {
      if (variation.image) {
        const url = resolveImageUrl(variation.image);
        if (!result.some((image) => image.url === url)) {
          result.push({ id: variation.id, url, name: variation.name });
        }
      }
    });
    return result.length
      ? result
      : [
          {
            id: "fallback",
            url: "/assets/imagens/design_screen.png",
            name: "Processo de modelagem 3D",
          },
        ];
  }, [product]);

  if (!product) {
    return (
      <main id="conteudo-principal" className="min-h-screen bg-[#030712]">
        <Navbar />
        <section className="container-custom flex min-h-[70vh] flex-col items-center justify-center pt-28 text-center">
          <h1 className="text-4xl font-black text-white">
            Produto não encontrado
          </h1>
          <p className="mt-3 font-medium text-slate-400">
            O item pode ter sido removido ou estar temporariamente indisponível.
          </p>
          <Link
            href="/produtos"
            className="mt-7 rounded-xl bg-sky-400 px-6 py-3 font-black text-slate-950"
          >
            Voltar ao Catálogo
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  const buyMessage = productMessage({
    name: selectedVariation?.name || product.name,
    price: currentPrice,
    material: selectedVariation?.material || product.material,
    color,
    finish,
  });

  return (
    <main id="conteudo-principal" className="min-h-screen bg-[#030712]">
      <Navbar />
      <section className="px-4 pb-20 pt-28 sm:px-6 sm:pt-36">
        <div className="container-custom">
          <nav
            className="mb-7 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white">
              Início
            </Link>
            <ChevronRight size={15} aria-hidden="true" />
            <Link href="/produtos" className="hover:text-white">
              Produtos
            </Link>
            <ChevronRight size={15} aria-hidden="true" />
            <span className="max-w-[16rem] truncate text-slate-300">
              {product.name}
            </span>
          </nav>

          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/8 bg-[#08111f]">
                <Image
                  src={images[activeImageIndex].url}
                  alt={images[activeImageIndex].name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {images.length > 1 ? (
                <div
                  className="mt-4 flex gap-3 overflow-x-auto pb-2"
                  aria-label="Galeria do produto"
                >
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`Ver imagem ${index + 1}`}
                      aria-pressed={activeImageIndex === index}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                        activeImageIndex === index
                          ? "border-sky-400"
                          : "border-white/8"
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-sky-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-sky-300">
                  {product.category}
                </span>
                <span className="flex items-center gap-2 text-sm font-bold text-slate-400">
                  <Info size={16} aria-hidden="true" />
                  {currentProduct?.material}
                </span>
              </div>

              <h1 className="balanced-title mt-5 break-words text-4xl font-black leading-[1.03] tracking-[-0.045em] text-white sm:text-5xl">
                {selectedVariation?.name || product.name}
              </h1>

              <div className="mt-6">
                <strong className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {formatCurrency(currentPrice)}
                </strong>
                {currentProduct?.promotional_price ? (
                  <span className="ml-3 text-sm font-bold text-slate-600 line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                ) : null}
              </div>

              <p className="pretty-copy mt-7 whitespace-pre-line text-lg font-medium leading-relaxed text-slate-400">
                {cleanProductDescription(product.fullDesc)}
              </p>

              {product.variations?.length ? (
                <fieldset className="mt-8">
                  <legend className="mb-3 text-sm font-black text-slate-200">
                    Escolha uma Variação
                  </legend>
                  <div className="grid gap-2">
                    {product.variations.map((variation) => {
                      const active = selectedVariationId === variation.id;
                      return (
                        <button
                          key={variation.id}
                          type="button"
                          onClick={() => setSelectedVariationId(variation.id)}
                          aria-pressed={active}
                          className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-4 text-left ${
                            active
                              ? "border-sky-400 bg-sky-400/8"
                              : "border-white/8 bg-white/[0.02] hover:border-white/15"
                          }`}
                        >
                          <span className="min-w-0">
                            <strong className="block truncate text-white">
                              {variation.name}
                            </strong>
                            <small className="font-bold text-slate-500">
                              {variation.material}
                            </small>
                          </span>
                          <strong className="shrink-0 text-white">
                            {formatCurrency(
                              variation.promotional_price ?? variation.price,
                            )}
                          </strong>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="product-color"
                    className="mb-2 flex items-center gap-2 text-sm font-black text-slate-200"
                  >
                    <Palette size={17} className="text-sky-400" aria-hidden="true" />
                    Cor
                  </label>
                  <select
                    id="product-color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-white/8 bg-[#08111f] px-4 text-white"
                  >
                    {product.colors.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="product-finish"
                    className="mb-2 flex items-center gap-2 text-sm font-black text-slate-200"
                  >
                    <Sparkles
                      size={17}
                      className="text-teal-300"
                      aria-hidden="true"
                    />
                    Acabamento
                  </label>
                  <select
                    id="product-finish"
                    value={finish}
                    onChange={(event) => setFinish(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-white/8 bg-[#08111f] px-4 text-white"
                  >
                    {product.finishes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={getWhatsAppLink(buyMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-sky-400 px-6 py-4 font-black text-slate-950 transition-colors hover:bg-sky-300"
                >
                  <MessageCircle size={21} aria-hidden="true" />
                  Pedir pelo WhatsApp
                </a>
                <Link
                  href="/orcamento"
                  className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-white/9 bg-white/[0.03] px-6 py-4 font-black text-white hover:border-sky-400/25"
                >
                  <Ruler size={20} aria-hidden="true" />
                  Personalizar
                </Link>
              </div>

              <a
                href="https://shopee.com.br/printh3d"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center gap-4 rounded-2xl border border-orange-300/12 bg-orange-400/[0.04] p-4 text-sm font-bold text-slate-300 hover:border-orange-300/25"
              >
                <ShoppingBag
                  size={20}
                  className="text-orange-300"
                  aria-hidden="true"
                />
                Ver disponibilidade deste produto na Shopee
              </a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
