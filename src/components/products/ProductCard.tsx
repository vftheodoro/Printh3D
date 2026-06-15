import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Tag } from "lucide-react";
import type { Product } from "@/lib/products";
import {
  cleanProductDescription,
  formatCurrency,
} from "@/lib/format";
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

export default function ProductCard({ product }: { product: Product }) {
  const price = product.promotional_price ?? product.price;
  const hasRange =
    product.variations &&
    product.variations.length > 0 &&
    product.priceMin !== product.priceMax;
  const message = productMessage({
    name: product.name,
    price,
    material: product.material,
  });

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/7 bg-[#08111f] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-sky-400/28 hover:shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
      <Link
        href={`/produtos/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-[#040912]"
        aria-label={`Ver detalhes de ${product.name}`}
      >
        {product.image ? (
          <Image
            src={resolveImageUrl(product.image)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-600">
            <Tag size={36} aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-[0.14em]">
              Imagem em preparação
            </span>
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-lg border border-white/10 bg-slate-950/82 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-sky-200 backdrop-blur-md">
          {product.category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
          <span>{product.material}</span>
          {product.variations?.length ? (
            <span>
              {product.variations.length}{" "}
              {product.variations.length === 1 ? "variação" : "variações"}
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-[-0.025em] text-white">
          <Link
            href={`/produtos/${product.id}`}
            className="transition-colors hover:text-sky-300"
          >
            {product.name}
          </Link>
        </h3>
        <p className="pretty-copy mt-3 line-clamp-3 text-sm font-medium leading-relaxed text-slate-400">
          {cleanProductDescription(product.shortDesc)}
        </p>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/7 pt-6">
          <div className="min-w-0">
            <span className="block text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-600">
              {hasRange ? "Faixa de preço" : "A partir de"}
            </span>
            <strong className="mt-1 block text-xl font-black tracking-tight text-white">
              {hasRange
                ? `${formatCurrency(product.priceMin || 0)} – ${formatCurrency(product.priceMax || 0)}`
                : formatCurrency(price)}
            </strong>
            {product.promotional_price ? (
              <span className="text-xs font-bold text-slate-600 line-through">
                {formatCurrency(product.price)}
              </span>
            ) : null}
          </div>

          <a
            href={getWhatsAppLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-400 text-slate-950 transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-sky-300"
            aria-label={`Pedir ${product.name} pelo WhatsApp`}
          >
            <MessageCircle size={21} aria-hidden="true" />
          </a>
        </div>

        <Link
          href={`/produtos/${product.id}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-black text-sky-300 transition-colors hover:text-sky-200"
        >
          Ver Detalhes
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
