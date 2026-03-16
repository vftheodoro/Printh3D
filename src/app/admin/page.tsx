'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Trophy,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  Coins,
  HandCoins,
  ReceiptText,
  Gauge,
  ShieldAlert,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

type ChartPoint = {
  label: string;
  sales?: number;
  profit?: number;
  expenses?: number;
  net?: number;
  value?: number;
  name?: string;
  color?: string;
};

type StockAlert = {
  id: number;
  nome: string;
  quantidade_estoque: number;
  estoque_minimo: number;
};

interface DashboardData {
  stats: {
    products: number;
    categories: number;
    sales: number;
    clients: number;
    totalSalesValue: number;
    totalProfit: number;
    totalReceivable: number;
    monthSalesValue: number;
    monthProfit: number;
    monthExpensesValue: number;
    monthNetValue: number;
    ticketMedio: number;
    margemMedia: number;
    inadimplencia: number;
    stockAlertsCount: number;
    topProduct: string;
    monthSalesCount: number;
  };
  recentSales: any[];
  stockAlerts: StockAlert[];
  charts: {
    monthlySeries: ChartPoint[];
    weeklySeries: ChartPoint[];
    salesByCategory: ChartPoint[];
    expensesByCategory: ChartPoint[];
  };
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

  const formatPercent = (val: number) => `${Number(val || 0).toFixed(1)}%`;

