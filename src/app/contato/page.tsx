"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { 
  Instagram, 
  Facebook, 
  MessageCircle, 
  ShoppingBag, 
  Mail, 
  MapPin, 
  Clock,
  ArrowUpRight
} from "lucide-react";
import Image from "next/image";

const socialNetworks = [
  {
    name: "Instagram",
    url: "https://www.instagram.com/printh_3d/",
    handle: "@printh_3d",
    icon: <Instagram className="w-5 h-5" />,
    color: "bg-[#E4405F]",
    desc: "Acompanhe nossos bastidores e novos projetos diariamente."
  },
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@printh_3d",
    handle: "@printh_3d",
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
      </svg>
    ),
    color: "bg-slate-800",
    desc: "Vlogs rápidos de impressão e timelapse das peças mais legais."
  },
  {
    name: "Shopee",
    url: "https://shopee.com.br/printh3d",
    handle: "printh3d",
    icon: (
      <div className="relative w-7 h-7">
        <Image 
          src="/assets/logos/shopee_logo.png" 
          alt="Shopee" 
          fill 
          className="object-contain"
        />
      </div>
    ),
    color: "bg-[#EE4D2D]",
    desc: "Nossa loja oficial para compras com garantia total."
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/Printh3D",
    handle: "Printh3D",
    icon: <Facebook className="w-5 h-5" />,
    color: "bg-[#1877F2]",
    desc: "Fique por dentro das novidades da nossa comunidade."
  }
];

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      <section className="pt-48 pb-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start mb-32">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10">
                 <MessageCircle className="w-3 h-3" /> Fale Conosco
              </div>
              <h1 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter leading-[0.9]">
                Vamos criar <br/><span className="text-blue-500">algo novo.</span>
              </h1>
              <p className="text-xl text-slate-400 font-medium mb-16 max-w-lg leading-relaxed">
                Nossa equipe técnica está pronta para transformar seu projeto em realidade.
              </p>
              
              <div className="space-y-4">
                <a 
                  href="https://wa.me/5513997553465"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-slate-900 border border-white/5 hover:border-blue-500/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">WhatsApp</h3>
                    <p className="text-xl font-black text-white">(13) 99755-3465</p>
                  </div>
                </a>

                <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-slate-900 border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">E-mail</h3>
                    <p className="text-xl font-black text-white">contato@printh3d.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
               <div className="p-10 rounded-[3rem] bg-slate-900/50 border border-white/5 flex flex-col justify-between aspect-square">
                  <MapPin className="w-8 h-8 text-blue-500" />
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Localização</h4>
                    <p className="text-lg font-bold text-white leading-tight">Jacupiranga, SP.<br/>Envio para todo o Brasil.</p>
                  </div>
               </div>
               <div className="p-10 rounded-[3rem] bg-slate-900/50 border border-white/5 flex flex-col justify-between aspect-square">
                  <Clock className="w-8 h-8 text-blue-500" />
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Horários</h4>
                    <p className="text-lg font-bold text-white leading-tight">Seg à Sex: 09h - 18h<br/>Sábados: 09h - 13h</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="pt-24 border-t border-white/5">
            <h2 className="text-3xl font-black mb-16 text-center">Nossas <span className="text-blue-500">Redes</span></h2>
            
            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {socialNetworks.map((net, idx) => (
                <motion.a
                  key={net.name}
                  href={net.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group p-8 rounded-[2rem] bg-slate-900/50 border border-white/5 hover:border-blue-500/20 transition-all flex flex-col items-center text-center"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${net.color} shadow-lg transition-all group-hover:scale-110 mb-6`}>
                    {net.icon}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-black text-white mb-1 tracking-tight group-hover:text-blue-400 transition-colors uppercase">{net.name}</h3>
                    <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-4 uppercase">{net.handle}</p>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2">{net.desc}</p>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
