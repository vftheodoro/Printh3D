"use client";

import Image from "next/image";
import { useState } from "react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setShake(false);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error?.message || "Não foi possível realizar o login.",
        );
      }

      window.location.assign("/admin");
    } catch (loginError: unknown) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Erro ao realizar login.",
      );
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-wrapper">
      <section
        className={`login-card ${shake ? "shake" : ""}`}
        aria-labelledby="login-title"
      >
        <div className="login-logo">
          <Image
            src="/assets/logos/logo_printh_azul.png"
            alt="Printh3D"
            width={80}
            height={80}
            priority
          />
          <h1 id="login-title">Printh3D</h1>
          <p>Sistema de Gestão Integrado</p>
        </div>

        {error ? (
          <div className="login-error" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="admin-email">E-mail</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Ex.: admin@printh3d.com"
              required
              disabled={loading}
              autoComplete="email"
              spellCheck={false}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Senha</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha de acesso…"
              required
              minLength={8}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <LogIn size={16} aria-hidden="true" />
            {loading ? "Entrando…" : "Entrar no Sistema"}
          </button>
        </form>

        <p className="login-info">
          Acesso restrito à equipe Printh3D. Use somente dispositivos e redes
          confiáveis.
        </p>
      </section>
    </main>
  );
}
