"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getProductById } from "@/lib/products";
import { getWhatsAppLink, productMessage } from "@/lib/whatsapp";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, MessageCircle, Ruler, Info, Palette, Sparkles, ShoppingBag } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const product = getProductById(id as string);

  const [color, setColor] = useState(product?.colors[0] || "");
  const [finish, setFinish] = useState(product?.finishes[0] || "");

  if (!product) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <h1 className="text-3xl font-bold mb-4">Produto não encontrado</h1>
          <button onClick={() => router.push("/produtos")} className="text-blue-500 font-bold hover:underline">
            Voltar ao catálogo
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  const handleBuy = () => {
    const message = productMessage({
      name: product.name,
      price: product.price,
      material: product.material,
      color,
      finish
    });
    window.open(getWhatsAppLink(message), "_blank");
  };

  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-12 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Image Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-square rounded-[2rem] glass overflow-hidden flex items-center justify-center"
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-center p-12">
                  <span className="text-9xl font-black text-white/5 block mb-4">3D</span>
                  <span className="text-text-muted text-sm font-medium uppercase tracking-widest">Imagem Ilustrativa</span>
                </div>
              )}
            </motion.div>

            {/* Info Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  {product.category}
                </span>
                <span className="text-sm text-text-muted flex items-center gap-1">
                  <Info className="w-4 h-4" /> {product.material}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                {product.name}
              </h1>

              <div className="text-3xl font-black text-white mb-8 flex items-baseline gap-2">
                R$ {product.price.toFixed(2)}
                <span className="text-xs text-slate-500 uppercase font-black tracking-widest">A partir de</span>
              </div>

              <p className="text-slate-400 leading-relaxed mb-10 text-lg font-medium">
                {product.fullDesc}
              </p>

              <div className="space-y-8 mb-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold mb-3">
                      <Palette className="w-4 h-4 text-blue-500" /> Cor
                    </label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-gray-900 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      {product.colors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold mb-3">
                      <Sparkles className="w-4 h-4 text-blue-500" /> Acabamento
                    </label>
                    <select
                      value={finish}
                      onChange={(e) => setFinish(e.target.value)}
                      className="w-full bg-gray-900 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      {product.finishes.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBuy}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
              >
                <MessageCircle className="w-6 h-6" />
                COMPRAR PELO WHATSAPP
              </button>

              <div className="mt-8 p-6 bg-slate-900 border border-white/5 rounded-2xl flex items-center gap-6 group hover:border-blue-500/30 transition-all">
                <div className="w-14 h-14 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white mb-1">Prefere a Shopee?</h4>
                  <p className="text-[11px] text-slate-400 font-medium mb-3">Comprou, chegou. Segurança total garantida!</p>
                  <a href="https://shopee.com.br/printh3d" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-blue-500 hover:text-blue-400 decoration-blue-500/30 underline underline-offset-4">
                    Visitar Loja Shopee
                  </a>
                </div>
              </div>

              <p className="text-center text-[10px] text-slate-600 font-black mt-6 italic">
                Ao clicar em comprar, o pedido será confirmado via WhatsApp.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
