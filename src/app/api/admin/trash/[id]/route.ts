import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

interface TrashedFile {
  storage_path?: string;
  storage_bucket?: string;
  storage_object_path?: string;
  is_public?: boolean;
}

function extractStorageLocation(storagePath: string | undefined) {
  const match = storagePath?.match(/\/object\/public\/([^/]+)\/(.+)$/);
  return match
    ? { bucket: match[1], objectPath: decodeURIComponent(match[2]) }
    : null;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const trashId = Number((await params).id);
    if (!Number.isInteger(trashId) || trashId <= 0) {
      return NextResponse.json({ error: 'Item inválido.' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data: item, error: fetchError } = await supabase
      .from('trash')
      .select('payload')
      .eq('id', trashId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: 'Item não encontrado.' },
        { status: 404 },
      );
    }

    const payload = item.payload as { files?: TrashedFile[] } | null;
    const files = Array.isArray(payload?.files) ? payload.files : [];
    const objectsByBucket = new Map<string, string[]>();

    for (const file of files) {
      const legacy = extractStorageLocation(file.storage_path);
      const bucket =
        file.storage_bucket ||
        legacy?.bucket ||
        (file.is_public
          ? process.env.SUPABASE_STORAGE_BUCKET || 'printh3d-files'
          : process.env.SUPABASE_PRIVATE_STORAGE_BUCKET || 'printh3d-private');
      const objectPath =
        file.storage_object_path || legacy?.objectPath || null;
      if (!objectPath) continue;

      const objectPaths = objectsByBucket.get(bucket) || [];
      objectPaths.push(objectPath);
      objectsByBucket.set(bucket, objectPaths);
    }

    for (const [bucket, objectPaths] of objectsByBucket) {
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove(objectPaths);
      if (storageError) throw storageError;
    }

    const { error } = await supabase.from('trash').delete().eq('id', trashId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao remover item permanentemente.',
      },
      { status: 500 },
    );
  }
}
