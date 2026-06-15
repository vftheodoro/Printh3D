import Image from "next/image";
import { ArrowUpRight, ShoppingBag } from "lucide-react";

export default function ShopeeBanner() {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="container-custom">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[1.75rem] border border-orange-300/15 bg-[#17100d] p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2">
              <Image
                src="/assets/logos/shopee_logo.png"
                alt=""
                width={42}
                height={42}
              />
            </span>
            <div>
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-orange-300">
                <ShoppingBag size={14} aria-hidden="true" />
                Canal Alternativo
              </span>
              <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                Prefere comprar pela Shopee?
              </h2>
              <p className="mt-1 text-sm font-medium text-orange-100/65">
                Acesse a loja oficial e use os recursos da plataforma.
              </p>
            </div>
          </div>

          <a
            href="https://shopee.com.br/printh3d"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ee4d2d] px-6 py-3 font-black text-white transition-colors hover:bg-[#ff684a] sm:w-auto"
          >
            Visitar Loja
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
