'use client';

import { useState, useEffect } from 'react';
import { Calculator as CalcIcon, Plus, Save, Printer, DollarSign, Package } from 'lucide-react';

interface SettingsData {
  margem_padrao: number;
  custo_kg: number;
  custo_hora_maquina: number;
  custo_kwh: number;
  consumo_maquina_w: number;
  percentual_falha: number;
  depreciacao_percentual: number;
}

export default function CalculatorPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  
  // Step 1: Piece Data
  const [nome, setNome] = useState('');
  const [peso, setPeso] = useState(0);
  const [tempoH, setTempoH] = useState(0);
  const [tempoMin, setTempoMin] = useState(0);
  
  // Step 2: Extra Costs
  const [embalagem, setEmbalagem] = useState(0);
  const [pintura, setPintura] = useState(0);
  const [frete, setFrete] = useState(0);
  const [outros, setOutros] = useState(0);
  
  // Step 3: Margin Adjustment
  const [margem, setMargem] = useState(100);

  useEffect(() => {
    // Load base settings
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setMargem(data.margem_padrao || 100);
      })
      .catch(console.error);
  }, []);

  if (!settings) return <div className="p-8">Carregando parâmetros...</div>;

  // --- Calculations System ---
  const horasTotais = tempoH + (tempoMin / 60);
  
  // 1. Matéria Prima
  const pesoComFalha = peso * (1 + (settings.percentual_falha / 100));
  const custoMaterial = (pesoComFalha / 1000) * settings.custo_kg;
  
  // 2. Energia
  const kwPorHora = settings.consumo_maquina_w / 1000;
  const custoEnergia = horasTotais * kwPorHora * settings.custo_kwh;
  
  // 3. Máquina (Depreciação + Manutenção)
  const custoMaquinaBase = horasTotais * settings.custo_hora_maquina;
  const custoMaquinaTotal = custoMaquinaBase * (1 + (settings.depreciacao_percentual / 100));
  
  // 4. Custos Produção = Material + Energia + Máquina
  const custoProducao = custoMaterial + custoEnergia + custoMaquinaTotal;
  
  // 5. Custos Adicionais
  const custoAdicional = embalagem + pintura + frete + outros;
  
  // 6. Custo Total da Peça
  const custoTotal = custoProducao + custoAdicional;
  
  // 7. Preço de Venda Base e Final (Margem)
  const lucroDesejado = custoTotal * (margem / 100);
  const precoVendaSugestao = custoTotal + lucroDesejado;

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleSaveProduct = async () => {
    if (!nome) return alert('Dê um nome à peça/produto antes de salvar.');
    if (peso === 0 && horasTotais === 0) return alert('Insira os dados da peça (Step 1).');

    try {
      const payload = {
        nome,
        peso_g: peso,
        tempo_h: tempoH,
        tempo_min: tempoMin,
        custo_total: Number(custoTotal.toFixed(2)),
        preco_venda: Number(precoVendaSugestao.toFixed(2)),
        margem,
        ativo: true,
        calculation_mode: 'advanced',
        custo_detalhado: { material: custoMaterial, energia: custoEnergia, maquina: custoMaquinaTotal },
        custos_adicionais: { embalagem, pintura, frete, outros }
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      alert('Produto salvo no catálogo com sucesso!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="section active">
      <div className="section-header">
        <h1 style={{ fontSize: '1.25rem' }}><CalcIcon /> Calculadora de Custos 3D</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'var(--accent)', color: '#000', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 'bold' }}>1</span>
               Dados da Peça
            </h3>
            <div className="form-group">
              <label>Nome do Projeto / Peça</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Vaso Groot 15cm" />
            </div>
            <div className="form-group">
              <label>Peso (gramas do fatiador)</label>
              <input type="number" step="any" min="0" value={peso} onChange={e => setPeso(parseFloat(e.target.value))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Tempo (Horas)</label>
                <input type="number" min="0" value={tempoH} onChange={e => setTempoH(parseInt(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Tempo (Min)</label>
                <input type="number" min="0" max="59" value={tempoMin} onChange={e => setTempoMin(parseInt(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--info)', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'var(--info)', color: '#000', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 'bold' }}>2</span>
               Custos Extras (Opcional - R$)
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Embalagem</label>
                <input type="number" step="0.01" min="0" value={embalagem} onChange={e => setEmbalagem(parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Pós-pro / Pintura</label>
                <input type="number" step="0.01" min="0" value={pintura} onChange={e => setPintura(parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Frete Material</label>
                <input type="number" step="0.01" min="0" value={frete} onChange={e => setFrete(parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Terceiros / Outros</label>
                <input type="number" step="0.01" min="0" value={outros} onChange={e => setOutros(parseFloat(e.target.value))} />
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)' }}>
             <h3 style={{ fontSize: '1rem', margin: 0, padding: '1rem 1.5rem', background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)' }}>
               Resumo de Custos
             </h3>
             <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Breakdown */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Material (PLA/ABS)</span>
                  <strong style={{ color: 'var(--text)' }}>{formatMoney(custoMaterial)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Energia Elétrica</span>
                  <strong style={{ color: 'var(--text)' }}>{formatMoney(custoEnergia)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Desgaste Equipamento</span>
                  <strong style={{ color: 'var(--text)' }}>{formatMoney(custoMaquinaTotal)}</strong>
                </div>
                {custoAdicional > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px dashed var(--border)' }}>
                    <span style={{ color: 'var(--info)' }}>Custos Extras Manuais</span>
                    <strong style={{ color: 'var(--info)' }}>+ {formatMoney(custoAdicional)}</strong>
                  </div>
                )}
                
                {/* Total Cost Alert */}
                <div style={{ background: 'var(--danger-light)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(248, 113, 113, 0.2)', marginTop: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Custo Total:</span>
                  <strong style={{ color: 'var(--danger)', fontSize: '1.3rem' }}>{formatMoney(custoTotal)}</strong>
                </div>
             </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--success)', boxShadow: '0 0 15px rgba(34, 197, 94, 0.05)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <DollarSign size={20} /> Preço Final
            </h3>
            
            <div className="form-group">
              <label>Ajuste sua Margem de Lucro (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input type="range" min="0" max="500" value={margem} onChange={e => setMargem(parseFloat(e.target.value))} style={{ flex: 1 }} />
                <input type="number" style={{ width: '80px', padding: '0.4rem', textAlign: 'center' }} value={margem} onChange={e => setMargem(parseFloat(e.target.value))} />
              </div>
              <small style={{ color: 'var(--success)', display: 'block', marginTop: '0.5rem' }}>Lucro Bruto Projetado: {formatMoney(lucroDesejado)}</small>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem 0 0.5rem 0', borderTop: '1px solid var(--border)', marginTop: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '0.5rem' }}>Sugestão de Venda</span>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)', textShadow: '0 0 20px rgba(0, 188, 255, 0.2)' }}>
                {formatMoney(precoVendaSugestao)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.8rem' }} onClick={handleSaveProduct}>
                 <Save size={16} /> Salvar Produto
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
