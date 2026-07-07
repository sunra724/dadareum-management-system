import {
  normalizeEvidenceAttachmentSheet,
  normalizeInspectionSheet,
  normalizePhotoAttachmentSheet,
} from "@/lib/attachment-sheets";
import { createDefaultExpenditureGuidelineFields } from "@/lib/document-defaults";
import {
  deleteExpenditureGuidelineMeta,
  fetchExpenditureGuidelineMeta,
  fetchExpenditureGuidelineMetaMap,
  normalizeExpenditureGuidelineMeta,
  upsertExpenditureGuidelineMeta,
} from "@/lib/db/guideline-metadata";
import { embedExpenditureInlineMeta, extractExpenditureInlineMeta } from "@/lib/db/inline-guideline-meta";
import { resolveExpenditureAmount, withResolvedExpenditureAmount } from "@/lib/expenditure-amount";
import { orderExpendituresForManagement } from "@/lib/expenditure-order";
import {
  batchExpenditureMemory,
  createExpenditureMemory,
  deleteExpenditureMemory,
  getExpenditureMemory,
  listExpendituresMemory,
  reorderExpendituresMemory,
  updateExpenditureMemory,
} from "@/lib/db/memory-store";
import { defaultEvidenceChecklist, normalizePaymentMethod, paymentMethodLabel } from "@/lib/guideline";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import type { Expenditure, ExpenditureInput } from "@/lib/types";

function inferBudgetScope(row: Record<string, unknown>): Expenditure["budget_scope"] {
  const docNumber = String(row.doc_number ?? "");
  if (docNumber.includes("간접")) return "indirect";
  if (docNumber.includes("직접")) return "direct";
  return "direct";
}

function baseGuidelineFallback(row: Record<string, unknown>) {
  const totalAmount = Number(row.total_amount ?? 0);
  const paymentMethod = normalizePaymentMethod(row.payment_method);

  return {
    ...createDefaultExpenditureGuidelineFields(),
    budget_scope: inferBudgetScope(row),
    payment_method: paymentMethod,
    supply_amount: totalAmount,
    eligible_amount: totalAmount,
    evidence_checklist: defaultEvidenceChecklist(paymentMethod),
  };
}

function normalizeExpenditure(row: Record<string, unknown>, meta?: unknown | null): Expenditure {
  const projectName = String(row.project_name ?? "");
  const inline = extractExpenditureInlineMeta(row.items);
  const inlineGuideline = normalizeExpenditureGuidelineMeta(inline.meta, baseGuidelineFallback(row));
  const guideline = normalizeExpenditureGuidelineMeta(meta, inlineGuideline);
  const totalAmount = resolveExpenditureAmount({
    total_amount: Number(row.total_amount ?? 0),
    eligible_amount: guideline.eligible_amount,
    supply_amount: guideline.supply_amount,
    vat_amount: guideline.vat_amount,
    items: inline.items,
  });

  return {
    id: Number(row.id),
    proposal_id: row.proposal_id == null ? null : Number(row.proposal_id),
    doc_number: String(row.doc_number ?? ""),
    project_name: projectName,
    expense_category: String(row.expense_category ?? ""),
    issue_date: String(row.issue_date ?? ""),
    record_date: String(row.record_date ?? ""),
    total_amount: totalAmount,
    payee_address: String(row.payee_address ?? ""),
    payee_company: String(row.payee_company ?? ""),
    payee_name: String(row.payee_name ?? ""),
    receipt_date: String(row.receipt_date ?? ""),
    receipt_name: String(row.receipt_name ?? ""),
    items: inline.items,
    evidence_sheet: normalizeEvidenceAttachmentSheet(row.evidence_sheet, projectName),
    inspection_sheet: normalizeInspectionSheet(
      row.inspection_sheet ?? inline.inspectionSheet,
      projectName,
      inline.items,
    ),
    photo_sheet: normalizePhotoAttachmentSheet(row.photo_sheet, projectName),
    status: (row.status as Expenditure["status"]) ?? "draft",
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    ...guideline,
  };
}

function toExpenditureRow(input: ExpenditureInput, options: { includeInspectionColumn?: boolean } = {}) {
  const normalized = withResolvedExpenditureAmount(input);
  const includeInspectionColumn = options.includeInspectionColumn ?? true;

  return {
    proposal_id: normalized.proposal_id,
    doc_number: normalized.doc_number,
    project_name: normalized.project_name,
    expense_category: normalized.expense_category,
    issue_date: normalized.issue_date || null,
    record_date: normalized.record_date || null,
    total_amount: normalized.total_amount,
    payee_address: normalized.payee_address,
    payee_company: normalized.payee_company,
    payee_name: normalized.payee_name,
    payment_method: paymentMethodLabel(normalized.payment_method),
    receipt_date: normalized.receipt_date || null,
    receipt_name: normalized.receipt_name,
    items: embedExpenditureInlineMeta(normalized.items, normalized),
    evidence_sheet: normalized.evidence_sheet,
    ...(includeInspectionColumn ? { inspection_sheet: normalized.inspection_sheet } : {}),
    photo_sheet: normalized.photo_sheet,
    status: normalized.status,
  };
}

function isMissingInspectionColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message ?? "") : "";
  return message.includes("inspection_sheet");
}

export async function listExpenditures() {
  if (!hasSupabaseEnv()) return listExpendituresMemory();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("expenditures").select("*").order("id", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const metaMap = await fetchExpenditureGuidelineMetaMap(rows.map((row) => Number(row.id)));
  return orderExpendituresForManagement(
    rows.map((row) => normalizeExpenditure(row, metaMap.get(Number(row.id)) ?? null)),
  );
}

export async function getExpenditure(id: number) {
  if (!hasSupabaseEnv()) return getExpenditureMemory(id);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("expenditures").select("*").eq("id", id).single();
  if (error) return null;

  const meta = await fetchExpenditureGuidelineMeta(id);
  return normalizeExpenditure(data, meta);
}

export async function createExpenditure(input: ExpenditureInput) {
  if (!hasSupabaseEnv()) return createExpenditureMemory(withResolvedExpenditureAmount(input));

  const supabase = getSupabaseAdmin();
  const normalizedInput = withResolvedExpenditureAmount(input);
  let { data, error } = await supabase.from("expenditures").insert(toExpenditureRow(normalizedInput)).select("*").single();
  if (error && isMissingInspectionColumnError(error)) {
    const fallback = await supabase
      .from("expenditures")
      .insert(toExpenditureRow(normalizedInput, { includeInspectionColumn: false }))
      .select("*")
      .single();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;

  const created = normalizeExpenditure(data, normalizedInput);
  await upsertExpenditureGuidelineMeta(created.id, normalizedInput);
  return created;
}

export async function updateExpenditure(id: number, input: ExpenditureInput) {
  if (!hasSupabaseEnv()) return updateExpenditureMemory(id, withResolvedExpenditureAmount(input));

  const supabase = getSupabaseAdmin();
  const normalizedInput = withResolvedExpenditureAmount(input);
  let { data, error } = await supabase
    .from("expenditures")
    .update({ ...toExpenditureRow(normalizedInput), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error && isMissingInspectionColumnError(error)) {
    const fallback = await supabase
      .from("expenditures")
      .update({
        ...toExpenditureRow(normalizedInput, { includeInspectionColumn: false }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) return null;

  const updated = normalizeExpenditure(data, normalizedInput);
  await upsertExpenditureGuidelineMeta(id, normalizedInput);
  return updated;
}

export async function deleteExpenditure(id: number) {
  if (!hasSupabaseEnv()) {
    deleteExpenditureMemory(id);
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("expenditures").delete().eq("id", id);
  if (error) throw error;
  await deleteExpenditureGuidelineMeta(id);
}

export async function reorderExpenditures(ids: number[]) {
  const orderedIds = [...new Set(ids.filter(Boolean))];
  if (!orderedIds.length) return listExpenditures();

  if (!hasSupabaseEnv()) {
    reorderExpendituresMemory(orderedIds);
    return listExpendituresMemory();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("expenditures").select("*").in("id", orderedIds);
  if (error) throw error;

  const rows = data ?? [];
  const metaMap = await fetchExpenditureGuidelineMetaMap(rows.map((row) => Number(row.id)));
  const expenditureMap = new Map(
    rows.map((row) => [
      Number(row.id),
      normalizeExpenditure(row, metaMap.get(Number(row.id)) ?? null),
    ]),
  );

  await Promise.all(
    orderedIds.map(async (id, index) => {
      const expenditure = expenditureMap.get(id);
      if (!expenditure) return;

      const orderedExpenditure = { ...expenditure, sort_order: index + 1 };
      const { error: updateError } = await supabase
        .from("expenditures")
        .update({
          items: embedExpenditureInlineMeta(orderedExpenditure.items, orderedExpenditure),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updateError) throw updateError;

      await upsertExpenditureGuidelineMeta(id, orderedExpenditure);
    }),
  );

  return listExpenditures();
}

export async function batchExpenditures(ids: number[]) {
  if (!hasSupabaseEnv()) return batchExpenditureMemory(ids);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("expenditures").select("*").in("id", ids).order("id");
  if (error) throw error;

  const rows = data ?? [];
  const metaMap = await fetchExpenditureGuidelineMetaMap(rows.map((row) => Number(row.id)));
  return orderExpendituresForManagement(
    rows.map((row) => normalizeExpenditure(row, metaMap.get(Number(row.id)) ?? null)),
  );
}
