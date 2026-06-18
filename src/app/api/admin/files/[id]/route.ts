import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

const SUPPORTED_ENTITY_TABLES = {
  product: 'product_files',
  sale: 'sale_files',
} as const;

type SupportedEntity = keyof typeof SUPPORTED_ENTITY_TABLES;

function normalizeEntity(value: string | null): SupportedEntity {
  return value === 'sale' ? 'sale' : 'product';
}

function getPublicStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'printh3d-files';
}

function getPrivateStorageBucket() {
  return process.env.SUPABASE_PRIVATE_STORAGE_BUCKET || 'printh3d-private';
}

function extractStorageLocation(storagePath: string | null) {
  const match = storagePath?.match(/\/object\/public\/([^/]+)\/(.+)$/);
  return match
    ? { bucket: match[1], objectPath: decodeURIComponent(match[2]) }
    : null;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const fileId = Number((await params).id);
    if (!Number.isInteger(fileId) || fileId <= 0) {
      return NextResponse.json({ error: 'Arquivo inválido.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const entity = normalizeEntity(searchParams.get('entity'));
    const table = SUPPORTED_ENTITY_TABLES[entity];
    const supabase = getAdminSupabase();

    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select(
        'id, storage_path, storage_bucket, storage_object_path, is_public',
      )
      .eq('id', fileId)
      .single();

    if (fetchError || !record) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado.' },
        { status: 404 },
      );
    }

    const legacyLocation = extractStorageLocation(record.storage_path);
    const bucket =
      record.storage_bucket ||
      legacyLocation?.bucket ||
      (record.is_public
        ? getPublicStorageBucket()
        : getPrivateStorageBucket());
    const objectPath =
      record.storage_object_path || legacyLocation?.objectPath || null;

    if (objectPath) {
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([objectPath]);
      if (storageError) throw storageError;
    }

    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('id', fileId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao remover arquivo.',
      },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';