  const monthlyBarData = useMemo(() => {
    const items = data?.charts?.monthlySeries || [];
    return {
      labels: items.map((i) => i.label),
      datasets: [
        {
          label: 'Vendas (R$)',
          data: items.map((i) => Number(i.sales || 0)),
          backgroundColor: 'rgba(0, 188, 255, 0.7)',
          borderColor: '#00bcff',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'Lucro (R$)',
          data: items.map((i) => Number(i.profit || 0)),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  const weeklyLineData = useMemo(() => {
    const items = data?.charts?.weeklySeries || [];
    return {
      labels: items.map((i) => i.label),
      datasets: [
        {
          label: 'Vendas',
          data: items.map((i) => Number(i.sales || 0)),
          borderColor: '#00bcff',
          backgroundColor: 'rgba(0, 188, 255, 0.2)',
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: 'Gastos',
          data: items.map((i) => Number(i.expenses || 0)),
          borderColor: 'rgba(249, 115, 22, 1)',
          backgroundColor: 'rgba(249, 115, 22, 0.2)',
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: 'Líquido',
          data: items.map((i) => Number(i.net || 0)),
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  }, [data]);

  const categoryDoughnutData = useMemo(() => {
    const items = data?.charts?.salesByCategory || [];
    return {
      labels: items.map((i) => i.name || 'Sem categoria'),
      datasets: [
        {
          data: items.map((i) => Number(i.value || 0)),
          backgroundColor: items.map((i) => `${i.color || '#64748b'}CC`),
          borderColor: items.map((i) => i.color || '#64748b'),
          borderWidth: 2,
        },
      ],
    };
  }, [data]);

  const expenseBarData = useMemo(() => {
    const items = data?.charts?.expensesByCategory || [];
    return {
      labels: items.map((i) => i.name || 'Sem categoria'),
      datasets: [
        {
          label: 'Gastos (R$)',
          data: items.map((i) => Number(i.value || 0)),
          backgroundColor: 'rgba(249, 115, 22, 0.7)',
          borderColor: 'rgba(249, 115, 22, 1)',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  const smartInsights = useMemo(() => {
    if (!data) return [] as string[];
    const out: string[] = [];

    if ((data.stats.monthNetValue || 0) >= 0) {
      out.push(`Resultado líquido positivo no mês: ${formatMoney(data.stats.monthNetValue || 0)}.`);
    } else {
      out.push(`Resultado líquido negativo no mês: ${formatMoney(data.stats.monthNetValue || 0)}. Revisar custos e precificação.`);
    }

    if ((data.stats.inadimplencia || 0) > 15) {
      out.push(`Inadimplência acima de 15% (${formatPercent(data.stats.inadimplencia || 0)}). Priorize cobrança de pendências.`);
    }

    if ((data.stats.stockAlertsCount || 0) > 0) {
      out.push(`${data.stats.stockAlertsCount} produto(s) em alerta de estoque mínimo.`);
    }

    if ((data.stats.ticketMedio || 0) > 0) {
      out.push(`Ticket médio atual: ${formatMoney(data.stats.ticketMedio || 0)}.`);
    }

    if ((data.stats.topProduct || '—') !== '—') {
      out.push(`Produto mais vendido: ${data.stats.topProduct}.`);
    }

    return out;
  }, [data]);

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
            <span className="kpi-label">Vendas do Mês</span>
            <span className="kpi-value">{formatMoney(data?.stats.monthSalesValue || 0)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><TrendingUp /></div>
          <div className="kpi-info">
            <span className="kpi-label">Lucro do Mês</span>
            <span className="kpi-value">{formatMoney(data?.stats.monthProfit || 0)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}><ReceiptText /></div>
          <div className="kpi-info">
            <span className="kpi-label">Gastos do Mês</span>
            <span className="kpi-value">{formatMoney(data?.stats.monthExpensesValue || 0)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}><Coins /></div>
          <div className="kpi-info">
            <span className="kpi-label">Resultado Líquido</span>
            <span className="kpi-value">{formatMoney(data?.stats.monthNetValue || 0)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}><HandCoins /></div>
          <div className="kpi-info">
            <span className="kpi-label">A Receber</span>
            <span className="kpi-value">{formatMoney(data?.stats.totalReceivable || 0)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><BarChart3 /></div>
          <div className="kpi-info">
            <span className="kpi-label">Margem Média</span>
            <span className="kpi-value">{formatPercent(data?.stats.margemMedia || 0)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}><Gauge /></div>
          <div className="kpi-info">
            <span className="kpi-label">Ticket Médio</span>
            <span className="kpi-value">{formatMoney(data?.stats.ticketMedio || 0)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}><ShieldAlert /></div>
          <div className="kpi-info">
            <span className="kpi-label">Inadimplência</span>
            <span className="kpi-value">{formatPercent(data?.stats.inadimplencia || 0)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}><AlertTriangle /></div>
          <div className="kpi-info">
            <span className="kpi-label">Estoque Baixo</span>
            <span className="kpi-value">{data?.stats.stockAlertsCount || 0}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}><Package /></div>
          <div className="kpi-info">
            <span className="kpi-label">Produtos</span>
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

      <div className="dashboard-charts" style={{ marginTop: '1.2rem' }}>
        <div className="chart-container">
          <h3><TrendingUp size={17} /> Vendas x Lucro - Últimos 6 meses</h3>
          <div className="chart-wrapper" style={{ height: '320px' }}>
            <Bar
              data={monthlyBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#94a3b8' } },
                },
                scales: {
                  y: {
                    ticks: {
                      color: '#94a3b8',
                      callback: (value) => `R$ ${Number(value).toLocaleString('pt-BR')}`,
                    },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                  },
                  x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="chart-container chart-sm">
          <h3><BarChart3 size={17} /> Vendas por Categoria</h3>
          <div className="chart-wrapper chart-wrapper-sm" style={{ height: '320px' }}>
            <Doughnut
              data={categoryDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', boxWidth: 12 },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-charts" style={{ marginTop: '1.2rem' }}>
        <div className="chart-container">
          <h3><BarChart3 size={17} /> Fluxo Financeiro Semanal</h3>
          <div className="chart-wrapper" style={{ height: '320px' }}>
            <Line
              data={weeklyLineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#94a3b8' } },
                },
                scales: {
                  y: {
                    ticks: {
                      color: '#94a3b8',
                      callback: (value) => `R$ ${Number(value).toLocaleString('pt-BR')}`,
                    },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                  },
                  x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="chart-container chart-sm">
          <h3><ReceiptText size={17} /> Gastos por Categoria (mês)</h3>
          <div className="chart-wrapper chart-wrapper-sm" style={{ height: '320px' }}>
            <Bar
              data={expenseBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    ticks: {
                      color: '#94a3b8',
                      callback: (value) => `R$ ${Number(value).toLocaleString('pt-BR')}`,
                    },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                  },
                  x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginTop: '1.2rem' }}>
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

        <div className="card">
          <h3><AlertTriangle size={17} /> Alertas de Estoque</h3>
          {data?.stockAlerts && data.stockAlerts.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.8rem' }}>
              {data.stockAlerts.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.55rem 0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.nome}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Mínimo: {item.estoque_minimo}</div>
                  </div>
                  <div style={{ color: 'var(--danger)', fontWeight: 700 }}>
                    {item.quantidade_estoque}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Sem alertas de estoque no momento.</p>
          )}
        </div>

        <div className="card">
          <h3><BarChart3 size={17} /> Resumos Inteligentes</h3>
          {smartInsights.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.8rem' }}>
              {smartInsights.map((text, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.55rem 0.7rem', color: 'var(--text-muted)' }}>
                  {text}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Sem insights no momento.</p>
          )}
        </div>

        <div className="card">
          <h3><ReceiptText size={17} /> Administração de Gastos</h3>
          {data?.charts?.expensesByCategory && data.charts.expensesByCategory.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.8rem' }}>
              {data.charts.expensesByCategory.slice(0, 5).map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.55rem 0.7rem' }}>
                  <span style={{ color: 'var(--text)' }}>{cat.name || 'Sem categoria'}</span>
                  <strong style={{ color: 'var(--warning)' }}>{formatMoney(Number(cat.value || 0))}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Sem gastos registrados no mês.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LayoutDashboardIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
}
