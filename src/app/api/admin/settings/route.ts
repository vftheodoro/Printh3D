import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

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
    
    // Return defaults if not initialized
    if (!data) {
       return NextResponse.json({
         id: 1,
         margem_padrao: 100, // 100% markup
         custo_kg: 100,      // R$ 100/kg
         custo_hora_maquina: 2, // R$ 2/h depreciation
         custo_kwh: 0.95,    // R$ 0.95/kWh
         consumo_maquina_w: 150, // 150W typical
         percentual_falha: 10,   // 10%
         depreciacao_percentual: 5 // 5%
       });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE global calculation settings
export async function PUT(request: Request) {
  try {
    const json = await request.json();
    const supabase = getAdminSupabase();

    // Upsert on ID 1
    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...json })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
