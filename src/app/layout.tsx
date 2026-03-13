import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import BackToTop from "@/components/layout/BackToTop";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

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
      <body className={`${outfit.variable} antialiased font-sans`}>
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
