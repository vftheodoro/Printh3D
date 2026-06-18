import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getAdminSupabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

const ENTITY_CONFIG = {
  product: {
    filesTable: "product_files",
    ownerTable: "products",
    ownerColumn: "product_id",
  },
  sale: {
    filesTable: "sale_files",
    ownerTable: "sales",
    ownerColumn: "sale_id",
  },
} as const;

type FileCategory = "image" | "document" | "model";

const FILE_RULES: Record<
  string,
  { category: FileCategory; mimeTypes: readonly string[]; maxBytes: number }
> = {
  jpg: {
    category: "image",
    mimeTypes: ["image/jpeg"],
    maxBytes: 10 * 1024 * 1024,
  },
  jpeg: {
    category: "image",
    mimeTypes: ["image/jpeg"],
    maxBytes: 10 * 1024 * 1024,
  },
  png: {
    category: "image",
    mimeTypes: ["image/png"],
    maxBytes: 10 * 1024 * 1024,
  },
  webp: {
    category: "image",
    mimeTypes: ["image/webp"],
    maxBytes: 10 * 1024 * 1024,
  },
  pdf: {
    category: "document",
    mimeTypes: ["application/pdf"],
    maxBytes: 25 * 1024 * 1024,
  },
  txt: {
    category: "document",
    mimeTypes: ["text/plain", "application/octet-stream"],
    maxBytes: 5 * 1024 * 1024,
  },
  stl: {
    category: "model",
    mimeTypes: [
      "model/stl",
      "application/sla",
      "application/vnd.ms-pki.stl",
      "application/octet-stream",
    ],
    maxBytes: 50 * 1024 * 1024,
  },
  obj: {
    category: "model",
    mimeTypes: ["model/obj", "text/plain", "application/octet-stream"],
    maxBytes: 50 * 1024 * 1024,
  },
  "3mf": {
    category: "model",
    mimeTypes: [
      "model/3mf",
      "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
      "application/octet-stream",
      "application/zip",
    ],
    maxBytes: 50 * 1024 * 1024,
  },
  step: {
    category: "model",
    mimeTypes: ["model/step", "application/step", "application/octet-stream"],
    maxBytes: 50 * 1024 * 1024,
  },
  stp: {
    category: "model",
    mimeTypes: ["model/step", "application/step", "application/octet-stream"],
    maxBytes: 50 * 1024 * 1024,
  },
  zip: {
    category: "model",
    mimeTypes: ["application/zip", "application/x-zip-compressed"],
    maxBytes: 50 * 1024 * 1024,
  },
};

function normalizeEntity(value: FormDataEntryValue | string | null) {
  return value === "sale" ? "sale" : "product";
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 180);
}

function getExtension(fileName: string) {
  return fileName.toLowerCase().split(".").pop() || "";
}

