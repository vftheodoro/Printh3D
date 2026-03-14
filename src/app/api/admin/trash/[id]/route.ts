import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getAdminSupabase();
    
    // Hard delete permanently
    const { error } = await supabase.from('trash').delete().eq('id', id);
    
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
