import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BudgetCalculator from "./BudgetCalculator";

export const metadata: Metadata = {
  title: "Orçamento de Impressão 3D",
  description:
    "Calcule uma faixa inicial para sua peça personalizada e envie os detalhes diretamente à equipe Printh3D.",
};

export default function BudgetPage() {
  return (
    <main id="conteudo-principal" className="min-h-screen bg-[#030712]">
      <Navbar />
      <section className="px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40">
        <div className="container-custom">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
            <span className="eyebrow">Estimativa Inicial</span>
            <h1 className="balanced-title mt-5 text-4xl font-black tracking-[-0.05em] text-white sm:text-6xl">
              Transforme medidas em um ponto de partida.
            </h1>
            <p className="pretty-copy mt-5 text-lg font-medium text-slate-400">
              Preencha as informações principais. A faixa abaixo não substitui
              a análise técnica do arquivo, mas agiliza a conversa.
            </p>
          </div>
          <BudgetCalculator />
        </div>
      </section>
      <Footer />
    </main>
  );
}
