"use client";

import Navbar from "@/components/layout/Navbar";
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
  ArrowRight
} from "lucide-react";

const materials = [
  {
    id: "pla",
    name: "PLA",
    fullName: "Ácido Polilático",
    origin: "Derivado de milho ou cana-de-açúcar (Biodegradável)",
    strength: "Média",
    heatResistance: "Baixa (até 55°C)",
    applications: "Action figures, protótipos visuais, itens decorativos.",
    dailyLife: "Embalagens de comida biodegradáveis, fios de sutura médicos.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    image: "/assets/imagens/printing_detail.png"
  },
  {
    id: "abs",
    name: "ABS",
    fullName: "Acrilonitrila Butadieno Estireno",
    origin: "Derivado de petróleo (Plástico industrial)",
    strength: "Alta",
    heatResistance: "Alta (até 100°C)",
    applications: "Peças automotivas, carcaças eletrônicas, gabaritos técnicos.",
    dailyLife: "Peças de LEGO, painéis de carros, capacetes de segurança.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    image: "/assets/imagens/abs_industrial.png"
  },
  {
    id: "petg",
    name: "PETG",
    fullName: "Polietileno Tereftalato de Glicol",
    origin: "Evolução do material das garrafas PET",
    strength: "Muito Alta",
    heatResistance: "Média-Alta (até 80°C)",
    applications: "Suportes mecânicos, peças externas, itens que batem/vibram.",
    dailyLife: "Garrafas de refrigerante, recipientes de alimentos reutilizáveis.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    image: "/assets/imagens/finished_showcase.png"
  },
  {
    id: "tpu",
    name: "TPU",
    fullName: "Poliuretano Termoplástico",
    origin: "Elastômero flexível",
    strength: "Resistência ao impacto",
    heatResistance: "Média",
    applications: "Capas de celular, pneus de robótica, vedações, calçados.",
    dailyLife: "Pulseiras de relógio inteligente, solas de tênis de corrida.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    image: "/assets/imagens/printer_farm.png"
  }
];

export default function MaterialsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20">
          <Image 
            src="/assets/imagens/materials_hero.png" 
            alt="Materials Background" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-tight">
              A Magia da <span className="text-blue-500 font-black">Manufatura.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Descubra como transformamos polímeros em soluções reais para o seu dia a dia.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
             <div className="relative h-[500px] rounded-[3rem] overflow-hidden group shadow-2xl">
                <Image 
                  src="/assets/imagens/printing_detail.png" 
                  alt="3D Printing Process" 
                  fill 
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-blue-600/20 group-hover:bg-transparent transition-colors duration-700" />
             </div>
             
             <div>
                <h2 className="text-4xl font-black mb-10 tracking-tight">O que é <span className="text-blue-500">FDM?</span></h2>
                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Camada por Camada</h3>
                      <p className="text-slate-400 leading-relaxed font-medium">A tecnologia FDM (Fused Deposition Modeling) derrete um filamento plástico e o deposita em camadas ultra-finas (até 0.1mm), construindo o objeto de baixo para cima.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 text-teal-400">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Precisão Digital</h3>
                      <p className="text-slate-400 leading-relaxed font-medium">Cada movimento é controlado por computadores de alta performance, garantindo que o resultado final seja fiel ao desenho digital.</p>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Materials Deep Dive */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">O Universo dos <span className="text-blue-500">Materiais</span></h2>
            <p className="text-slate-400 text-lg font-medium">Cada projeto exige um material específico. Conheça as nossas opções:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {materials.map((m, idx) => (
              <motion.div
                key={m.id}
                id={m.id}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`p-10 rounded-[3rem] bg-slate-900/50 border ${m.border} flex flex-col gap-8 transition-all hover:bg-slate-900 group`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 inline-block ${m.color}`}>{m.fullName}</span>
                    <h3 className="text-5xl font-black text-white tracking-tighter">{m.name}</h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl ${m.bg} flex items-center justify-center ${m.color}`}>
                    {m.id === "pla" && <Zap className="w-6 h-6" />}
                    {m.id === "abs" && <Car className="w-6 h-6" />}
                    {m.id === "petg" && <Wrench className="w-6 h-6" />}
                    {m.id === "tpu" && <Smartphone className="w-6 h-6" />}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Aplicação Recomendada</h4>
                      <p className="text-sm text-slate-200 font-bold leading-relaxed">{m.applications}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Aplicações no Dia-a-Dia</h4>
                      <p className="text-sm text-slate-400 font-medium italic">"{m.dailyLife}"</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 p-6 rounded-2xl bg-slate-950/50">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-black uppercase">Resistência</span>
                      <span className="text-white font-black">{m.strength}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-black uppercase">Calor</span>
                      <span className="text-white font-black">{m.heatResistance}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium pt-2 border-t border-white/5">{m.origin}</p>
                  </div>
                </div>

                {m.image && (
                  <div className="relative h-40 rounded-2xl overflow-hidden mt-2">
                    <Image src={m.image} alt={m.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
