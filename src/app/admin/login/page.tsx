'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShake(false);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login');
      }

      window.location.href = '/admin';
      
    } catch (err: any) {
      setError(err.message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className={`login-card ${shake ? 'shake' : ''}`}>
        <div className="login-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <img 
            src="/assets/logos/logo_printh_azul.png" 
            alt="Printh Logo" 
            style={{ width: '80px', height: 'auto', marginBottom: '1rem', filter: 'drop-shadow(0 4px 12px rgba(0, 188, 255, 0.4))' }} 
          />
          <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 700 }}>Printh</h1>
          <p style={{ color: '#8892b0', marginTop: '0.4rem', fontSize: '0.9rem' }}>Sistema de Gestão Integrado</p>
        </div>

        {error && <div className="login-error" style={{ display: 'block' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: admin@printh3d.com" 
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha de acesso" 
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <LogIn size={15} /> {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="login-info">
          <p>
            Acesso restrito para administradores e equipe <strong>Printh</strong>.<br />
            Certifique-se de estar em uma rede segura.
          </p>
        </div>
      </div>
    </div>
  );
}
