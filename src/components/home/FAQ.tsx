import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    question: "Quanto tempo demora uma impressão?",
    answer:
      "O prazo depende do tamanho, complexidade, material e fila de produção. Peças pequenas podem levar algumas horas; projetos maiores podem exigir vários dias. O prazo final é confirmado antes da produção.",
  },
  {
    question: "Quais materiais vocês utilizam?",
    answer:
      "Trabalhamos principalmente com PLA, PETG, ABS e TPU. A recomendação considera resistência, temperatura, flexibilidade, acabamento e local de uso da peça.",
  },
  {
    question: "Preciso ter o arquivo 3D pronto?",
    answer:
      "Não necessariamente. Se você tiver STL, OBJ, 3MF ou STEP, a análise é mais rápida. Também podemos orientar sobre modelagem ou adaptação quando existe apenas uma ideia, foto ou referência.",
  },
  {
    question: "A estimativa do site é o preço final?",
    answer:
      "Não. Ela serve como faixa inicial. O valor final considera geometria real, suportes, tempo de máquina, material, acabamento e eventuais ajustes no arquivo.",
  },
  {
    question: "Vocês enviam para outras cidades?",
    answer:
      "Sim. Atendemos localmente em Jacupiranga, SP, e enviamos para todo o Brasil. O frete é confirmado conforme destino, peso e dimensões da embalagem.",
  },
];

export default function FAQ() {
  return (
    <section className="section-space content-auto border-t border-white/6">
      <div className="container-custom grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div>
          <span className="eyebrow">
            <HelpCircle size={16} aria-hidden="true" />
            Dúvidas Frequentes
          </span>
          <h2 className="balanced-title mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
            Respostas diretas antes do seu pedido.
          </h2>
          <p className="pretty-copy mt-5 font-medium leading-relaxed text-slate-400">
            Ainda ficou alguma dúvida? O atendimento pelo WhatsApp continua
            disponível para analisar o seu caso.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, index) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/7 bg-[#08111f] open:border-sky-400/24 open:bg-[#0a1728]"
              open={index === 0}
            >
              <summary className="cursor-pointer list-none px-5 py-5 text-lg font-black text-white marker:hidden sm:px-6">
                <span className="flex items-center justify-between gap-5">
                  {item.question}
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sky-300 transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="pretty-copy border-t border-white/6 px-5 py-5 font-medium leading-relaxed text-slate-400 sm:px-6">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
