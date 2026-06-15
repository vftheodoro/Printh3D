import type { Metadata } from "next";
import "./globals.css";
import BackToTop from "@/components/layout/BackToTop";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://printh3d.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Printh3D | Impressão 3D Profissional",
    template: "%s | Printh3D",
  },
  description:
    "Impressão 3D personalizada em Jacupiranga, SP. Peças funcionais, decoração, protótipos e projetos sob medida com envio para todo o Brasil.",
  icons: {
    icon: "/assets/logos/logo_printh_padrão.png",
    apple: "/assets/logos/logo_printh_padrão.png",
  },
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Printh3D",
    title: "Printh3D | Impressão 3D Profissional",
    description:
      "Transformamos ideias em peças reais com precisão, acabamento e atendimento próximo.",
    images: ["/assets/imagens/finished_showcase.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Printh3D | Impressão 3D Profissional",
    description:
      "Peças personalizadas, protótipos e soluções em impressão 3D.",
    images: ["/assets/imagens/finished_showcase.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className="antialiased font-sans flex min-h-screen flex-col relative">
        <a className="skip-link" href="#conteudo-principal">
          Ir para o conteúdo
        </a>
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
