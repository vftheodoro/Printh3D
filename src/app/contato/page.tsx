"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Clock,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Phone,
  Send,
  Linkedin
} from "lucide-react";
import Image from "next/image";

const socialNetworks = [
  {
    name: "Instagram",
    url: "https://www.instagram.com/printh_3d/",
    handle: "@printh_3d",
    icon: <Instagram className="w-5 h-5" />,
    color: "from-purple-600 via-pink-600 to-orange-500",
    desc: "Bastidores, novidades e os projetos mais recentes do dia a dia."
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
    color: "from-slate-800 to-black",
    desc: "Vlogs rápidos de impressão e timelapses cinematográficos."
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
    color: "from-[#EE4D2D] to-[#ff6b4a]",
    desc: "Loja oficial com garantia total e segurança para sua compra."
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/Printh3D",
    handle: "Printh3D",
    icon: <Facebook className="w-5 h-5" />,
    color: "from-blue-600 to-blue-800",
    desc: "Fique por dentro das novidades da nossa comunidade técnica."
  }
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 font-sans">
      <Navbar />

      <section className="pt-40 md:pt-48 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Bento Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-24">
            
            {/* Main Branding Block */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-7 p-10 md:p-14 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 flex flex-col justify-center relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-blue-500/20">
                  <ShieldCheck className="w-3 h-3" /> Contato Direto
                </div>
                <h1 className="text-4xl md:text-8xl font-black mb-6 md:mb-8 tracking-tighter leading-[0.9]">
                  Vamos criar <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">algo novo.</span>
                </h1>
                <p className="text-lg text-slate-400 font-medium max-w-lg leading-relaxed mb-10">
                  Nossa equipe técnica está pronta para transformar seus designs digitais em soluções reais e precisas.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a 
                    href="https://wa.me/5513997553465"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-slate-950 rounded-xl font-bold text-sm tracking-tight transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" /> WHATSAPP
                  </a>
                  <a 
                    href="mailto:printh3d@outlook.com"
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm tracking-tight transition-all hover:bg-slate-700 active:scale-95 border border-white/5"
                  >
                    <Send className="w-4 h-4" /> E-MAIL
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Info Column Grid */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              
              {/* Location Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-10 rounded-[2.5rem] bg-slate-900/50 border border-white/5 flex flex-col justify-between group hover:border-blue-500/20 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Localização</h4>
                  <p className="text-xl font-bold text-white leading-tight">Jacupiranga, SP</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Logística ágil para todo o país.</p>
                </div>
              </motion.div>

              {/* Hours Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-10 rounded-[2.5rem] bg-slate-900/50 border border-white/5 flex flex-col justify-between group hover:border-teal-500/20 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Atendimento</h4>
                  <p className="text-xl font-bold text-white leading-tight">Seg à Sex: 09h — 18h</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Sábados: 09h — 13h</p>
                </div>
              </motion.div>

            </div>

          </div>

          {/* Quick Contact Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-32">
             <motion.a 
                href="https://wa.me/5513997553465"
                target="_blank"
                rel="noopener noreferrer"
                className="p-8 rounded-[2rem] bg-slate-900/30 border border-white/5 hover:border-blue-500/20 transition-all flex items-center gap-6 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Telefone Principal</span>
                  <span className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">(13) 99755-3465</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-700 group-hover:text-blue-500 transition-all" />
             </motion.a>

             <motion.a 
                href="mailto:printh3d@outlook.com"
                className="p-8 rounded-[2rem] bg-slate-900/30 border border-white/5 hover:border-indigo-500/20 transition-all flex items-center gap-6 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Correio Eletrônico</span>
                  <span className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">printh3d@outlook.com</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-500 transition-all" />
             </motion.a>
          </div>

          {/* Connect Section */}
          <div className="pt-24 border-t border-white/5">
            <div className="text-center mb-16">
              <span className="text-blue-500 font-black text-xs tracking-widest uppercase mb-4 block">Social Network</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Estamos <span className="text-slate-500 italic">conectados.</span></h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  className="group relative p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all flex flex-col items-center text-center overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${net.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`} />
                  
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${net.color} shadow-2xl transition-all duration-500 group-hover:scale-110 mb-8 border border-white/10`}>
                    {net.icon}
                  </div>
                  
                  <h3 className="text-xl font-black text-white mb-2 tracking-tighter group-hover:text-blue-400 transition-colors uppercase">{net.name}</h3>
                  <p className="text-[10px] font-bold text-blue-500/80 tracking-widest mb-6 lowercase">{net.handle}</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed italic px-4">"{net.desc}"</p>

                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <ExternalLink className="w-4 h-4 text-slate-700" />
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
