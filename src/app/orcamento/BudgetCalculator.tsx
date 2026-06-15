"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cloneElement, useMemo, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Calculator,
  CheckCircle2,
  Info,
  MessageCircle,
  PackageCheck,
} from "lucide-react";
import {
  calculateEstimate,
  type BudgetState,
  USE_CASES,
} from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { budgetMessage, getWhatsAppLink } from "@/lib/whatsapp";

const budgetSchema = z.object({
  useCase: z.enum(["decoracao", "resistente", "funcional", "detalhado"]),
  width: z.number().min(0.5).max(300),
  height: z.number().min(0.5).max(300),
  depth: z.number().min(0.5).max(300),
  infill: z.number().min(5).max(100),
  finish: z.enum(["Básico", "Liso", "Premium"]),
  detailLevel: z.enum(["Econômico", "Padrão", "Fino"]),
  quantity: z.number().int().min(1).max(500),
  urgency: z.enum(["Normal", "Rápido"]),
  shapeComplexity: z.enum(["Simples", "Média", "Complexa"]),
  notes: z.string().trim().max(600),
});

const DEFAULT_VALUES: BudgetState = {
  useCase: "funcional",
  width: 10,
  height: 10,
  depth: 5,
  infill: 20,
  finish: "Básico",
  detailLevel: "Padrão",
  quantity: 1,
  urgency: "Normal",
  shapeComplexity: "Média",
  notes: "",
};

export default function BudgetCalculator() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BudgetState>({
    resolver: zodResolver(budgetSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const values = watch();
  const estimate = useMemo(() => calculateEstimate(values), [values]);

  const sendToWhatsApp = (validValues: BudgetState) => {
    const validEstimate = calculateEstimate(validValues);
    const message = budgetMessage({
      ...validValues,
      ...validEstimate,
    });
    window.open(getWhatsAppLink(message), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_.85fr] lg:gap-8">
      <form
        className="rounded-[2rem] border border-white/8 bg-[#08111f] p-5 sm:p-8"
        onSubmit={handleSubmit(sendToWhatsApp)}
      >
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
            <Calculator size={21} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-black text-white">
              Dados da Peça
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Medidas em centímetros
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Objetivo" error={errors.useCase?.message}>
            <select {...register("useCase")}>
              {Object.entries(USE_CASES).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quantidade" error={errors.quantity?.message}>
            <input
              {...register("quantity", { valueAsNumber: true })}
              type="number"
              min={1}
              max={500}
              inputMode="numeric"
            />
          </Field>

          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <Field label="Largura" error={errors.width?.message}>
              <input
                {...register("width", { valueAsNumber: true })}
                type="number"
                min={0.5}
                max={300}
                step={0.1}
                inputMode="decimal"
              />
            </Field>
            <Field label="Altura" error={errors.height?.message}>
              <input
                {...register("height", { valueAsNumber: true })}
                type="number"
                min={0.5}
                max={300}
                step={0.1}
                inputMode="decimal"
              />
            </Field>
            <Field label="Profund." error={errors.depth?.message}>
              <input
                {...register("depth", { valueAsNumber: true })}
                type="number"
                min={0.5}
                max={300}
                step={0.1}
                inputMode="decimal"
              />
            </Field>
          </div>

          <Field label="Complexidade" error={errors.shapeComplexity?.message}>
            <select {...register("shapeComplexity")}>
              <option>Simples</option>
              <option>Média</option>
              <option>Complexa</option>
            </select>
          </Field>

          <Field label="Preenchimento" error={errors.infill?.message}>
            <select {...register("infill", { valueAsNumber: true })}>
              <option value={10}>10% — visual</option>
              <option value={20}>20% — equilibrado</option>
              <option value={40}>40% — resistente</option>
              <option value={70}>70% — reforçado</option>
              <option value={100}>100% — sólido</option>
            </select>
          </Field>

          <Field label="Acabamento" error={errors.finish?.message}>
            <select {...register("finish")}>
              <option>Básico</option>
              <option>Liso</option>
              <option>Premium</option>
            </select>
          </Field>

          <Field label="Nível de detalhe" error={errors.detailLevel?.message}>
            <select {...register("detailLevel")}>
              <option>Econômico</option>
              <option>Padrão</option>
              <option>Fino</option>
            </select>
          </Field>

          <Field label="Prazo" error={errors.urgency?.message}>
            <select {...register("urgency")}>
              <option>Normal</option>
              <option>Rápido</option>
            </select>
          </Field>

          <Field
            label="Observações"
            error={errors.notes?.message}
            className="sm:col-span-2"
          >
            <textarea
              {...register("notes")}
              rows={4}
              placeholder="Ex.: uso externo, cor desejada, necessidade de encaixe…"
            />
          </Field>
        </div>

        <button
          type="submit"
          className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-sky-400 px-6 py-4 font-black text-slate-950 transition-colors hover:bg-sky-300"
        >
          <MessageCircle size={21} aria-hidden="true" />
          Enviar Resumo no WhatsApp
        </button>
      </form>

      <aside className="sticky top-28 rounded-[2rem] border border-sky-400/18 bg-[#09182a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:p-8">
        <span className="eyebrow">Faixa Estimada</span>
        <div className="mt-5 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
          {formatCurrency(estimate.estimatedMin)}
          <span className="mx-2 text-slate-600">–</span>
          {formatCurrency(estimate.estimatedMax)}
        </div>
        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-400">
          Valor preliminar para {estimate.useCaseLabel.toLowerCase()}, sujeito à
          análise da geometria e do arquivo.
        </p>

        <div className="mt-7 space-y-3 border-t border-white/8 pt-6">
          <ResultLine
            icon={CheckCircle2}
            text={estimate.recommendation}
          />
          <ResultLine
            icon={PackageCheck}
            text={`${values.quantity || 1} unidade(s), acabamento ${values.finish?.toLowerCase()}.`}
          />
          <ResultLine
            icon={Info}
            text="Frete, modelagem e ajustes complexos não estão incluídos."
          />
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactElement<{
    name?: string;
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
}) {
  const control = children;
  const id = String(control.props.name || label)
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-black text-slate-200"
      >
        {label}
      </label>
      <div className="[&_input]:min-h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-white/8 [&_input]:bg-[#050b14] [&_input]:px-4 [&_input]:text-white [&_select]:min-h-12 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-white/8 [&_select]:bg-[#050b14] [&_select]:px-4 [&_select]:text-white [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-white/8 [&_textarea]:bg-[#050b14] [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-white">
        {cloneElement(control, {
          id,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? `${id}-error` : undefined,
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm font-bold text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ResultLine({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex gap-3 text-sm font-medium leading-relaxed text-slate-300">
      <Icon
        size={18}
        className="mt-0.5 shrink-0 text-sky-300"
        aria-hidden="true"
      />
      <span>{text}</span>
    </div>
  );
}
