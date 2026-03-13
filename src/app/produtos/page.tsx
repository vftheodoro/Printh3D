"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { filterProducts, getCategories, getAllProducts } from "@/lib/products";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PackageOpen, LayoutGrid, X, ShoppingBag } from "lucide-react";
import Image from "next/image";

export default function Catalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = getCategories();
  const filtered = filterProducts(query, category);

  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      <section className="pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20 border-b border-white/5 pb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <LayoutGrid className="w-3 h-3" /> Explore peças
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
                Nosso <span className="text-gradient">Catálogo</span>
              </h1>
              <p className="text-lg text-slate-400 font-medium">
                Coleção curada de modelos otimizados para impressão 3D em diversos materiais e aplicações.
              </p>
            </div>

            <div className="flex flex-col gap-6 w-full lg:w-auto">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Pesquisar modelos..."
                  className="w-full lg:min-w-[400px] bg-slate-900 border border-white/10 rounded-2xl py-5 pl-14 pr-12 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg font-medium placeholder:text-slate-600"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setCategory("all")}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all border tracking-widest flex-shrink-0 ${
                    category === "all"
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  TUDO
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all border tracking-widest flex-shrink-0 ${
                      category === cat
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8"
              >
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-32 flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 rounded-[2rem] bg-slate-900 flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                  <PackageOpen className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-3xl font-black mb-4">Nenhum resultado</h3>
                <p className="text-lg text-slate-500 max-w-md mx-auto mb-10">
                  Tente remover os filtros ou pesquisar por termos mais genéricos.
                </p>
                <button
                  onClick={() => { setQuery(""); setCategory("all"); }}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black tracking-widest hover:bg-blue-500 transition-colors shadow-xl shadow-blue-500/20"
                >
                  VER TUDO
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="group relative p-10 md:p-16 rounded-[3.5rem] bg-[#EE4D2D] text-white overflow-hidden shadow-2xl shadow-orange-500/20 transition-all duration-500 hover:shadow-orange-500/40">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-white/20">
                  <ShoppingBag className="w-3 h-3" /> Compra Garantida
                </div>
                <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-[0.9]">
                  Inseguro com o <br/><span className="text-white/80">WhatsApp?</span>
                </h2>
                <p className="text-xl text-orange-50 font-medium mb-12 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Sem problemas! Adquira nossos produtos através da nossa loja oficial na Shopee com toda a segurança e proteção que você já conhece.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <a 
                    href="https://shopee.com.br/printh3d" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 bg-white text-[#EE4D2D] px-12 py-6 rounded-2xl font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 group/btn overflow-hidden relative"
                  >
                    <span className="relative z-10">COMPRAR PELA SHOPEE</span>
                    <div className="absolute inset-0 bg-slate-100 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  </a>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                  {/* Floating Elements Background */}
                  <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse" />
                  
                  {/* Main Logo Container */}
                  <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-all duration-700 border-4 border-white/20 group-hover:scale-110">
                    <div className="relative w-32 h-32 md:w-40 md:h-40">
                      <Image 
                        src="/assets/logos/shopee_logo.png" 
                        alt="Shopee Logo" 
                        fill 
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* Decorative Sparkles/Floaties */}
                  <div className="absolute top-0 right-0 w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl rotate-12 animate-bounce flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute bottom-4 left-0 w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl -rotate-12 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
