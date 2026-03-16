import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

function toPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return n <= 1 ? n * 100 : n;
}

function toDecimal(n: number) {
  if (!Number.isFinite(n)) return 0;
  return n > 1 ? n / 100 : n;
}

function toUiSettings(data: any) {
  return {
    id: 1,
    margem_padrao: toPercent(Number(data?.margem_padrao ?? 0.5)),
    custo_kg: Number(data?.custo_kg ?? 120),
    custo_hora_maquina: Number(data?.custo_hora_maquina ?? 5),
    custo_kwh: Number(data?.custo_kwh ?? 0.85),
    consumo_maquina_w: Number(data?.consumo_maquina_w ?? 350),
    percentual_falha: toPercent(Number(data?.percentual_falha ?? 0.05)),
    depreciacao_percentual: toPercent(Number(data?.depreciacao_percentual ?? 0.1))
  };
}

function toDbSettings(data: any) {
  return {
    id: 1,
    margem_padrao: toDecimal(Number(data?.margem_padrao ?? 50)),
    custo_kg: Number(data?.custo_kg ?? 120),
    custo_hora_maquina: Number(data?.custo_hora_maquina ?? 5),
    custo_kwh: Number(data?.custo_kwh ?? 0.85),
    consumo_maquina_w: Number(data?.consumo_maquina_w ?? 350),
    percentual_falha: toDecimal(Number(data?.percentual_falha ?? 5)),
    depreciacao_percentual: toDecimal(Number(data?.depreciacao_percentual ?? 10)),
    updated_at: new Date().toISOString(),
  };
}

// GET global calculation settings (always ID 1)
export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    
    // Return legacy defaults if not initialized
    if (!data) {
       return NextResponse.json(toUiSettings(null));
    }

    return NextResponse.json(toUiSettings(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE global calculation settings
export async function PUT(request: Request) {
  try {
    const json = await request.json();
    const supabase = getAdminSupabase();
    const payload = toDbSettings(json);

    // Upsert on ID 1
    const { data, error } = await supabase
      .from('settings')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(toUiSettings(data));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
