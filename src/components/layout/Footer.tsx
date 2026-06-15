import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, MessageCircle, ShoppingBag } from "lucide-react";
import { contactMessage, getWhatsAppLink } from "@/lib/whatsapp";

const SITE_LINKS = [
  { name: "Início", href: "/" },
  { name: "Produtos", href: "/produtos" },
  { name: "Como Funciona", href: "/materiais" },
  { name: "Orçamento", href: "/orcamento" },
  { name: "Contato", href: "/contato" },
];

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/printh_3d/",
    icon: Instagram,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/Printh3D",
    icon: Facebook,
  },
  {
    name: "Shopee",
    href: "https://shopee.com.br/printh3d",
    icon: ShoppingBag,
  },
  {
    name: "WhatsApp",
    href: getWhatsAppLink(contactMessage()),
    icon: MessageCircle,
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/6 bg-[#02050c] px-4 pb-8 pt-16 sm:px-6">
      <div className="container-custom">
        <div className="grid gap-12 border-b border-white/6 pb-12 lg:grid-cols-[1.2fr_.8fr_.8fr]">
          <div className="max-w-md">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="Printh3D, página inicial"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/8">
                <Image
                  src="/assets/logos/logo_printh_padrão.png"
                  alt=""
                  width={32}
                  height={32}
                />
              </span>
              <span className="text-2xl font-black tracking-[-0.04em] text-white">
                Printh<span className="text-sky-400">3D</span>
              </span>
            </Link>
            <p className="pretty-copy mt-5 font-medium leading-relaxed text-slate-400">
              Manufatura aditiva e peças personalizadas em Jacupiranga, SP,
              com atendimento próximo e envio para todo o Brasil.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/7 bg-white/[0.03] text-slate-400 transition-colors hover:border-sky-400/25 hover:text-sky-300"
                  >
                    <Icon size={19} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Navegação
            </h2>
            <ul className="mt-5 space-y-3">
              {SITE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-bold text-slate-300 transition-colors hover:text-sky-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Informações
            </h2>
            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  href="/termos"
                  className="font-bold text-slate-300 transition-colors hover:text-sky-300"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="font-bold text-slate-300 transition-colors hover:text-sky-300"
                >
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-xs font-bold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Printh3D. Todos os direitos reservados.</p>
          <p>Jacupiranga, São Paulo</p>
        </div>
      </div>
    </footer>
  );
}
