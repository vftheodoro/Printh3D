"use client";

import { useRef, useState } from "react";
import { DatabaseBackup, FileJson, ShieldCheck, Upload } from "lucide-react";

interface DryRunTable {
  table: string;
  rows: number;
}

interface DryRunResponse {
  data?: {
    dryRun: boolean;
    tables: DryRunTable[];
    totalRows: number;
  };
  error?: {
    message?: string;
  };
}

export default function MaintenancePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<Record<string, unknown> | null>(null);
  const [preview, setPreview] = useState<DryRunResponse["data"]>(undefined);
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function validateBackup(file: File) {
    setStatus(null);
    setPreview(undefined);
    setConfirmation("");

    try {
      const parsed = JSON.parse(await file.text()) as Record<string, unknown>;
      const response = await fetch("/api/admin/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup: parsed, dryRun: true }),
      });
      const payload = (await response.json()) as DryRunResponse;

      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error?.message || "O arquivo de backup não é válido.",
        );
      }

      setBackup(parsed);
      setPreview(payload.data);
      setStatus({
        type: "success",
        message:
          "Validação concluída. Revise o resumo antes de confirmar a importação.",
      });
    } catch (error: unknown) {
      setBackup(null);
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível validar o arquivo.",
      });
    }
  }

  async function importBackup() {
    if (!backup || confirmation !== "IMPORTAR") return;
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup, dryRun: false }),
      });
      const payload = (await response.json()) as {
        data?: { totalRows: number };
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(
          payload.error?.message || "A importação não foi concluída.",
        );
      }

      setStatus({
        type: "success",
        message: `${payload.data?.totalRows || 0} registros processados com sucesso.`,
      });
      setConfirmation("");
    } catch (error: unknown) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "A importação não foi concluída.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section active" aria-labelledby="maintenance-title">
      <div className="section-header">
        <div>
          <h1 id="maintenance-title">
            <ShieldCheck aria-hidden="true" /> Manutenção
          </h1>
          <p>
            Operações sensíveis disponíveis exclusivamente para
            administradores.
          </p>
        </div>
      </div>

      <div className="maintenance-grid">
        <article className="maintenance-card">
          <div className="maintenance-icon">
            <DatabaseBackup aria-hidden="true" />
          </div>
          <h2>Exportar backup</h2>
          <p>
            Baixe uma cópia JSON dos registros administrativos antes de
            migrations ou alterações em lote.
          </p>
          <a className="btn btn-primary" href="/api/admin/backup" download>
            <DatabaseBackup size={16} aria-hidden="true" />
            Baixar Backup
          </a>
        </article>

        <article className="maintenance-card">
          <div className="maintenance-icon">
            <FileJson aria-hidden="true" />
          </div>
          <h2>Validar e importar</h2>
          <p>
            O arquivo é analisado primeiro. Nenhum registro é alterado durante
            a etapa de validação.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void validateBackup(file);
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={16} aria-hidden="true" />
            Selecionar JSON
          </button>

          {preview ? (
            <div className="maintenance-preview">
              <strong>
                {preview.totalRows} registros em {preview.tables.length} tabelas
              </strong>
              <ul>
                {preview.tables.map((item) => (
                  <li key={item.table}>
                    {item.table}: {item.rows}
                  </li>
                ))}
              </ul>

              <div className="maintenance-confirm">
                <label htmlFor="import-confirmation">
                  Digite IMPORTAR para confirmar
                </label>
                <input
                  id="import-confirmation"
                  value={confirmation}
                  onChange={(event) =>
                    setConfirmation(event.target.value.toUpperCase())
                  }
                  autoComplete="off"
                />
              </div>

              <button
                type="button"
                className="btn btn-danger"
                onClick={importBackup}
                disabled={confirmation !== "IMPORTAR" || loading}
              >
                {loading ? "Importando..." : "Confirmar Importação"}
              </button>
            </div>
          ) : null}
        </article>
      </div>

      {status ? (
        <div
          className={`maintenance-status ${status.type}`}
          role={status.type === "error" ? "alert" : "status"}
        >
          {status.message}
        </div>
      ) : null}
    </section>
  );
}
