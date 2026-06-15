import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FAQ from "@/components/home/FAQ";
import ShopeeBanner from "@/components/common/ShopeeBanner";
import Footer from "@/components/layout/Footer";
import { getWhatsAppLink, contactMessage } from "@/lib/whatsapp";

export default function Home() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Printh3D",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://printh3d.com.br",
    image: "/assets/imagens/finished_showcase.png",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Jacupiranga",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    areaServed: "Brasil",
    description:
      "Impressão 3D personalizada, peças funcionais, protótipos e projetos sob medida.",
  };

  return (
    <main
      id="conteudo-principal"
      className="flex min-h-screen flex-col bg-[#030712]"
    >
      <Navbar />
      <Hero />

      <section
        className="border-y border-white/6 bg-[#07101d]"
        aria-label="Diferenciais"
      >
        <div className="container-custom grid divide-y divide-white/6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 px-2 py-5 sm:justify-center">
            <ShieldCheck size={20} className="text-sky-400" aria-hidden="true" />
            <span className="text-sm font-bold text-slate-300">
              Orientação antes de produzir
            </span>
          </div>
          <div className="flex items-center gap-3 px-2 py-5 sm:justify-center">
            <Truck size={20} className="text-teal-300" aria-hidden="true" />
            <span className="text-sm font-bold text-slate-300">
              Envio para todo o Brasil
            </span>
          </div>
          <div className="flex items-center gap-3 px-2 py-5 sm:justify-center">
            <MessageCircle
              size={20}
              className="text-sky-400"
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-slate-300">
              Atendimento direto
            </span>
          </div>
        </div>
      </section>

      <FeaturedProducts />
      <Features />
      <FAQ />

      <section className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="container-custom overflow-hidden rounded-[2rem] border border-sky-400/18 bg-[#09182a] px-6 py-12 text-center shadow-[0_30px_100px_rgba(0,0,0,0.32)] sm:px-12 sm:py-16">
          <span className="eyebrow">Seu Projeto Começa Aqui</span>
          <h2 className="balanced-title mx-auto mt-5 max-w-4xl text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
            Receba uma estimativa inicial e converse com quem vai produzir.
          </h2>
          <p className="pretty-copy mx-auto mt-5 max-w-2xl text-lg font-medium text-slate-300">
            Informe medidas e preferências para criar um resumo técnico pronto
            para enviar à equipe.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/orcamento"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-sky-400 px-7 py-4 font-black text-slate-950 transition-colors hover:bg-sky-300"
            >
              Calcular Orçamento
              <ArrowRight size={20} aria-hidden="true" />
            </Link>
            <a
              href={getWhatsAppLink(contactMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-7 py-4 font-black text-white transition-colors hover:bg-white/[0.07]"
            >
              Falar no WhatsApp
              <MessageCircle size={20} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <div className="content-auto">
        <ShopeeBanner />
      </div>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </main>
  );
}
