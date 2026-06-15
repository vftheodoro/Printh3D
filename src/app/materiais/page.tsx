import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Materiais para Impressão 3D",
  description:
    "Conheça PLA, PETG, ABS e TPU e entenda qual material combina melhor com a função, acabamento e resistência do seu projeto.",
  alternates: {
    canonical: "/materiais",
  },
};

const materials = [
  {
    name: "PLA",
    summary:
      "Excelente definição visual e ampla variedade de cores para peças decorativas, brindes, miniaturas e protótipos.",
    bestFor: "Estética e precisão",
    properties: ["Ótimo acabamento", "Boa rigidez", "Uso interno"],
    icon: Sparkles,
    accent: "text-sky-300",
  },
  {
    name: "PETG",
    summary:
      "Equilibra resistência mecânica, durabilidade e tolerância à umidade em peças de uso cotidiano.",
    bestFor: "Uso funcional",
    properties: ["Resistente à umidade", "Boa durabilidade", "Leve flexibilidade"],
    icon: Droplets,
    accent: "text-teal-300",
  },
  {
    name: "ABS",
    summary:
      "Indicado para aplicações técnicas que exigem resistência ao impacto e melhor tolerância térmica.",
    bestFor: "Aplicações técnicas",
    properties: ["Resistência térmica", "Boa tenacidade", "Acabamento tratável"],
    icon: ShieldCheck,
    accent: "text-blue-300",
  },
  {
    name: "TPU",
    summary:
      "Material flexível para proteções, amortecimento, encaixes e componentes que precisam deformar sem quebrar.",
    bestFor: "Flexibilidade",
    properties: ["Absorção de impacto", "Alta elasticidade", "Boa aderência"],
    icon: Gauge,
    accent: "text-cyan-300",
  },
];

export default function MaterialsPage() {
  return (
    <main id="conteudo-principal" className="min-h-screen bg-[#030712]">
      <Navbar />

      <section className="px-4 pb-16 pt-32 sm:px-6 sm:pt-40 lg:pb-24">
        <div className="container-custom grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div className="max-w-3xl">
            <span className="eyebrow">Escolha orientada</span>
            <h1 className="balanced-title mt-5 break-words text-5xl font-black tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              O material certo muda o resultado da peça.
            </h1>
            <p className="pretty-copy mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-400">
              Resistência, flexibilidade, acabamento e exposição ao calor são
              avaliados antes da produção. Você não precisa decidir sozinho:
              indicamos a opção mais adequada para o uso real do projeto.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/orcamento"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-sky-400 px-7 py-4 font-black text-slate-950 transition-colors hover:bg-sky-300"
              >
                Planejar Meu Projeto
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <Link
                href="/produtos"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-7 py-4 font-black text-white transition-colors hover:bg-white/[0.07]"
              >
                Ver Produtos
              </Link>
            </div>
          </div>

          <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#08111f] sm:min-h-[32rem]">
            <Image
              src="/assets/imagens/materials_hero.png"
              alt="Amostras de materiais utilizados em impressão 3D"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 44vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-[#050a13]/85 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Layers3 className="text-sky-300" aria-hidden="true" />
                <div>
                  <p className="font-black text-white">Seleção técnica</p>
                  <p className="mt-1 text-sm font-medium text-slate-400">
                    Função, ambiente e acabamento considerados em conjunto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-auto px-4 py-16 sm:px-6 sm:py-24">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="eyebrow">Materiais mais usados</span>
            <h2 className="balanced-title mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
              Cada opção resolve um tipo de necessidade.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {materials.map((material) => {
              const Icon = material.icon;
              return (
                <article
                  key={material.name}
                  className="rounded-[1.75rem] border border-white/8 bg-[#08111f] p-6 sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        {material.bestFor}
                      </p>
                      <h3 className="mt-2 text-3xl font-black text-white">
                        {material.name}
                      </h3>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.035]">
                      <Icon
                        className={material.accent}
                        size={23}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <p className="mt-5 font-medium leading-7 text-slate-400">
                    {material.summary}
                  </p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                    {material.properties.map((property) => (
                      <li
                        key={property}
                        className="flex items-center gap-2 text-sm font-bold text-slate-300"
                      >
                        <CheckCircle2
                          size={16}
                          className="shrink-0 text-teal-300"
                          aria-hidden="true"
                        />
                        {property}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="container-custom rounded-[2rem] border border-sky-400/18 bg-[#09182a] px-6 py-11 sm:px-10">
          <div className="grid items-center gap-7 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">
                Não sabe qual material escolher?
              </h2>
              <p className="mt-3 max-w-2xl font-medium leading-7 text-slate-300">
                Descreva o uso da peça, as medidas e o ambiente. A estimativa
                inicial já organiza as informações necessárias para orientar a
                produção.
              </p>
            </div>
            <Link
              href="/orcamento"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-sky-400 px-7 py-4 font-black text-slate-950 transition-colors hover:bg-sky-300"
            >
              Criar Estimativa
              <ArrowRight size={20} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
