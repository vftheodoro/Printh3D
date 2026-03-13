"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Settings2 } from "lucide-react";

export default function Features() {
  return (
    <div className="py-24 bg-slate-950">
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-blue-500/20"
          >
            <Settings2 className="w-3.5 h-3.5" /> Nosso Setup
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-[1.1] max-w-3xl">
            Simplicidade técnica com <br/> <span className="text-blue-500">resultado profissional.</span>
          </h2>
          
          <p className="text-lg text-slate-400 font-medium mb-12 max-w-2xl leading-relaxed">
            Nossa esteira de produção é otimizada para entregar precisão em cada centímetro. Quer entender como transformamos seu arquivo em um objeto real?
          </p>

          <Link 
            href="/materiais" 
            className="group/btn flex items-center gap-4 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-sm tracking-[0.2em] transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
          >
            SAIBA COMO FUNCIONA
            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
