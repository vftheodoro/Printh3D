"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, EyeOff, Database } from "lucide-react";

export default function PrivacyPage() {
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-500/10 text-teal-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <ShieldCheck className="w-3 h-3" /> Segurança
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-white">Política de <span className="text-teal-500">Privacidade</span></h1>
            <p className="text-slate-400 font-medium italic">Em conformidade com a LGPD (Lei 13.709/2018)</p>
          </motion.div>

          <div className="prose prose-invert max-w-none space-y-12 text-slate-300 font-medium leading-relaxed">
            <section className="p-8 rounded-[2rem] bg-slate-900/50 border border-white/5">
              <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Lock className="w-6 h-6 text-teal-500" /> Introdução
              </h2>
              <p>
                A Printh 3D, com sede em Jacupiranga, SP, respeita a sua privacidade. Esta Política de Privacidade explica como coletamos, usamos e protegemos seus dados pessoais de acordo com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
                <Database className="w-6 h-6 text-teal-500" /> 1. Coleta de Dados
              </h2>
              <p>
                Coletamos apenas as informações estritamente necessárias para a prestação de nossos serviços e para a sua melhor experiência em nosso catálogo:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-400">
                <li><strong>Dados de Contato:</strong> Nome, E-mail e Telefone (fornecidos via WhatsApp ou formulário).</li>
                <li><strong>Dados de Entrega:</strong> Endereço completo para o envio dos produtos.</li>
                <li><strong>Logs Técnicos:</strong> Endereço IP e cookies de sessão para melhorar a navegação.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
                <EyeOff className="w-6 h-6 text-teal-500" /> 2. Uso dos Dados
              </h2>
              <p>
                Os seus dados são utilizados exclusivamente para as seguintes finalidades:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Processamento e fabricação de pedidos personalizados.</li>
                <li>Cálculo de frete e logística de entrega.</li>
                <li>Atendimento direto ao cliente via WhatsApp ou E-mail.</li>
                <li>Cumprimento de obrigações legais e emissão de notas fiscais.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white mb-4">3. Compartilhamento de Informações</h2>
              <p>
                Não vendemos ou alugamos seus dados pessoais. O compartilhamento ocorre apenas com parceiros essenciais para o funcionamento do serviço:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Transportadoras:</strong> Apenas dados de entrega para o transporte.</li>
                <li><strong>Marketplaces (Shopee):</strong> Caso a compra seja realizada via plataforma oficial do parceiro.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white mb-4">4. Seus Direitos (LGPD)</h2>
              <p>
                Como titular dos dados, você tem o direito de solicitar a qualquer momento:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Confirmação da existência de tratamento.</li>
                <li>Acesso, correção ou exclusão definitiva de seus dados de nossa base.</li>
                <li>Revogação de consentimento para comunicações de marketing.</li>
              </ul>
            </section>

            <section className="pt-12 border-t border-white/5">
              <h2 className="text-2xl font-black text-white mb-4">5. Contato DPO</h2>
              <p>
                Para exercer seus direitos de privacidade, entre em contato com nosso responsável pela proteção de dados através do e-mail: <a href="mailto:contato@printh3d.com" className="text-teal-500 hover:text-white underline underline-offset-4">contato@printh3d.com</a>.
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
