import type { Metadata } from "next";
import "./globals.css";
import BackToTop from "@/components/layout/BackToTop";

export const metadata: Metadata = {
  title: "Printh 3D",
  description: "Transformamos suas ideias em realidade com qualidade profissional. Do protótipo ao produto final, criamos peças únicas para você.",
  icons: {
    icon: "/assets/logos/logo_printh_padrão.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans flex flex-col min-h-screen relative">
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
