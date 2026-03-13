"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube, Github, ShoppingBag } from "lucide-react";

const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/printh_3d/", icon: <Instagram className="w-5 h-5" />, hover: "hover:bg-[#E4405F] hover:shadow-[#E4405F]/20" },
  { name: "Facebook", href: "https://www.facebook.com/Printh3D", icon: <Facebook className="w-5 h-5" />, hover: "hover:bg-[#1877F2] hover:shadow-[#1877F2]/20" },
  { name: "TikTok", href: "https://www.tiktok.com/@printh_3d/", icon: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
    </svg>
  ), hover: "hover:bg-[#00F2EA] hover:shadow-[#00F2EA]/20 hover:text-black" },
  { name: "Shopee", href: "https://shopee.com.br/printh3d", icon: <ShoppingBag className="w-5 h-5" />, hover: "hover:bg-[#EE4D2D] hover:shadow-[#EE4D2D]/20" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/5 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
        <div className="col-span-1 md:col-span-1">
          <Link href="/" className="flex items-center gap-3 mb-8 group">
            <div className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30">
              <Image
                src="/assets/logos/logo_printh_padrão.png"
                alt="Printh3D"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="text-xl font-black text-white">
              Printh<span className="text-blue-500">3D</span>
            </span>
          </Link>
          <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
            Especialistas em manufatura aditiva e soluções personalizadas. Qualidade industrial ao alcance de todos.
          </p>
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg ${social.hover}`}
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8">Navegação</h4>
          <ul className="space-y-4">
            {["Home", "Produtos", "Orçamento", "Contato"].map((item) => (
              <li key={item}>
                <Link href={item === "Home" ? "/" : `/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className="text-slate-500 hover:text-blue-400 text-sm font-bold transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
           <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8">Materiais</h4>
           <ul className="space-y-4">
              <li><Link href="/materiais#pla" className="text-slate-500 hover:text-blue-400 text-sm font-bold transition-colors">PLA (Biodegradável)</Link></li>
              <li><Link href="/materiais#abs" className="text-slate-500 hover:text-blue-400 text-sm font-bold transition-colors">ABS (Resistência)</Link></li>
              <li><Link href="/materiais#petg" className="text-slate-500 hover:text-blue-400 text-sm font-bold transition-colors">PETG (Versatilidade)</Link></li>
              <li><Link href="/materiais#tpu" className="text-slate-500 hover:text-blue-400 text-sm font-bold transition-colors">TPU (Flexível)</Link></li>
           </ul>
        </div>

        <div>
          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8">Shopee Store</h4>
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#EE4D2D]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="mb-6 flex justify-center">
              <Image 
                src="/assets/logos/shopee_logo.png" 
                alt="Shopee Logo" 
                width={80} 
                height={80}
                className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(238,77,45,0.4)] transition-transform group-hover:scale-110 duration-500"
              />
            </div>

            <p className="text-slate-400 text-[10px] font-medium mb-6 relative z-10 text-center leading-relaxed">
              Aproveite a segurança e as garantias da Shopee para suas compras!
            </p>
            <a 
              href="https://shopee.com.br/printh3d"
              target="_blank"
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-[#EE4D2D] text-white py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all border border-white/5 active:scale-95 shadow-xl hover:shadow-[#EE4D2D]/20"
            >
              IR PARA A LOJA
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            © 2026 Printh3D. Todos os direitos reservados.
          </p>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
            DESIGN & DEV BY <a href="https://vftheodoro.github.io/Portfolio/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-white transition-all underline decoration-blue-500/20 underline-offset-4">VICTOR THEODORO</a>
          </p>
        </div>
        <div className="flex gap-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
           <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
           <a href="#" className="hover:text-white transition-colors">Privacidade</a>
        </div>
      </div>
    </footer>
  );
}
