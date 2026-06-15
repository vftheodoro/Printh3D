import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  MessageCircle,
  PackageCheck,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-36 lg:min-h-[780px] lg:pb-24 lg:pt-40">
      <div className="absolute inset-0 -z-20 bg-[#030712]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[38rem] w-[64rem] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[140px]" />

      <div className="container-custom grid items-center gap-14 lg:grid-cols-[1.03fr_.97fr] lg:gap-20">
        <div>
          <div className="eyebrow mb-6 rounded-full border border-sky-400/20 bg-sky-400/8 px-4 py-2">
            <BadgeCheck size={15} aria-hidden="true" />
            Impressão 3D sob medida
          </div>

          <h1 className="balanced-title max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-[5.3rem]">
            Da sua ideia para uma peça{" "}
            <span className="text-gradient">pronta para usar.</span>
          </h1>

          <p className="pretty-copy mt-7 max-w-2xl text-lg font-medium leading-relaxed text-slate-300 sm:text-xl">
            Projetos personalizados, peças funcionais e decoração produzidos
            com precisão, orientação técnica e acabamento profissional.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/orcamento"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-sky-500 px-7 py-4 font-black text-slate-950 shadow-[0_18px_50px_rgba(39,168,255,0.25)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-sky-300"
            >
              <MessageCircle size={21} aria-hidden="true" />
              Calcular Orçamento
            </Link>
            <Link
              href="/produtos"
              className="glass inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl px-7 py-4 font-black text-white transition-[border-color,background-color] hover:border-sky-400/35 hover:bg-sky-400/8"
            >
              Ver Catálogo
              <ArrowRight size={20} aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-10 grid gap-3 text-sm font-bold text-slate-300 sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <MapPin size={17} className="text-sky-400" aria-hidden="true" />
              Atendimento em Jacupiranga, SP
            </li>
            <li className="flex items-center gap-2">
              <PackageCheck
                size={17}
                className="text-teal-300"
                aria-hidden="true"
              />
              Envio para todo o Brasil
            </li>
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[38rem]">
          <div className="absolute -inset-4 rounded-[2.5rem] bg-sky-500/12 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-[0_30px_100px_rgba(0,0,0,0.52)] sm:rounded-[2.5rem]">
            <Image
              src="/assets/imagens/printing_detail.png"
              alt="Impressora 3D produzindo uma peça azul detalhada"
              width={640}
              height={640}
              priority
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="aspect-square w-full object-cover"
            />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-slate-950/88 p-4 backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="block text-xs font-black uppercase tracking-[0.14em] text-sky-300">
                    Produção monitorada
                  </span>
                  <strong className="mt-1 block text-lg text-white">
                    Precisão em cada camada
                  </strong>
                </div>
                <span className="rounded-xl bg-teal-300/12 px-3 py-2 text-xs font-black text-teal-200">
                  FDM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
