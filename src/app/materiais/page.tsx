"use client";

import Navbar from "@/components/layout/Navbar";
import FAQ from "@/components/home/FAQ";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Zap, 
  Settings, 
  Layers, 
  Truck, 
  Car, 
  Smartphone, 
  Home, 
  Wrench,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

const materials = [
  {
    id: "pla",
    name: "PLA",
    fullName: "Ácido Polilático",
    origin: "Derivado de milho ou cana-de-açúcar (Biodegradável)",
    strength: "Média Resistência",
    heatResistance: "Baixa (até 55°C)",
    applications: "Action figures, protótipos visuais e decorativos.",
    dailyLife: "Embalagens biodegradáveis e fios de sutura.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    glow: "shadow-green-500/5",
    image: "/assets/imagens/printing_detail.png"
  },
  {
    id: "abs",
    name: "ABS",
    fullName: "Plástico Industrial (ABS)",
    origin: "Derivado de petróleo de alta performance",
    strength: "Alta Durabilidade",
    heatResistance: "Alta (até 100°C)",
    applications: "Peças automotivas, carcaças e gabaritos técnicos.",
    dailyLife: "Peças de LEGO e painéis de carros.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    glow: "shadow-orange-500/5",
    image: "/assets/imagens/abs_industrial.png"
  },
  {
    id: "petg",
    name: "PETG",
    fullName: "PETG de Alta Engenharia",
    origin: "Evolução do material das garrafas PET",
    strength: "Resistência Química e Mecânica",
    heatResistance: "Moderada (até 80°C)",
    applications: "Suportes industriais e peças de uso externo.",
    dailyLife: "Garrafas e recipientes de alta resistência.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    glow: "shadow-blue-500/5",
    image: "/assets/imagens/finished_showcase.png"
  },
  {
    id: "tpu",
    name: "TPU",
    fullName: "Poliuretano Flexível",
    origin: "Derivado de elastômeros especiais",
    strength: "Extrema Resistência ao Impacto",
    heatResistance: "Resiliente e Térmico",
    applications: "Capas, vedações e componentes flexíveis.",
    dailyLife: "Pulseiras de relógio e solas de calçados.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    glow: "shadow-purple-500/5",
    image: "/assets/imagens/printer_farm.png"
  }
];

export default function MaterialsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-blue-500/30">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
          <Image 
            src="/assets/imagens/materials_hero.png" 
            alt="Materials Background" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10 border border-blue-500/20">
              <ShieldCheck className="w-3 h-3" /> Materiais de Elite
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9]">
              Tecnologia <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Transformada.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Explore a ciência por trás de cada filamento e escolha o polímero ideal para a sua necessidade técnica ou artística.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
             <div className="relative h-[600px] rounded-[3.5rem] overflow-hidden group shadow-2xl border border-white/5">
                <Image 
                  src="/assets/imagens/printing_detail.png" 
                  alt="3D Printing Process" 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-12 left-12 right-12">
                   <div className="w-16 h-1 bg-blue-600 mb-6" />
                   <p className="text-white text-2xl font-black tracking-tighter">Qualidade Industrial <br/> em Cada Camada.</p>
                </div>
             </div>
             
             <div className="space-y-12">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">O que é <span className="text-blue-500">Impressão FDM?</span></h2>
                  <p className="text-slate-400 text-lg leading-relaxed font-medium">
                    Fused Deposition Modeling é o padrão-ouro para prototipagem rápida e produção de peças finais leves e resistentes.
                  </p>
                </div>

                <div className="space-y-10">
                  <div className="flex gap-8 group">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black mb-2 tracking-tight">Deposição de Precisão</h3>
                      <p className="text-slate-400 leading-relaxed font-medium">Derretemos o filamento a temperaturas precisas, depositando camadas de até 0,1mm para garantir acabamento suave e fidelidade dimensional.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-8 group">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black mb-2 tracking-tight">Otimização Geométrica</h3>
                      <p className="text-slate-400 leading-relaxed font-medium">Utilizamos preenchimentos inteligentes internos que garantem que sua peça seja leve, porém com resistência estrutural superior.</p>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Materials Deep Dive */}
      <section className="py-32 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">O Guia de <span className="text-blue-500">Materiais</span></h2>
            <p className="text-slate-400 text-lg font-medium">Dados técnicos comparativos para sua melhor escolha.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {materials.map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`flex flex-col p-8 md:p-12 rounded-[3.5rem] bg-slate-900/40 border ${m.border} ${m.glow} relative overflow-hidden group hover:bg-slate-900 transition-all duration-500`}
              >
                <div className="flex justify-between items-start mb-12">
                  <div className="max-w-[70%]">
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 inline-block ${m.color}`}>{m.fullName}</span>
                    <h3 className="text-6xl font-black text-white tracking-tighter">{m.name}</h3>
                  </div>
                  <div className={`w-16 h-16 rounded-3xl ${m.bg} flex items-center justify-center ${m.color} border ${m.border} shadow-inner`}>
                    {m.id === "pla" && <Zap className="w-7 h-7" />}
                    {m.id === "abs" && <Car className="w-7 h-7" />}
                    {m.id === "petg" && <Wrench className="w-7 h-7" />}
                    {m.id === "tpu" && <Smartphone className="w-7 h-7" />}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-10">
                  <div className="lg:col-span-3 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Principal Diferencial</h4>
                      <p className="text-base text-slate-200 font-bold leading-relaxed">{m.applications}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Exemplo no Cotidiano</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-400 font-medium italic">
                        <ChevronRight className="w-3 h-3 text-blue-500" />
                        "{m.dailyLife}"
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 space-y-5 p-6 rounded-3xl bg-slate-950/60 border border-white/5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Resistência</span>
                      <span className="text-xs text-white font-bold leading-tight">{m.strength}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Térmica</span>
                      <span className="text-xs text-white font-bold leading-tight">{m.heatResistance}</span>
                    </div>
                    <p className="text-[9px] text-slate-600 font-medium pt-4 border-t border-white/5 leading-relaxed">{m.origin}</p>
                  </div>
                </div>

                {m.image && (
                  <div className="relative h-48 rounded-[2rem] overflow-hidden mt-auto border border-white/5">
                    <Image src={m.image} alt={m.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100" />
                    <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay group-hover:opacity-0 transition-opacity" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FAQ />
      <Footer />
    </main>
  );
}
