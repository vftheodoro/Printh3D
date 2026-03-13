import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FAQ from "@/components/home/FAQ";
import Footer from "@/components/layout/Footer";
import { MessageCircle } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow">
        <Hero />
        <Features />
        <FeaturedProducts />
        
        {/* Conversion CTA */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="relative p-12 md:p-20 rounded-[3.5rem] bg-blue-600 overflow-hidden flex flex-col items-center text-center shadow-2xl shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-950/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
                Pronto para dar vida à sua ideia?
              </h2>
              <p className="text-xl text-blue-100 mb-12 font-medium">
                Faça uma simulação instantânea e descubra como é fácil e acessível imprimir em 3D.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/orcamento" 
                  className="px-12 py-5 bg-white text-blue-600 rounded-2xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  SIMULAR AGORA
                </a>
                <a 
                  href="/produtos" 
                  className="px-12 py-5 bg-blue-700 text-white rounded-2xl font-black text-lg hover:bg-blue-800 transition-all active:scale-95"
                >
                  VER CATÁLOGO
                </a>
              </div>
            </div>
          </div>
        </section>

        <FAQ />
        
        {/* WhatsApp Floating CTA */}
        <a
          href="https://wa.me/5513997553465"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 left-8 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-2xl shadow-2xl shadow-green-500/30 transition-all hover:scale-110 group border border-white/10"
          aria-label="Falar no WhatsApp"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="absolute left-full ml-4 bg-slate-900 border border-white/5 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl">
            Atendimento
          </span>
        </a>
      </div>

      <Footer />
    </main>
  );
}
