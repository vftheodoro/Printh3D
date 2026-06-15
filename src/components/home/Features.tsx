import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  FileCheck2,
  MessageSquareText,
  PackageCheck,
  Palette,
  Ruler,
} from "lucide-react";

const STEPS = [
  {
    icon: MessageSquareText,
    number: "01",
    title: "Conte o que precisa",
    text: "Envie a ideia, medidas, referência ou objetivo da peça. Ajudamos a definir o caminho técnico.",
  },
  {
    icon: FileCheck2,
    number: "02",
    title: "Validamos o projeto",
    text: "Analisamos material, resistência, acabamento, prazo e viabilidade antes da produção.",
  },
  {
    icon: PackageCheck,
    number: "03",
    title: "Produzimos e enviamos",
    text: "A peça é impressa, revisada e preparada para retirada ou envio com acompanhamento próximo.",
  },
];

const CAPABILITIES = [
  { icon: Ruler, text: "Peças sob medida" },
  { icon: Boxes, text: "Protótipos e reposição" },
  { icon: Palette, text: "Cores e acabamentos" },
];

export default function Features() {
  return (
    <>
      <section className="section-space border-y border-white/6 bg-white/[0.018]">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Como Funciona</span>
            <h2 className="balanced-title mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Um processo simples, com decisões técnicas bem explicadas.
            </h2>
          </div>

          <ol className="mt-14 grid gap-5 lg:grid-cols-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.number}
                  className="hover-lift rounded-[1.75rem] border border-white/7 bg-[#08111f] p-7 sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-black tracking-[0.16em] text-slate-600">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-7 text-2xl font-black tracking-tight text-white">
                    {step.title}
                  </h3>
                  <p className="pretty-copy mt-3 font-medium leading-relaxed text-slate-400">
                    {step.text}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="section-space content-auto">
        <div className="container-custom grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-slate-900">
            <Image
              src="/assets/imagens/finished_showcase.png"
              alt="Coleção de peças funcionais e decorativas impressas em 3D"
              width={640}
              height={640}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-square w-full object-cover"
            />
          </div>

          <div>
            <span className="eyebrow">Soluções Versáteis</span>
            <h2 className="balanced-title mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Impressão útil, bonita e pensada para o seu uso.
            </h2>
            <p className="pretty-copy mt-6 text-lg font-medium leading-relaxed text-slate-400">
              Produzimos desde itens personalizados e decoração até suportes,
              peças de reposição e protótipos. Cada escolha considera função,
              acabamento e custo.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {CAPABILITIES.map((capability) => {
                const Icon = capability.icon;
                return (
                  <li
                    key={capability.text}
                    className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.025] px-4 py-3 font-bold text-slate-200"
                  >
                    <Icon size={19} className="text-sky-400" aria-hidden="true" />
                    {capability.text}
                  </li>
                );
              })}
            </ul>

            <Link
              href="/materiais"
              className="mt-9 inline-flex min-h-12 items-center gap-3 rounded-xl border border-sky-400/25 bg-sky-400/8 px-6 py-3 font-black text-sky-200 transition-colors hover:bg-sky-400/14"
            >
              Conhecer Materiais
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
