"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { calculateEstimate, USE_CASES, SHAPE_OCCUPANCY } from "@/lib/budget";
import { getWhatsAppLink, budgetMessage } from "@/lib/whatsapp";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  Target, 
  Ruler, 
  Settings2, 
  MessageCircle, 
  ChevronRight, 
  ChevronLeft,
  Info,
  Box,
  Layers,
  Sparkles,
  Zap
} from "lucide-react";

export default function BudgetPage() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState({
    useCase: "",
    width: 0,
    height: 0,
    depth: 0,
    infill: 20,
    finish: "Basico",
    detailLevel: "Padrao",
    quantity: 1,
    urgency: "Normal",
    shapeComplexity: "Simples",
    notes: ""
  });

  const [estimate, setEstimate] = useState<any>(null);

  useEffect(() => {
    if (state.useCase && state.width > 0 && state.height > 0 && state.depth > 0) {
      setEstimate(calculateEstimate(state as any));
    } else {
      setEstimate(null);
    }
  }, [state]);

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleWhatsApp = () => {
    if (!estimate) return;
    const msg = budgetMessage({
      ...state,
      useCaseLabel: estimate.useCaseLabel,
      estimatedMin: estimate.estimatedMin,
      estimatedMax: estimate.estimatedMax
    });
    window.open(getWhatsAppLink(msg), "_blank");
  };

  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      <section className="pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
               <Calculator className="w-3 h-3" /> Orçamento Instantâneo
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
              Simulador <span className="text-gradient">3D</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
              Configure seu projeto e receba uma estimativa precisa baseada em volume real e complexidade geométrica.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Form Side */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-8 md:p-14 overflow-hidden relative">
                {/* Progress Bar Container */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                  <motion.div 
                    className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                    animate={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                          <Target className="w-8 h-8" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black tracking-tight mb-1">Qual o objetivo?</h2>
                          <p className="text-slate-400 font-medium">Escolha o perfil de uso da sua peça</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(USE_CASES).map(([key, data]: [string, any]) => (
                          <button
                            key={key}
                            onClick={() => { setState({ ...state, useCase: key }); handleNext(); }}
                            className={`p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all text-left group flex flex-col h-full bg-slate-900/50 ${
                              state.useCase === key 
                              ? "bg-blue-600/10 border-blue-600 shadow-2xl shadow-blue-500/20 scale-[1.02]" 
                              : "border-white/5 hover:border-white/20"
                            }`}
                          >
                            <h3 className={`text-lg md:text-xl font-black mb-2 md:mb-3 tracking-tight ${state.useCase === key ? "text-blue-400" : "text-white"}`}>{data.label}</h3>
                            <p className={`text-xs md:text-sm leading-relaxed font-medium mt-auto ${state.useCase === key ? "text-slate-200" : "text-slate-400"}`}>
                              {data.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <div className="flex items-center gap-6">
                        <button onClick={handleBack} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                          <h2 className="text-3xl font-black tracking-tight mb-1">Dimensões</h2>
                          <p className="text-slate-400 font-medium">Largura, altura e profundidade em cm</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {(['width', 'height', 'depth'] as const).map((dim) => (
                          <div key={dim} className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                              <Box className="w-3 h-3 opacity-30" /> {dim === 'width' ? 'Largura' : dim === 'height' ? 'Altura' : 'Profundidade'}
                            </label>
                            <div className="relative group">
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                className="w-full bg-slate-950 border-2 border-white/5 rounded-2xl p-6 focus:border-blue-500 focus:outline-none transition-all text-2xl font-black text-white placeholder:text-slate-800"
                                placeholder="0.0"
                                value={state[dim] || ""}
                                onChange={(e) => setState({ ...state, [dim]: parseFloat(e.target.value) || 0 })}
                              />
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold">cm</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-8 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-6">
                        <Info className="w-7 h-7 text-blue-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                          Para peças circulares ou irregulares, informe o maior diâmetro ou a dimensão total da peça englobada em um prisma.
                        </p>
                      </div>

                      <button
                        onClick={handleNext}
                        disabled={!(state.width > 0 && state.height > 0 && state.depth > 0)}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white py-6 rounded-[2rem] font-black text-lg transition-all shadow-2xl shadow-blue-500/30 active:scale-[0.98]"
                      >
                        PRÓXIMO PASSO <ChevronRight className="w-6 h-6" />
                      </button>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <div className="flex items-center gap-6">
                        <button onClick={handleBack} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                          <h2 className="text-3xl font-black tracking-tight mb-1">Ajuste Final</h2>
                          <p className="text-slate-400 font-medium">Configure detalhes de produção e acabamento</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                               <Layers className="w-4 h-4" /> Preenchimento
                            </label>
                            <span className="text-xl font-black opacity-80">{state.infill}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-white/5"
                            value={state.infill}
                            onChange={(e) => setState({ ...state, infill: parseInt(e.target.value) })}
                          />
                        </div>

                        <div className="space-y-5">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Acabamento
                          </label>
                          <select
                            className="w-full bg-slate-950 border-2 border-white/5 rounded-2xl p-5 focus:border-blue-500 focus:outline-none font-bold text-white transition-all"
                            value={state.finish}
                            onChange={(e) => setState({ ...state, finish: e.target.value })}
                          >
                            <option value="Basico">Básico (Natural)</option>
                            <option value="Liso">Liso (Polimento)</option>
                            <option value="Premium">Premium (Pintura Automotive)</option>
                          </select>
                        </div>

                        <div className="space-y-5">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Settings2 className="w-4 h-4" /> Complexidade
                          </label>
                          <select
                            className="w-full bg-slate-950 border-2 border-white/5 rounded-2xl p-5 focus:border-blue-500 focus:outline-none font-bold text-white transition-all"
                            value={state.shapeComplexity}
                            onChange={(e) => setState({ ...state, shapeComplexity: e.target.value })}
                          >
                            <option value="Simples">Simples (Geometrias retas)</option>
                            <option value="Media">Média (Engrenagens, Suportes)</option>
                            <option value="Complexa">Complexa (Orgânicos, Personagens)</option>
                          </select>
                        </div>

                        <div className="space-y-5">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Prazo de Produção
                          </label>
                          <div className="flex gap-3">
                             <button
                               onClick={() => setState({...state, urgency: 'Normal'})}
                               className={`flex-grow py-5 rounded-2xl font-black tracking-widest text-xs border-2 transition-all ${state.urgency === 'Normal' ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-500/20' : 'bg-slate-950 border-white/5 text-slate-500'}`}
                             >NORMAL</button>
                             <button
                               onClick={() => setState({...state, urgency: 'Rapido'})}
                               className={`flex-grow py-5 rounded-2xl font-black tracking-widest text-xs border-2 transition-all ${state.urgency === 'Rapido' ? 'bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-500/20' : 'bg-slate-950 border-white/5 text-slate-500'}`}
                             >RÁPIDO</button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Notas do Projeto (Opcional)
                          </label>
                          <textarea
                            className="w-full bg-slate-950 border-2 border-white/5 rounded-[2rem] p-8 min-h-[140px] focus:border-blue-500 focus:outline-none font-medium text-white transition-all placeholder:text-slate-800"
                            placeholder="Descreva detalhes como resistência necessária, encaixes ou requisitos especiais..."
                            value={state.notes}
                            onChange={(e) => setState({ ...state, notes: e.target.value })}
                          ></textarea>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Preview Side */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 md:p-14 flex flex-col h-full sticky top-36 shadow-2xl overflow-hidden relative">
                 {/* Background Glow */}
                 <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

                 <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-white">
                   <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500">
                     <Box className="w-5 h-5" />
                   </div>
                   PREVIEW VISUAL
                 </h3>

                 <div className="relative aspect-square bg-slate-950/50 rounded-[2.5rem] flex items-center justify-center overflow-hidden mb-12 border border-white/5 [perspective:1000px]">
                    {/* Enhanced CSS 3D Box */}
                    <div className="relative [transform-style:preserve-3d]">
                      <motion.div
                        animate={{ rotateY: 360, rotateX: [15, 25, 15] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="relative [transform-style:preserve-3d]"
                        style={{
                          width: state.width > 0 ? `${Math.min(120, (state.width / Math.max(state.width, state.height, state.depth)) * 120)}px` : '40px',
                          height: state.height > 0 ? `${Math.min(120, (state.height / Math.max(state.width, state.height, state.depth)) * 120)}px` : '40px',
                        }}
                      >
                        {/* 3D Cube Faces */}
                        {[
                          { transform: `translateZ(${Math.min(60, (state.depth / Math.max(state.width, state.height, state.depth)) * 60)}px)`, color: 'bg-blue-600' },
                          { transform: `rotateY(180deg) translateZ(${Math.min(60, (state.depth / Math.max(state.width, state.height, state.depth)) * 60)}px)`, color: 'bg-blue-700' },
                          { transform: `rotateY(90deg) translateZ(${Math.min(60, (state.width / Math.max(state.width, state.height, state.depth)) * 60)}px)`, color: 'bg-blue-800' },
                          { transform: `rotateY(-90deg) translateZ(${Math.min(60, (state.width / Math.max(state.width, state.height, state.depth)) * 60)}px)`, color: 'bg-blue-800' },
                          { transform: `rotateX(90deg) translateZ(${Math.min(60, (state.height / Math.max(state.width, state.height, state.depth)) * 60)}px)`, color: 'bg-blue-500' },
                          { transform: `rotateX(-90deg) translateZ(${Math.min(60, (state.height / Math.max(state.width, state.height, state.depth)) * 60)}px)`, color: 'bg-blue-900' },
                        ].map((face, i) => (
                          <div
                            key={i}
                            className={`absolute inset-0 ${face.color} border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]`}
                            style={{ 
                              transform: face.transform,
                              backfaceVisibility: 'hidden',
                              width: '100%',
                              height: '100%'
                            }}
                          />
                        ))}
                      </motion.div>
                    </div>
                    
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                        Visualização Proporcional
                    </div>
                    
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs font-black text-white px-5 py-2 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md">
                        <Ruler className="w-4 h-4 text-blue-500" /> {state.width || 0} x {state.height || 0} x {state.depth || 0} CM
                    </div>
                 </div>

                 <div className="space-y-8 mt-auto">
                    <div className="p-10 bg-slate-950 border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center shadow-inner relative overflow-hidden group">
                       <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4 relative">Faixa Estimada</span>
                       {estimate ? (
                         <motion.div
                           initial={{ scale: 0.9, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           className="text-4xl font-black text-white text-center flex flex-col relative"
                         >
                           <span className="text-blue-500 text-sm font-black tracking-widest mb-1 opacity-60">Sugerido</span>
                           R$ {estimate.estimatedMin.toFixed(2)} - {estimate.estimatedMax.toFixed(2)}
                         </motion.div>
                       ) : (
                         <p className="text-slate-600 font-bold text-lg text-center leading-tight relative">Preencha os passos para calcular.</p>
                       )}
                    </div>

                    <button
                      onClick={handleWhatsApp}
                      disabled={!estimate}
                      className="w-full flex items-center justify-center gap-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white py-6 rounded-[2rem] font-black text-xl transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 group"
                    >
                      <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                      ENVIAR PROJETO
                    </button>
                    
                    <p className="text-[11px] text-center text-slate-500 font-bold leading-relaxed px-10">
                      O valor calculado é baseado no volume total da peça. Sujeito a alteração após análise de fatiamento.
                    </p>
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
