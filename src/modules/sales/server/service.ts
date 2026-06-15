import "server-only";

import { getAdminSupabase } from "@/lib/supabase";
import type { SaleInput } from "@/modules/sales/schemas";

function normalizeName(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function resolveClientId(input: SaleInput) {
  if (input.cliente_id) return input.cliente_id;

  const supabase = getAdminSupabase();
  const normalizedInput = normalizeName(input.cliente);
  const { data: candidates, error } = await supabase
    .from("clients")
    .select("id, nome")
    .ilike("nome", `%${input.cliente}%`)
    .limit(20);

  if (error) throw error;

  const exactMatch = candidates?.find(
    (client) => normalizeName(String(client.nome)) === normalizedInput,
  );
  if (exactMatch) return Number(exactMatch.id);

  const { data: created, error: createError } = await supabase
    .from("clients")
    .insert([{ nome: input.cliente }])
    .select("id")
    .single();

  if (createError) throw createError;
  return Number(created.id);
}

export async function saveSale(
  input: SaleInput,
  actorId: number,
  saleId?: number,
) {
  const supabase = getAdminSupabase();
  const clienteId = await resolveClientId(input);
  const { data, error } = await supabase.rpc("admin_save_sale", {
    p_payload: {
      ...input,
      cliente_id: clienteId,
      vendedor_id: actorId,
      data_venda: new Date(input.data_venda).toISOString(),
    },
    p_sale_id: saleId ?? null,
  });

  if (error) throw error;
  return data;
}

export async function deleteSale(saleId: number) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.rpc("admin_delete_sale_to_trash", {
    p_sale_id: saleId,
  });
  if (error) throw error;
}
