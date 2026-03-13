"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Printer, Grid, Calculator } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-36 pb-24 overflow-hidden bg-slate-950">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
            x: [0, 30, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-1/4 w-[50rem] h-[50rem] bg-blue-600/10 rounded-full blur-[180px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 right-1/4 w-[40rem] h-[40rem] bg-teal-600/10 rounded-full blur-[160px]" 
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center relative">
        {/* Logo Watermark */}
        <div className="absolute top-0 opacity-[0.03] pointer-events-none select-none -translate-y-12">
          <Image
            src="/assets/logos/logo_printh_padrão.png"
            alt=""
            width={600}
            height={600}
            className="w-[300px] md:w-[600px] object-contain rotate-12"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-sm font-black tracking-widest uppercase mb-10"
        >
          <Printer className="w-4 h-4" />
          Impressão 3D Profissional
        </motion.div>

        <div className="relative mb-12 max-w-4xl">
          {/* Tower Loader Animation - Fixed Positioning */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-20 h-24 flex flex-col-reverse gap-1.5 opacity-60 pointer-events-none">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: [0.2, 1, 0.2], scaleX: 1 }}
                transition={{
                  delay: i * 0.12,
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="h-3 border border-blue-500/30 bg-blue-500/20 rounded-sm shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              />
            ))}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[1.1]"
          >
            Transformamos suas <span className="text-gradient">ideias</span> em realidade
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto mb-14 leading-relaxed font-medium"
          >
            Do protótipo ao produto final, criamos peças únicas com precisão industrial e acabamento profissional.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
        >
          <Link
            href="/produtos"
            className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl shadow-blue-500/40 active:scale-95 hover:scale-105"
          >
            <Grid className="w-6 h-6" />
            CATÁLOGO
          </Link>
          <Link
            href="/orcamento"
            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all border border-white/10 active:scale-95 hover:scale-105 backdrop-blur-sm"
          >
            <Calculator className="w-6 h-6" />
            ORÇAMENTO
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
