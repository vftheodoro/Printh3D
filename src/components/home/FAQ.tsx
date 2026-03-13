"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Quanto tempo demora uma impressão?",
    a: "Depende do tamanho e complexidade. Peças pequenas podem levar 2-4 horas, enquanto projetos maiores ou detalhados podem levar vários dias. Sempre informamos o prazo estimado no orçamento."
  },
  {
    q: "Quais materiais vocês utilizam?",
    a: "Trabalhamos principalmente com PLA (biodegradável), ABS (resistência térmica), PETG (durabilidade e flexibilidade) e TPU (materiais elásticos/borrachudos)."
  },
  {
    q: "Preciso enviar o arquivo 3D pronto?",
    a: "Sim, preferencialmente nos formatos .STL ou .OBJ. Se você não tiver o arquivo, podemos ajudar a encontrar modelos em bibliotecas online ou indicar parceiros de modelagem."
  },
  {
    q: "Vocês fazem pintura e acabamento?",
    a: "Oferecemos opções de acabamento básico (remoção de suportes), lixamento e pintura premium (automotiva). Verifique as opções no simulador de orçamento."
  }
];

export default function FAQ() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <section className="max-w-4xl mx-auto px-6 py-32">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
           <HelpCircle className="w-3 h-3" /> Perguntas Frequentes
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Tire suas <span className="text-blue-500">Dúvidas</span></h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div 
            key={idx}
            className="rounded-3xl bg-slate-900 border border-white/5 overflow-hidden transition-all hover:border-blue-500/30 group"
          >
            <button
              onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
              className="w-full flex items-center justify-between p-6 md:p-8 text-left"
            >
              <span className="text-base md:text-lg font-bold text-white pr-8">{faq.q}</span>
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                {activeIdx === idx ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </button>
            <AnimatePresence>
              {activeIdx === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-8 pb-8"
                >
                  <p className="text-slate-400 font-medium leading-relaxed border-t border-white/5 pt-6">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
