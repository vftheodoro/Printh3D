"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const steps = [
  {
    number: "01",
    title: "Escolha ou Envie",
    desc: "Encontre algo no nosso catálogo ou envie seu arquivo STL/OBJ para nós.",
    image: "/assets/imagens/design_screen.png"
  },
  {
    number: "02",
    title: "Personalize",
    desc: "Defina cores, materiais e acabamentos. O resultado é único para você.",
    image: "/assets/imagens/printing_detail.png"
  },
  {
    number: "03",
    title: "Produção",
    desc: "Seu projeto é enviado para nossa farm de impressoras de alta precisão.",
    image: "/assets/imagens/printer_farm.png"
  },
  {
    number: "04",
    title: "Receba",
    desc: "Peça produzida com rigoroso controle de qualidade e entregue em mãos.",
    image: "/assets/imagens/finished_showcase.png"
  }
];

export default function Features() {
  return (
    <div className="py-24 bg-slate-950">
      {/* Process Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Processo <span className="text-blue-500">Otimizado</span>
            </h2>
            <p className="text-lg text-slate-400 font-medium">
              Simplicidade em cada etapa para que você foque no que importa: seu design.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group p-2 rounded-[2.5rem] bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-all overflow-hidden"
            >
              <div className="relative h-48 overflow-hidden rounded-[2rem] mb-6">
                <Image 
                  src={step.image} 
                  alt={step.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-slate-950/40" />
                <div className="absolute top-4 left-4 text-4xl font-black text-white/20 group-hover:text-blue-500/40 transition-colors">
                  {step.number}
                </div>
              </div>
              <div className="px-6 pb-6 pt-2">
                <h3 className="text-xl font-black text-white mb-3 tracking-tight">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