function hasValidSignature(extension: string, buffer: Buffer) {
  if (extension === "jpg" || extension === "jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (extension === "png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  if (extension === "webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (extension === "pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  if (extension === "zip" || extension === "3mf") {
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  }
  return buffer.length > 0;
}

function getPublicStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "printh3d-files";
}

function getPrivateStorageBucket() {
  return process.env.SUPABASE_PRIVATE_STORAGE_BUCKET || "printh3d-private";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = normalizeEntity(searchParams.get("entity"));
    const entityId = Number(
      searchParams.get("entity_id") || searchParams.get(`${entity}_id`),
    );

    if (!Number.isInteger(entityId) || entityId <= 0) {
      return apiError("INVALID_ENTITY_ID", "Informe um registro válido.", 400);
    }

    const config = ENTITY_CONFIG[entity];
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(config.filesTable)
      .select("*")
      .eq(config.ownerColumn, entityId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const records = Array.isArray(data) ? data : [];
    const resolvedRecords = await Promise.all(
      records.map(async (record) => {
        if (record.is_public !== false) return record;

        const bucket = record.storage_bucket || getPrivateStorageBucket();
        const objectPath =
          record.storage_object_path || record.storage_path || null;
        if (!objectPath) return record;

        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrl(objectPath, 10 * 60);

        return signed?.signedUrl
          ? { ...record, storage_path: signed.signedUrl }
          : record;
      }),
    );

    return NextResponse.json(resolvedRecords);
  } catch (error: unknown) {
    logger.error("Failed to list files.", {
      action: "files.list",
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      "FILES_LIST_FAILED",
      "Não foi possível carregar os arquivos.",
      500,
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let uploadedStoragePath: string | null = null;
  let uploadedBucket: string | null = null;

  try {
    const formData = await request.formData();
    const entity = normalizeEntity(formData.get("entity"));
    const entityId = Number(
      formData.get("entity_id") || formData.get(`${entity}_id`),
    );
    const file = formData.get("file");

    if (!Number.isInteger(entityId) || entityId <= 0) {
      return apiError("INVALID_ENTITY_ID", "Informe um registro válido.", 400);
    }
    if (!(file instanceof File)) {
      return apiError("INVALID_FILE", "Selecione um arquivo válido.", 400);
    }

    const safeFileName = sanitizeFileName(file.name || "arquivo");
    const extension = getExtension(safeFileName);
    const rule = FILE_RULES[extension];

    if (!rule) {
      return apiError(
        "UNSUPPORTED_FILE_TYPE",
        "Formato não permitido. Use imagens JPG, PNG ou WebP; PDF, TXT; ou modelos STL, OBJ, 3MF, STEP e ZIP.",
        400,
      );
    }
    if (file.size <= 0 || file.size > rule.maxBytes) {
      return apiError(
        "INVALID_FILE_SIZE",
        `O arquivo excede o limite de ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`,
        400,
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!rule.mimeTypes.includes(mimeType)) {
      return apiError(
        "INVALID_FILE_MIME",
        "O conteúdo declarado não corresponde ao formato permitido.",
        400,
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidSignature(extension, fileBuffer)) {
      return apiError(
        "INVALID_FILE_SIGNATURE",
        "A assinatura do arquivo não corresponde ao formato informado.",
        400,
      );
    }

    const config = ENTITY_CONFIG[entity];
    const supabase = getAdminSupabase();
    const { count, error: ownerError } = await supabase
      .from(config.ownerTable)
      .select("id", { count: "exact", head: true })
      .eq("id", entityId);

    if (ownerError) throw ownerError;
    if (!count) {
      return apiError(
        "ENTITY_NOT_FOUND",
        "O registro relacionado não existe.",
        404,
      );
    }

    const uniqueName = `${crypto.randomUUID()}.${extension}`;
    const storagePath = `${entity}s/${entityId}/${uniqueName}`;
    uploadedStoragePath = storagePath;
    const isPublic = entity === "product" && rule.category === "image";
    const bucket = isPublic
      ? getPublicStorageBucket()
      : getPrivateStorageBucket();
    uploadedBucket = bucket;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: rule.category === "image" ? "31536000" : "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const canonicalStoragePath = isPublic
      ? supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
      : storagePath;

    const payload: Record<string, unknown> = {
      nome_arquivo: file.name,
      tipo: rule.category === "model" ? "model3d" : rule.category,
      mime_type: mimeType,
      tamanho_bytes: file.size,
      storage_path: canonicalStoragePath,
      storage_bucket: bucket,
      storage_object_path: storagePath,
      is_public: isPublic,
      [config.ownerColumn]: entityId,
    };

    const { data, error } = await supabase
      .from(config.filesTable)
      .insert([payload])
      .select("*")
      .single();

    if (error) throw error;

    logger.info("File uploaded.", {
      requestId,
      actorId: Number(request.headers.get("x-admin-user-id")) || undefined,
      action: "files.upload",
      resource: entity,
      resourceId: entityId,
      extension,
      size: file.size,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    if (uploadedStoragePath && uploadedBucket) {
      const supabase = getAdminSupabase();
      await supabase.storage
        .from(uploadedBucket)
        .remove([uploadedStoragePath]);
    }

    logger.error("Failed to upload file.", {
      requestId,
      action: "files.upload",
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      "FILE_UPLOAD_FAILED",
      "Não foi possível enviar o arquivo.",
      500,
    );
  }
}

export const runtime = "nodejs";
