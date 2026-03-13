"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { FileText, ShieldAlert, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />
      
      <section className="pt-48 pb-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <FileText className="w-3 h-3" /> Jurídico
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">Termos de <span className="text-blue-500">Uso</span></h1>
            <p className="text-slate-400 font-medium">Última atualização: 12 de Março de 2026</p>
          </motion.div>

          <div className="prose prose-invert prose-blue max-w-none space-y-12 text-slate-300 font-medium leading-relaxed">
            <section>
              <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-blue-500" /> 1. Aceitação dos Termos
              </h2>
              <p>
                Ao acessar e utilizar o site da Printh 3D, você concorda expressamente em cumprir estes Termos de Uso, bem como todas as leis e regulamentos aplicáveis no território brasileiro. Se você não concordar com qualquer um destes termos, está proibido de usar ou acessar este site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
                <Scale className="w-6 h-6 text-blue-500" /> 2. Descrição do Serviço
              </h2>
              <p>
                A Printh 3D atua na prestação de serviços de manufatura aditiva (impressão 3D) sob demanda e venda de modelos pré-configurados. Nossos serviços incluem a conversão de arquivos digitais em objetos físicos utilizando diversos materiais técnicos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white mb-4">3. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo presente no site, incluindo logos, textos, imagens e design, é de propriedade exclusiva da Printh 3D ou licenciado para a mesma. No caso de envios de arquivos personalizados pelo cliente:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>O cliente declara possuir os direitos autorais ou autorização para a fabricação da peça.</li>
                <li>A Printh 3D não se responsabiliza por violações de propriedade intelectual causadas por arquivos de terceiros enviados para impressão.</li>
                <li>Reservamo-nos o direito de recusar impressões que violem leis vigentes ou direitos autorais.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white mb-4">4. Garantias e Responsabilidade</h2>
              <p>
                A impressão 3D é um processo técnico com limitações físicas. Pequenas variações de cor, textura e acabamento são inerentes ao processo e não constituem defeito de fabricação.
              </p>
              <p className="mt-4">
                Em conformidade com o <strong>Código de Defesa do Consumidor (CDC)</strong>:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Produtos personalizados (sob medida) seguem regras específicas de desistência, não sendo aplicável o direito de arrependimento imotivado após o início da produção, conforme jurisprudência para produtos sob encomenda.</li>
                <li>Garantimos a reposição de peças que apresentem defeitos estruturais graves ou erros de fabricação comprovados dentro do prazo legal.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white mb-4">5. Envios e Entregas</h2>
              <p>
                A Printh 3D realiza envios de Jacupiranga, SP para todo o Brasil através de transportadoras parceiras e Correios. Os prazos de entrega informados são estimativas e podem variar conforme a região e a logística de terceiros.
              </p>
            </section>

            <section className="pt-12 border-t border-white/5">
              <h2 className="text-2xl font-black text-white mb-4">6. Foro e Legislação</h2>
              <p>
                Estes termos são regidos pelas leis da República Federativa do Brasil. Para a resolução de quaisquer controvérsias oriundas deste contrato, as partes elegem o foro da Comarca de Jacupiranga, SP.
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
