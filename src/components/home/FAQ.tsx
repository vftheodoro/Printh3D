"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle, ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Quanto tempo demora uma impressão?",
    a: "Depende do volume e da complexidade técnica. Pequenas peças levam entre 2 e 5 horas, enquanto projetos industriais complexos podem demandar vários dias de produção contínua."
  },
  {
    q: "Quais materiais vocês utilizam?",
    a: "Nossa linha inclui PLA (ecológico), ABS (resistência térmica), PETG (durabilidade industrial) e TPU (elastômero flexível de alta memória)."
  },
  {
    q: "Preciso enviar o arquivo 3D pronto?",
    a: "Sim, trabalhamos com .STL, .OBJ ou .STEP. Caso ainda não tenha o arquivo, nossa equipe técnica pode te orientar a encontrar ou solicitar um design especializado."
  },
  {
    q: "Vocês fazem pintura e acabamento?",
    a: "Efetivamos desde o pós-processamento básico até pintura automotiva de alto brilho e lixamento técnico para remover marcas de camadas."
  }
];

export default function FAQ() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <section className="max-w-5xl mx-auto px-6 py-32 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      
      <div className="text-center mb-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-white/5 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-2xl"
        >
          <HelpCircle className="w-3.5 h-3.5" /> FAQ Técnico
        </motion.div>
        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-tight">
          Dúvidas <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Recorrentes.</span>
        </h2>
        <p className="text-slate-500 font-semibold max-w-xl mx-auto">
          Esclareça os pontos principais sobre prazos, materiais e processos para o seu próximo projeto.
        </p>
      </div>

      <div className="space-y-4 relative z-10">
        {faqs.map((faq, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-[2rem] border transition-all duration-500 group ${
              activeIdx === idx 
                ? "bg-slate-900/80 border-blue-500/30 shadow-2xl shadow-blue-500/10 backdrop-blur-xl" 
                : "bg-slate-900/40 border-white/5 hover:border-white/10"
            }`}
          >
            <button
              onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
              className="w-full flex items-center justify-between p-8 md:p-10 text-left relative"
            >
              <span className={`text-lg md:text-xl font-black tracking-tight transition-colors duration-300 ${activeIdx === idx ? "text-blue-400" : "text-slate-200"}`}>
                {faq.q}
              </span>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                activeIdx === idx 
                  ? "bg-blue-600 text-white rotate-180 shadow-lg shadow-blue-600/30" 
                  : "bg-slate-800 text-slate-500 group-hover:text-blue-400"
              }`}>
                <ChevronDown className="w-6 h-6" />
              </div>
            </button>
            <AnimatePresence>
              {activeIdx === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <div className="px-10 pb-10">
                    <div className="pt-8 border-t border-white/5">
                      <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-3xl">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
