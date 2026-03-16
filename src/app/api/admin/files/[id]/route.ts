import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

const SUPPORTED_ENTITY_TABLES = {
  product: 'product_files',
  sale: 'sale_files',
} as const;

type SupportedEntity = keyof typeof SUPPORTED_ENTITY_TABLES;

function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || 'printh3d-files';
}

function normalizeEntity(value: string | null): SupportedEntity {
  if (value === 'sale') return 'sale';
  return 'product';
}

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  if (!publicUrl) return null;
  const marker = `/object/public/${bucket}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return null;
  return decodeURIComponent(publicUrl.slice(markerIndex + marker.length));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const entity = normalizeEntity(searchParams.get('entity'));

    const table = SUPPORTED_ENTITY_TABLES[entity];
    const supabase = getAdminSupabase();

    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select('id, storage_path')
      .eq('id', Number(id))
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('id', Number(id));

    if (deleteError) throw deleteError;

    const bucket = getStorageBucket();
    const storagePath = extractStoragePath(record.storage_path, bucket);
    if (storagePath) {
      await supabase.storage.from(bucket).remove([storagePath]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao remover arquivo.' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
