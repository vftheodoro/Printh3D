'use client';

import { useState, useEffect } from 'react';
import { Trash2, RefreshCcw, AlertTriangle, AlertCircle } from 'lucide-react';

interface TrashItem {
  id: number;
  source_store: string;
  source_id: number;
  item_name: string;
  deleted_at: string;
  expires_at: string;
}

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/trash');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: number, name: string) => {
    if (!confirm(`Deseja restaurar "${name}" para sua origem?`)) return;
    try {
      const res = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      
      alert('Item restaurado com sucesso!');
      loadTrash();
    } catch (err: any) {
      alert(`Erro ao restaurar: ${err.message}`);
    }
  };

  const handlePermanentDelete = async (id: number, name: string) => {
    if (!confirm(`Atenção: A exclusão de "${name}" será definitiva. Confirmar?`)) return;
    try {
      const res = await fetch(`/api/admin/trash/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      loadTrash();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const storeLabels: Record<string, string> = {
    products: 'Produtos catalogados',
    sales: 'Vendas registradas',
    expenses: 'Gastos e Despesas'
  };

  return (
    <div className="section active">
      <div className="section-header">
        <h1><Trash2 /> Lixeira e Recuperação</h1>
      </div>

      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', background: 'var(--danger-light)', border: '1px solid rgba(248, 113, 113, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <AlertTriangle size={24} style={{ color: 'var(--danger)', marginTop: '4px' }} />
        <div>
          <h4 style={{ color: 'var(--danger)', margin: '0 0 0.2rem 0', fontSize: '1rem' }}>Retenção de 30 Dias</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Itens excluídos do sistema ficam armazenados aqui temporariamente. Após a data de expiração, eles são removidos automaticamente de forma definitiva e irrecuperável. Durante esse período, você pode restaurá-los para sua tabela de origem.
          </p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="hide-tablet">ID</th>
              <th>Nome / Referência</th>
              <th>Origem</th>
              <th className="hide-mobile">Data de Exclusão</th>
              <th className="hide-tablet">Expira em</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>A lixeira está vazia.</td></tr>
            ) : items.map(item => {
              const delDate = new Date(item.deleted_at);
              const expDate = new Date(item.expires_at);
              const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              
              return (
                <tr key={item.id}>
                  <td className="hide-tablet" style={{ color: 'var(--text-muted)' }}>#{item.id}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{item.item_name}</strong>
                        <span className="show-mobile-inline" style={{ display: 'none', fontSize: '10px', color: 'var(--text-muted)' }}>{storeLabels[item.source_store] || item.source_store}</span>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge badge-neutral">
                      {storeLabels[item.source_store] || item.source_store}
                    </span>
                  </td>
                  <td className="hide-mobile">{delDate.toLocaleDateString('pt-BR')} às {delDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="hide-tablet">
                    <span className={`status-badge ${daysLeft <= 3 ? 'badge-danger' : 'badge-warning'}`}>
                      <AlertCircle size={12} /> {daysLeft} dia(s)
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                      <div className="action-btns">
                      <button className="btn btn-primary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleRestore(item.id, item.item_name)}>
                        <RefreshCcw size={13} /> <span className="hide-mobile">Restaurar</span>
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => handlePermanentDelete(item.id, item.item_name)} title="Excluir Definitivamente">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
