'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, BarChart3, Trophy, Package, Users, ShoppingCart } from 'lucide-react';

interface DashboardData {
  stats: {
    products: number;
    categories: number;
    sales: number;
    clients: number;
    totalSalesValue: number;
  };
  recentSales: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/dashboard');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error loading dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading) {
    return <div className="p-4 text-[var(--text-muted)]">Carregando dashboard...</div>;
  }

  return (
    <div className="section active">
      <div className="section-header">
        <h1><LayoutDashboardIcon /> Dashboard</h1>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><DollarSign /></div>
          <div className="kpi-info">
            <span className="kpi-label">Faturamento Total</span>
            <span className="kpi-value">{formatMoney(data?.stats.totalSalesValue || 0)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><TrendingUp /></div>
          <div className="kpi-info">
            <span className="kpi-label">Total Vendas</span>
            <span className="kpi-value">{data?.stats.sales || 0}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}><Package /></div>
          <div className="kpi-info">
            <span className="kpi-label">Produtos Cadastrados</span>
            <span className="kpi-value">{data?.stats.products || 0}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}><Users /></div>
          <div className="kpi-info">
            <span className="kpi-label">Clientes</span>
            <span className="kpi-value">{data?.stats.clients || 0}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
        {/* Recent Sales Table */}
        <div className="card">
          <h3><ShoppingCart size={17} /> Vendas Recentes</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Item</th>
                  <th>Pagamento</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentSales && data.recentSales.length > 0 ? (
                  data.recentSales.map((sale: any) => (
                    <tr key={sale.id}>
                      <td>{new Date(sale.data_venda).toLocaleDateString('pt-BR')}</td>
                      <td>{sale.cliente}</td>
                      <td>{sale.item_nome}</td>
                      <td>
                        <span style={{ fontSize:'0.75rem', padding:'0.2rem 0.5rem', background:'var(--border)', borderRadius:'4px' }}>
                          {sale.tipo_pagamento}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatMoney(Number(sale.valor_venda))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma venda recente.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutDashboardIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
}
