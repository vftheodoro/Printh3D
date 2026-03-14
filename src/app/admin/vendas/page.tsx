'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, Edit2, Trash2, Search, CheckCircle, AlertTriangle, User, Calendar } from 'lucide-react';

interface Sale {
  id: number;
  data_venda: string;
  cliente: string;
  item_nome: string;
  valor_venda: number;
  valor_devido: number;
  tipo_pagamento: string;
  vendedor?: { nome: string };
  observacoes: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, paid, pending
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const initialForm = {
    cliente: '', item_nome: '', valor_venda: 0, valor_devido: 0, 
    tipo_pagamento: 'PIX', parcelas: 1, observacoes: '', data_venda: new Date().toISOString().slice(0, 16)
  };
  const [formData, setFormData] = useState<any>(initialForm);

  useEffect(() => {
    loadSales();
  }, [search, statusFilter]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales?search=${search}&status=${statusFilter}`);
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (sale?: Sale) => {
    if (sale) {
      setEditingId(sale.id);
      setFormData({
        ...sale,
        data_venda: new Date(sale.data_venda).toISOString().slice(0, 16)
      });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/admin/sales/${editingId}` : '/api/admin/sales';
    const method = editingId ? 'PUT' : 'POST';

    try {
      // Ensure ISO string for Supabase timestamp
      const payload = {
        ...formData,
        data_venda: new Date(formData.data_venda).toISOString()
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      
      closeModal();
      loadSales();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta venda? Ela será movida para a lixeira.')) return;
    try {
      const res = await fetch(`/api/admin/sales/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      loadSales();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="section active">
      <div className="section-header">
        <h1><Wallet /> Vendas</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Nova Venda
        </button>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '0 0.8rem' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou item..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', padding: '0.6rem', color: 'var(--text)' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter('all')}>Todas</button>
          <button className={`btn ${statusFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter('paid')}>Pagas</button>
          <button className={`btn ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter('pending')}>Com Débito</button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID / Data</th>
              <th>Cliente</th>
              <th>Item / Pedido</th>
              <th>Vendedor</th>
              <th>Pagamento</th>
              <th>Valor Total</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Nenhuma venda encontrada.</td></tr>
            ) : sales.map(sale => {
              const date = new Date(sale.data_venda);
              const isPending = sale.valor_devido > 0;
              return (
                <tr key={sale.id}>
                  <td>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>#{sale.id}</span>
                    <span style={{ fontSize: '0.8rem' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px', opacity: 0.7 }}/>{date.toLocaleDateString('pt-BR')}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <User size={14} />
                      </div>
                      <strong style={{ fontSize: '0.9rem' }}>{sale.cliente}</strong>
                    </div>
                  </td>
                  <td>{sale.item_nome}</td>
                  <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sale.vendedor?.nome || 'Sistema'}</span></td>
                  <td>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--bg-sidebar)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      {sale.tipo_pagamento}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatMoney(sale.valor_venda)}</td>
                  <td>
                    {isPending ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', fontSize: '0.8rem', background: 'var(--warning-light)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        <AlertTriangle size={14}/> Faltam {formatMoney(sale.valor_devido)}
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.8rem' }}>
                        <CheckCircle size={14}/> Pago
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => openModal(sale)}><Edit2 size={14} /></button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger-light)' }} onClick={() => handleDelete(sale.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal" style={{ maxWidth: '700px', width: '95%' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Editar Venda' : 'Registrar Venda'}</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <form id="sale-form" onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)', gap: '1.5rem' }}>
                  
                  {/* Left Column: Data */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Detalhes do Pedido</h4>
                    
                    <div className="form-group">
                      <label>Cliente (Nome completo) *</label>
                      <input type="text" value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} required placeholder="Ex: João Silva" />
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Será salvo na base de clientes auto.</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Nome do Item / Produto *</label>
                      <input type="text" value={formData.item_nome} onChange={e => setFormData({...formData, item_nome: e.target.value})} required placeholder="O que foi vendido?" />
                    </div>

                    <div className="form-group">
                      <label>Data da Venda</label>
                      <input type="datetime-local" value={formData.data_venda} onChange={e => setFormData({...formData, data_venda: e.target.value})} required />
                    </div>
                    
                    <div className="form-group">
                      <label>Observações</label>
                      <textarea rows={3} value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} placeholder="Medidas, cor, prazo..."></textarea>
                    </div>
                  </div>

                  {/* Right Column: Values */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Valores e Pagamento</h4>
                    
                    <div className="form-group">
                      <label>Valor Total da Venda (R$) *</label>
                      <input type="number" step="0.01" value={formData.valor_venda} onChange={e => setFormData({...formData, valor_venda: parseFloat(e.target.value)})} required style={{ fontSize: '1.2rem', fontWeight: 'bold' }} />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Forma de Pag.</label>
                        <select value={formData.tipo_pagamento} onChange={e => setFormData({...formData, tipo_pagamento: e.target.value})}>
                          <option value="PIX">PIX</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="Link de Pagamento">Link de Pagamento</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Parcelas</label>
                        <input type="number" min="1" value={formData.parcelas} onChange={e => setFormData({...formData, parcelas: parseInt(e.target.value)})} />
                      </div>
                    </div>

                    <div className="form-group" style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--warning-light)' }}>
                      <label style={{ color: 'var(--warning)' }}>Valor Faltante / Devido (R$)</label>
                      <input type="number" step="0.01" value={formData.valor_devido} onChange={e => setFormData({...formData, valor_devido: parseFloat(e.target.value)})} style={{ borderColor: 'var(--warning-light)' }} />
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginTop: '0.5rem' }}>Coloque 0 se foi pago integralmente.</small>
                    </div>

                  </div>

                </div>
              </form>
            </div>
            
            <div className="modal-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none', background: 'transparent', justifyContent: 'flex-end', gap: '0.8rem' }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button type="submit" form="sale-form" className="btn btn-primary">Salvar Venda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
