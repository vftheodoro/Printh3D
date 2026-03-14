'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Search, Filter, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';

interface Category {
  id: number;
  nome: string;
  cor: string;
}

interface Product {
  id: number;
  codigo_sku: string;
  nome: string;
  preco_venda: number;
  quantidade_estoque: number;
  ativo: boolean;
  category?: Category;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const initialForm = {
    nome: '', category_id: '', descricao: '',
    preco_venda: 0, quantidade_estoque: 0, ativo: true, material: 'PLA', cor: ''
  };
  const [formData, setFormData] = useState<any>(initialForm);

  useEffect(() => {
    loadData();
  }, [search, categoryFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products?search=${search}&category_id=${categoryFilter}`),
        fetch('/api/admin/categories')
      ]);
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (prod?: Product) => {
    setActiveTab('basic');
    if (prod) {
      setEditingId(prod.id);
      try {
        // Fetch full product details
        const res = await fetch(`/api/admin/products?search=${prod.codigo_sku}`);
        const data = await res.json();
        const fullProd = data[0];
        setFormData({
          ...fullProd,
          category_id: fullProd.category_id || ''
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const payload = { ...formData };
      if (!payload.category_id) payload.category_id = null;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      
      closeModal();
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este produto? Ele será movido para a lixeira.')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="section active">
      <div className="section-header">
        <h1><Package /> Produtos</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '0 0.8rem' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou SKU..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', padding: '0.6rem', color: 'var(--text)' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: 'auto', minWidth: '150px' }}>
            <option value="">Todas as Categorias</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>ID</th>
              <th style={{ width: '60px' }}>Foto</th>
              <th>SKU / Produto</th>
              <th>Categoria</th>
              <th>Estoque</th>
              <th>Preço Base</th>
              <th>Status</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum produto encontrado.</td></tr>
            ) : products.map(prod => (
              <tr key={prod.id} style={{ opacity: prod.ativo ? 1 : 0.5 }}>
                <td style={{ color: 'var(--text-muted)' }}>#{prod.id}</td>
                <td>
                  <div style={{ width: '36px', height: '36px', background: 'var(--bg-input)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                     <ImageIcon size={18} />
                  </div>
                </td>
                <td>
                  <strong style={{ display: 'block' }}>{prod.nome}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.codigo_sku}</span>
                </td>
                <td>
                  {prod.category ? (
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--bg-sidebar)', borderRadius: '4px', borderLeft: `2px solid ${prod.category.cor}` }}>
                      {prod.category.nome}
                    </span>
                  ) : <span style={{ color: 'var(--text-muted)' }}>Sem Categoria</span>}
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: prod.quantidade_estoque <= 0 ? 'var(--danger)' : 'var(--text)' }}>
                    {prod.quantidade_estoque} un
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{formatMoney(prod.preco_venda)}</td>
                <td>
                  {prod.ativo ? 
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.8rem' }}><CheckCircle size={14}/> Ativo</span> : 
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '0.8rem' }}><XCircle size={14}/> Inativo</span>
                  }
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => openModal(prod)}><Edit2 size={14} /></button>
                    <button className="btn btn-danger" style={{ padding: '0.4rem', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger-light)' }} onClick={() => handleDelete(prod.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal" style={{ maxWidth: '800px', width: '95%' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-tabs">
              <button className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>Dados Básicos</button>
              <button className={`tab-btn ${activeTab === 'tech' ? 'active' : ''}`} onClick={() => setActiveTab('tech')}>Técnico / Custos</button>
              {editingId && <button className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>Arquivos (Fotos/3D)</button>}
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh' }}>
              <form id="product-form" onSubmit={handleSubmit}>
                
                {activeTab === 'basic' && (
                  <div className="tab-content default-active">
                    <div className="form-row">
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Nome do Produto *</label>
                        <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
                      </div>
                      <div className="form-group">
                        <label>Categoria</label>
                        <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                          <option value="">Selecione...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>SKU (Deixe em branco para auto-gerar)</label>
                        <input type="text" value={formData.codigo_sku || ''} onChange={e => setFormData({...formData, codigo_sku: e.target.value})} disabled={!!editingId} />
                      </div>
                      <div className="form-group">
                        <label>Preço de Venda (R$) *</label>
                        <input type="number" step="0.01" value={formData.preco_venda} onChange={e => setFormData({...formData, preco_venda: parseFloat(e.target.value)})} required />
                      </div>
                      <div className="form-group">
                        <label>Quantidade em Estoque</label>
                        <input type="number" value={formData.quantidade_estoque} onChange={e => setFormData({...formData, quantidade_estoque: parseInt(e.target.value)})} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" id="ativo" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} style={{ width: 'auto' }} />
                        <label htmlFor="ativo" style={{ margin: 0 }}>Produto Ativo no Catálogo</label>
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Descrição para a Loja</label>
                        <textarea rows={4} value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})}></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'tech' && (
                  <div className="tab-content default-active">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Material de Impressão</label>
                        <select value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})}>
                          <option value="PLA">PLA</option>
                          <option value="PETG">PETG</option>
                          <option value="ABS">ABS</option>
                          <option value="TPU">TPU</option>
                          <option value="RESINA">Resina</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Cor (Padrão)</label>
                        <input type="text" value={formData.cor || ''} onChange={e => setFormData({...formData, cor: e.target.value})} placeholder="Ex: Preto, Branco, Sortido" />
                      </div>
                      <div className="form-group">
                        <label>Peso (gramas)</label>
                        <input type="number" value={formData.peso_g || 0} onChange={e => setFormData({...formData, peso_g: parseFloat(e.target.value)})} />
                      </div>
                      <div className="form-group">
                        <label>Tempo de Impressão (Horas + Minutos)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="number" value={formData.tempo_h || 0} onChange={e => setFormData({...formData, tempo_h: parseInt(e.target.value)})} placeholder="H" />
                          <input type="number" value={formData.tempo_min || 0} onChange={e => setFormData({...formData, tempo_min: parseInt(e.target.value)})} placeholder="Min" max="59" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'files' && editingId && (
                  <div className="tab-content default-active">
                    <p style={{ color: 'var(--text-muted)' }}>Gerenciamento de arquivos (fotos, modelos STL/3MF) será processado através do bucket do Supabase Storage no próximo módulo.</p>
                  </div>
                )}

              </form>
            </div>
            
            <div className="modal-header" style={{ borderTop: '1px solid var(--border)', borderBottom: 'none', background: 'transparent', justifyContent: 'flex-end', gap: '0.8rem' }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button type="submit" form="product-form" className="btn btn-primary">Salvar Produto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
