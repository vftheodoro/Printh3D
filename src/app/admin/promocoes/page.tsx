'use client';

import { useState, useEffect } from 'react';
import { Tag, Ticket, Plus, Edit2, Trash2, Calendar, Search } from 'lucide-react';

interface Product {
  id: number;
  nome: string;
  preco_venda: number;
}

interface Promotion {
  id: number;
  product_id: number;
  tipo_desconto: 'percentual' | 'fixo';
  valor_desconto: number;
  preco_promocional: number;
  data_inicio: string | null;
  data_fim: string | null;
  ativo: boolean;
  product?: { nome: string; preco_venda: number };
}

interface Coupon {
  id: number;
  codigo: string;
  tipo_desconto: 'percentual' | 'fixo';
  valor_desconto: number;
  data_validade: string | null;
  limite_usos: number;
  usos_realizados: number;
  categorias: number[] | null;
  ativo: boolean;
}

interface Category {
  id: number;
  nome: string;
}

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<'promotions' | 'coupons'>('promotions');
  
  // Data State
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State - Promotions
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
  const initialPromoForm = {
    product_id: '', tipo_desconto: 'percentual', valor_desconto: 0,
    preco_promocional: 0, data_inicio: '', data_fim: '', ativo: true
  };
  const [promoForm, setPromoForm] = useState<any>(initialPromoForm);

  // Modal State - Coupons
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const initialCouponForm = {
    codigo: '', tipo_desconto: 'percentual', valor_desconto: 0,
    data_validade: '', limite_usos: 0, ativo: true, categorias: [] as number[]
  };
  const [couponForm, setCouponForm] = useState<any>(initialCouponForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promoRes, couponRes, prodRes, catRes] = await Promise.all([
        fetch('/api/admin/promotions'),
        fetch('/api/admin/coupons'),
        fetch('/api/admin/products'),
        fetch('/api/admin/categories')
      ]);
      setPromotions(await promoRes.json());
      setCoupons(await couponRes.json());
      setProducts(await prodRes.json());
      setCategories(await catRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Promo Handlers ---
  const openPromoModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromoId(promo.id);
      setPromoForm({
        ...promo,
        data_inicio: promo.data_inicio ? promo.data_inicio.split('T')[0] : '',
        data_fim: promo.data_fim ? promo.data_fim.split('T')[0] : ''
      });
    } else {
      setEditingPromoId(null);
      setPromoForm(initialPromoForm);
    }
    setIsPromoModalOpen(true);
  };

  const handlePromoCalc = (field: string, val: string | number) => {
    let newVal = val as any;
    if (field !== 'product_id' && field !== 'tipo_desconto') newVal = parseFloat(val.toString()) || 0;
    
    setPromoForm((prev: any) => {
      const state = { ...prev, [field]: newVal };
      if (!state.product_id) return state;
      
      const prod = products.find(p => p.id === parseInt(state.product_id));
      if (!prod) return state;

      if (field === 'valor_desconto' || field === 'tipo_desconto' || field === 'product_id') {
        if (state.tipo_desconto === 'percentual') {
           state.preco_promocional = prod.preco_venda * (1 - (state.valor_desconto / 100));
        } else {
           state.preco_promocional = prod.preco_venda - state.valor_desconto;
        }
      } else if (field === 'preco_promocional') {
         if (state.tipo_desconto === 'percentual') {
            state.valor_desconto = ((prod.preco_venda - state.preco_promocional) / prod.preco_venda) * 100;
         } else {
            state.valor_desconto = prod.preco_venda - state.preco_promocional;
         }
      }
      return state;
    });
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPromoId ? `/api/admin/promotions/${editingPromoId}` : '/api/admin/promotions';
    const method = editingPromoId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoForm)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setIsPromoModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePromoDelete = async (id: number) => {
    if (!confirm('Excluir esta promoção?')) return;
    await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
    loadData();
  };

  // --- Coupon Handlers ---
  const openCouponModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCouponId(coupon.id);
      setCouponForm({
        ...coupon,
        data_validade: coupon.data_validade ? coupon.data_validade.split('T')[0] : ''
      });
    } else {
      setEditingCouponId(null);
      setCouponForm(initialCouponForm);
    }
    setIsCouponModalOpen(true);
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCouponId ? `/api/admin/coupons/${editingCouponId}` : '/api/admin/coupons';
    const method = editingCouponId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setIsCouponModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCouponDelete = async (id: number) => {
    if (!confirm('Excluir este cupom?')) return;
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    loadData();
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="section active">
      <div className="section-header">
        <h1><Tag /> Promoções & Cupons</h1>
      </div>

      <div className="page-tabs">
        <button className={`page-tab ${activeTab === 'promotions' ? 'active' : ''}`} onClick={() => setActiveTab('promotions')}>
          <Tag size={16} /> Produtos
        </button>
        <button className={`page-tab ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')}>
          <Ticket size={16} /> Cupons de Desconto
        </button>
      </div>

      {activeTab === 'promotions' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => openPromoModal()}>
              <Plus size={16} /> Nova Promoção
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className="hide-mobile">Desconto</th>
                  <th>Preço Promo</th>
                  <th className="hide-tablet">Original</th>
                  <th className="hide-tablet">Período</th>
                  <th className="hide-tablet">Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={7}>Carregando...</td></tr> : promotions.map(p => (
                  <tr key={p.id}>
                    <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong>{p.product?.nome || 'Produto removido'}</strong>
                            <span className="show-mobile-inline" style={{ display: 'none', fontSize: '10px', color: 'var(--text-muted)' }}>{p.tipo_desconto === 'percentual' ? `${p.valor_desconto}% OFF` : `R$ ${p.valor_desconto} OFF`}</span>
                        </div>
                    </td>
                    <td className="hide-mobile">{p.tipo_desconto === 'percentual' ? `${p.valor_desconto}% OFF` : `R$ ${p.valor_desconto} OFF`}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{formatMoney(p.preco_promocional)}</td>
                    <td className="hide-tablet" style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{formatMoney(p.product?.preco_venda || 0)}</td>
                    <td className="hide-tablet">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                        {p.data_inicio ? new Date(p.data_inicio).toLocaleDateString() : 'Início img.'} 
                        {' - '}
                        {p.data_fim ? new Date(p.data_fim).toLocaleDateString() : 'S/ limite'}
                      </span>
                    </td>
                    <td className="hide-tablet">
                      {p.ativo ? <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>Ativa</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Inativa</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns">
                        <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => openPromoModal(p)}><Edit2 size={13} /></button>
                        <button className="btn btn-danger-ghost" style={{ padding: '0.35rem' }} onClick={() => handlePromoDelete(p.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'coupons' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => openCouponModal()}>
              <Plus size={16} /> Novo Cupom
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Desconto</th>
                  <th>Validade</th>
                  <th>Usos</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={6}>Carregando...</td></tr> : coupons.map(c => (
                  <tr key={c.id}>
                    <td><strong style={{ background: 'var(--bg-input)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px dashed var(--border)', letterSpacing: '1px' }}>{c.codigo}</strong></td>
                    <td>{c.tipo_desconto === 'percentual' ? `${c.valor_desconto}%` : formatMoney(c.valor_desconto)}</td>
                    <td>{c.data_validade ? new Date(c.data_validade).toLocaleDateString() : 'Sem validade'}</td>
                    <td>{c.usos_realizados} / {c.limite_usos > 0 ? c.limite_usos : '∞'}</td>
                    <td>{c.ativo ? <span style={{ color: 'var(--success)' }}>Ativo</span> : <span style={{ color: 'var(--text-muted)' }}>Inativo</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns">
                        <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => openCouponModal(c)}><Edit2 size={14} /></button>
                        <button className="btn btn-danger-ghost" style={{ padding: '0.4rem' }} onClick={() => handleCouponDelete(c.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PROMO MODAL */}
      {isPromoModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingPromoId ? 'Editar Promoção' : 'Nova Promoção'}</h3>
              <button className="modal-close" onClick={() => setIsPromoModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="promo-form" onSubmit={handlePromoSubmit}>
                <div className="form-group">
                  <label>Produto Base *</label>
                  <select value={promoForm.product_id} onChange={e => handlePromoCalc('product_id', e.target.value)} required disabled={!!editingPromoId}>
                    <option value="">Selecione um produto</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nome} ({formatMoney(p.preco_venda)})</option>)}
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Desconto</label>
                    <select value={promoForm.tipo_desconto} onChange={e => handlePromoCalc('tipo_desconto', e.target.value)}>
                      <option value="percentual">Percentual (%)</option>
                      <option value="fixo">Fixo (R$)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Valor do Desconto</label>
                    <input type="number" step="0.01" value={promoForm.valor_desconto} onChange={e => handlePromoCalc('valor_desconto', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label style={{ color: 'var(--success)' }}>Preço Final (R$)</label>
                    <input type="number" step="0.01" value={promoForm.preco_promocional.toFixed(2)} onChange={e => handlePromoCalc('preco_promocional', e.target.value)} required style={{ borderColor: 'var(--success)', fontWeight: 'bold' }} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Data Início (Opcional)</label>
                    <input type="date" value={promoForm.data_inicio} onChange={e => setPromoForm({...promoForm, data_inicio: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Data Fim (Opcional)</label>
                    <input type="date" value={promoForm.data_fim} onChange={e => setPromoForm({...promoForm, data_fim: e.target.value})} />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="promo-ativo" checked={promoForm.ativo} onChange={e => setPromoForm({...promoForm, ativo: e.target.checked})} style={{ width: 'auto' }} />
                  <label htmlFor="promo-ativo" style={{ margin: 0 }}>Ativar promoção (aplica desconto no catálogo)</label>
                </div>

              </form>
            </div>
            <div className="modal-footer">
              <button type="submit" form="promo-form" className="btn btn-primary">Salvar Promoção</button>
            </div>
          </div>
        </div>
      )}

      {/* COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCouponId ? 'Editar Cupom' : 'Novo Cupom'}</h3>
              <button className="modal-close" onClick={() => setIsCouponModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="coupon-form" onSubmit={handleCouponSubmit}>
                <div className="form-group">
                  <label>Código do Cupom *</label>
                  <input type="text" value={couponForm.codigo} onChange={e => setCouponForm({...couponForm, codigo: e.target.value.toUpperCase()})} required style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }} placeholder="Ex: BEMVINDO10" />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Desconto</label>
                    <select value={couponForm.tipo_desconto} onChange={e => setCouponForm({...couponForm, tipo_desconto: e.target.value})}>
                      <option value="percentual">Percentual (%)</option>
                      <option value="fixo">Fixo (R$)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Valor do Desconto</label>
                    <input type="number" step="0.01" value={couponForm.valor_desconto} onChange={e => setCouponForm({...couponForm, valor_desconto: parseFloat(e.target.value)})} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Validade (Opcional)</label>
                    <input type="date" value={couponForm.data_validade} onChange={e => setCouponForm({...couponForm, data_validade: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Limite de Usos (0 = infinito)</label>
                    <input type="number" min="0" value={couponForm.limite_usos} onChange={e => setCouponForm({...couponForm, limite_usos: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="coupon-ativo" checked={couponForm.ativo} onChange={e => setCouponForm({...couponForm, ativo: e.target.checked})} style={{ width: 'auto' }} />
                  <label htmlFor="coupon-ativo" style={{ margin: 0 }}>Ativo no painel (checkout)</label>
                </div>

              </form>
            </div>
            <div className="modal-footer">
              <button type="submit" form="coupon-form" className="btn btn-primary">Salvar Cupom</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
