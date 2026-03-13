"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";

export default function ShopeeBanner() {
  return (
    <section className="pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="group relative p-6 md:p-8 rounded-[2rem] bg-gradient-to-r from-[#EE4D2D] to-[#ff6b4a] text-white overflow-hidden shadow-2xl shadow-orange-500/10 transition-all duration-500 hover:shadow-orange-500/30 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 w-full">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-500 p-2.5 border-4 border-white/20">
              <Image 
                src="/assets/logos/shopee_logo.png" 
                alt="Shopee Logo" 
                width={50} 
                height={50} 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col justify-center h-full">
              <div className="flex justify-center md:justify-start mb-2">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[9px] font-black uppercase tracking-[0.2em] border border-white/20 flex items-center gap-1.5 shadow-sm">
                  <ShoppingBag className="w-3 h-3" /> Compra Garantida
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tighter leading-tight mb-1">
                Prefere comprar <span className="text-orange-100">pela Shopee?</span>
              </h2>
              <p className="text-orange-50/80 text-xs md:text-sm font-medium max-w-md leading-relaxed hidden md:block">
                Aproveite a segurança da plataforma, cupons e frete grátis em nossa loja oficial.
              </p>
            </div>
          </div>

          <a 
            href="https://shopee.com.br/printh3d" 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative z-10 whitespace-nowrap inline-flex items-center justify-center gap-2 bg-white text-[#EE4D2D] px-8 py-3.5 rounded-xl font-black text-xs shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 group/btn overflow-hidden w-full md:w-auto tracking-widest"
          >
            VISITAR LOJA
            <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
