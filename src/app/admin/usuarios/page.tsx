'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Key, Shield } from 'lucide-react';

interface User {
  id: number;
  nome: string;
  email: string;
  tipo: 'ADMIN' | 'VENDEDOR';
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const initialForm = {
    nome: '', email: '', senha: '', tipo: 'VENDEDOR'
  };
  const [formData, setFormData] = useState<any>(initialForm);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        nome: user.nome, email: user.email, tipo: user.tipo, senha: ''
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
    const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users';
    const method = editingId ? 'PUT' : 'POST';

    // Validation
    if (!editingId && !formData.senha) return alert('Senha é obrigatória para novos usuários.');

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Only send password if it was filled (for updates)
          senha: formData.senha || undefined
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      
      closeModal();
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (id === 1) return alert('O usuário principal não pode ser excluído.');
    if (!confirm('Excluir permanentemente este usuário?')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="section active">
      <div className="section-header">
        <h1><Users /> Gestão de Acessos</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="hide-mobile">ID</th>
              <th>Usuário</th>
              <th className="hide-tablet">E-mail</th>
              <th className="hide-tablet">Acesso</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum usuário encontrado.</td></tr>
            ) : users.map(user => (
              <tr key={user.id}>
                <td className="hide-mobile" style={{ color: 'var(--text-muted)' }}>#{user.id}</td>
                <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{user.nome}</strong>
                        <span className="show-mobile-inline" style={{ display: 'none', fontSize: '10px', color: 'var(--text-muted)' }}>{user.email}</span>
                    </div>
                </td>
                <td className="hide-tablet">{user.email}</td>
                <td className="hide-tablet">
                  {user.tipo === 'ADMIN' ? (
                    <span className="status-badge badge-danger">
                      <Shield size={12}/> Administrador
                    </span>
                  ) : (
                    <span className="status-badge badge-info">
                      <Key size={12}/> Vendedor
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="action-btns">
                    <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => openModal(user)}><Edit2 size={13} /></button>
                    {user.id !== 1 && (
                      <button className="btn btn-danger-ghost" style={{ padding: '0.35rem' }} onClick={() => handleDelete(user.id)}><Trash2 size={13} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal" style={{ maxWidth: '500px', width: '95%' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <form id="user-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome Completo *</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
                </div>
                
                <div className="form-group">
                  <label>E-mail (Usado no login) *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>

                <div className="form-group" style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <label>{editingId ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha de Acesso *'}</label>
                  <input type="password" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} {...(!editingId ? { required: true } : {})} />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Nível de Acesso</label>
                  <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} disabled={editingId === 1}>
                    <option value="ADMIN">Administrador Total</option>
                    <option value="VENDEDOR">Vendedor (Bloqueado em configs)</option>
                  </select>
                </div>

              </form>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button type="submit" form="user-form" className="btn btn-primary">Salvar Usuário</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
