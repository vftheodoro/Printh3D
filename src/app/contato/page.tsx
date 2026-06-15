import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  PlayCircle,
  ShoppingBag,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { contactMessage, getWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Printh3D sobre projetos personalizados, produtos e impressão 3D em Jacupiranga, SP.",
};

const SOCIALS = [
  {
    name: "Instagram",
    label: "@printh_3d",
    href: "https://www.instagram.com/printh_3d/",
    icon: Instagram,
  },
  {
    name: "TikTok",
    label: "@printh_3d",
    href: "https://www.tiktok.com/@printh_3d",
    icon: PlayCircle,
  },
  {
    name: "Facebook",
    label: "Printh3D",
    href: "https://www.facebook.com/Printh3D",
    icon: Facebook,
  },
  {
    name: "Shopee",
    label: "Loja oficial",
    href: "https://shopee.com.br/printh3d",
    icon: ShoppingBag,
  },
];

export default function ContactPage() {
  const whatsappUrl = getWhatsAppLink(contactMessage());

  return (
    <main id="conteudo-principal" className="min-h-screen bg-[#030712]">
      <Navbar />
      <section className="px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40">
        <div className="container-custom">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-[2rem] border border-sky-400/16 bg-[#09182a] p-7 sm:p-10 lg:p-12">
              <span className="eyebrow">Contato Direto</span>
              <h1 className="balanced-title mt-5 max-w-3xl text-5xl font-black tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
                Vamos entender a peça que você precisa.
              </h1>
              <p className="pretty-copy mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-300">
                Envie medidas, referências e detalhes de uso. A equipe responde
                com orientação sobre material, acabamento, prazo e produção.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-sky-400 px-7 py-4 font-black text-slate-950 hover:bg-sky-300"
                >
                  <MessageCircle size={21} aria-hidden="true" />
                  Abrir WhatsApp
                </a>
                <Link
                  href="/orcamento"
                  className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-7 py-4 font-black text-white hover:border-sky-400/25"
                >
                  Preparar Orçamento
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <InfoCard
                icon={MapPin}
                title="Localização"
                value="Jacupiranga, SP"
                detail="Atendimento local e envio nacional."
              />
              <InfoCard
                icon={Clock}
                title="Atendimento"
                value="Seg. a Sex., 9h–18h"
                detail="Sábado, 9h–13h."
              />
              <a
                href="mailto:printh3d@outlook.com"
                className="rounded-[1.75rem] border border-white/8 bg-[#08111f] p-6 hover:border-sky-400/25 sm:col-span-2 lg:col-span-1"
              >
                <Mail size={23} className="text-sky-300" aria-hidden="true" />
                <span className="mt-5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  E-mail
                </span>
                <strong className="mt-1 block break-all text-lg text-white">
                  printh3d@outlook.com
                </strong>
              </a>
            </div>
          </div>

          <section className="section-space pb-0">
            <div className="max-w-2xl">
              <span className="eyebrow">Acompanhe a Produção</span>
              <h2 className="balanced-title mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
                Projetos, bastidores e produtos nas redes.
              </h2>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SOCIALS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover-lift rounded-[1.5rem] border border-white/8 bg-[#08111f] p-6"
                  >
                    <Icon size={24} className="text-sky-300" aria-hidden="true" />
                    <strong className="mt-7 block text-xl text-white">
                      {social.name}
                    </strong>
                    <span className="mt-1 block text-sm font-bold text-slate-500">
                      {social.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-[#08111f] p-6">
      <Icon size={23} className="text-sky-300" aria-hidden="true" />
      <span className="mt-5 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {title}
      </span>
      <strong className="mt-1 block text-xl text-white">{value}</strong>
      <p className="mt-2 text-sm font-medium text-slate-500">{detail}</p>
    </div>
  );
}
