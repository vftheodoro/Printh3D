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

function getEntityColumn(entity: SupportedEntity): string {
  return entity === 'sale' ? 'sale_id' : 'product_id';
}

function inferFileType(fileName: string, mimeType: string): 'image' | 'document' | 'other' {
  const lowerName = fileName.toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  if (lowerMime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(lowerName)) {
    return 'image';
  }
  if (lowerMime.includes('pdf') || /\.(pdf|doc|docx|txt|xls|xlsx)$/.test(lowerName)) {
    return 'document';
  }
  // Arquivos de modelo 3D, compactados e outros tipos vão como 'other'
  // (ex: .stl, .obj, .3mf, .step, .stp, .rar, .zip)
  return 'other';
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = normalizeEntity(searchParams.get('entity'));
    const entityId = searchParams.get('entity_id') || searchParams.get(`${entity}_id`);

    if (!entityId) {
      return NextResponse.json({ error: 'Parâmetro entity_id é obrigatório.' }, { status: 400 });
    }

    const table = SUPPORTED_ENTITY_TABLES[entity];
    const entityColumn = getEntityColumn(entity);

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(entityColumn, Number(entityId))
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao listar arquivos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const entity = normalizeEntity(String(formData.get('entity') || 'product'));
    const entityIdRaw = formData.get('entity_id') || formData.get(`${entity}_id`);
    const file = formData.get('file');

    if (!entityIdRaw) {
      return NextResponse.json({ error: 'Parâmetro entity_id é obrigatório.' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo inválido.' }, { status: 400 });
    }

    const entityId = Number(entityIdRaw);
    if (!Number.isFinite(entityId) || entityId <= 0) {
      return NextResponse.json({ error: 'entity_id inválido.' }, { status: 400 });
    }

    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: 'Arquivo excede o limite de 50MB.' }, { status: 400 });
    }

    const safeFileName = sanitizeFileName(file.name || 'arquivo');
    const mimeType = file.type || 'application/octet-stream';
    const tipo = inferFileType(safeFileName, mimeType);

    const ext = safeFileName.includes('.') ? safeFileName.split('.').pop() : '';
    const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext ? `.${ext}` : ''}`;
    const storagePath = `${entity}s/${entityId}/${uniqueName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const supabase = getAdminSupabase();
    const bucket = getStorageBucket();

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || 'Falha no upload para o storage.');
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
    const table = SUPPORTED_ENTITY_TABLES[entity];
    const entityColumn = getEntityColumn(entity);

    const payload: Record<string, unknown> = {
      nome_arquivo: file.name,
      tipo,
      mime_type: mimeType,
      tamanho_bytes: file.size,
      storage_path: publicUrl,
    };
    payload[entityColumn] = entityId;

    let insertResult = await supabase
      .from(table)
      .insert([payload])
      .select('*')
      .single();

    let { data, error } = insertResult;

    if (error) {
      const isPrimaryKeyCollision = error?.code === '23505' && (error?.message || '').includes(`${table}_pkey`);
      if (isPrimaryKeyCollision) {
        const { data: lastRow } = await supabase
          .from(table)
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        const fallbackId = Number(lastRow?.id || 0) + 1;
        const retryResult = await supabase
          .from(table)
          .insert([{ ...payload, id: fallbackId }])
          .select('*')
          .single();

        if (retryResult.error) {
          await supabase.storage.from(bucket).remove([storagePath]);
          throw retryResult.error;
        }

        data = retryResult.data;
        error = null;
      } else {
        await supabase.storage.from(bucket).remove([storagePath]);
        throw error;
      }
    }

    if (!data || error) {
      await supabase.storage.from(bucket).remove([storagePath]);
      throw new Error('Falha ao registrar arquivo no banco de dados.');
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao enviar arquivo.' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
