import type { Proposal } from "@/lib/types";

type YearMonth = {
  year: number;
  month: number;
};

const numericYearMonthPattern = /(\d{4})\s*[./-]\s*(0?[1-9]|1[0-2])/u;
const namedMonthPattern = /(?:(\d{4})\s*\uB144\s*)?(0?[1-9]|1[0-2])\s*\uC6D4/u;
const documentDatePattern = /(?:^|[^\d])(\d{2})-(0[1-9]|1[0-2])([0-3]\d)(?:[^\d]|$)/u;

function toYearMonthKey(value: YearMonth | null) {
  return value ? value.year * 100 + value.month : 0;
}

function toSortableYearMonthKey(value: YearMonth | null) {
  return value ? toYearMonthKey(value) : Number.MAX_SAFE_INTEGER;
}

function parseDateYearMonth(value?: string | null): YearMonth | null {
  const match = String(value ?? "").match(/^(\d{4})-(0?[1-9]|1[0-2])/u);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

function fallbackYear(proposal: Proposal) {
  return (
    parseDateYearMonth(proposal.planned_payment_date)?.year ??
    parseDateYearMonth(proposal.submission_date)?.year ??
    parseDateYearMonth(proposal.created_at)?.year ??
    new Date().getFullYear()
  );
}

function extractYearMonthFromText(text: string, yearFallback: number): YearMonth | null {
  const numericMatch = text.match(numericYearMonthPattern);
  if (numericMatch) {
    return {
      year: Number(numericMatch[1]),
      month: Number(numericMatch[2]),
    };
  }

  const namedMatch = text.match(namedMonthPattern);
  if (!namedMatch) return null;

  return {
    year: namedMatch[1] ? Number(namedMatch[1]) : yearFallback,
    month: Number(namedMatch[2]),
  };
}

function extractDocumentYearMonth(docNumber: string, yearFallback: number): YearMonth | null {
  const match = docNumber.match(documentDatePattern);
  if (!match) return null;

  const fallbackCentury = Math.floor(yearFallback / 100) * 100;
  return {
    year: fallbackCentury + Number(match[1]),
    month: Number(match[2]),
  };
}

function proposalBusinessText(proposal: Proposal) {
  return [
    proposal.budget_category,
    proposal.budget_item,
    proposal.related_plan,
    proposal.vendor_name,
    proposal.transfer_note,
    ...proposal.items.flatMap((item) => [
      item.expense_category,
      item.description,
      item.calculation_basis,
      item.note,
    ]),
  ].join(" ");
}

function proposalYearMonth(proposal: Proposal) {
  const yearFallback = fallbackYear(proposal);

  return (
    extractYearMonthFromText(proposalBusinessText(proposal), yearFallback) ??
    parseDateYearMonth(proposal.planned_payment_date) ??
    parseDateYearMonth(proposal.submission_date) ??
    extractDocumentYearMonth(proposal.doc_number, yearFallback) ??
    parseDateYearMonth(proposal.created_at)
  );
}

function dateKey(value?: string | null) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/u);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(`${match[1]}${match[2]}${match[3]}`);
}

function compareProposalsByBusinessMonth(a: Proposal, b: Proposal) {
  const monthDiff = toSortableYearMonthKey(proposalYearMonth(a)) - toSortableYearMonthKey(proposalYearMonth(b));
  if (monthDiff !== 0) return monthDiff;

  const dateDiff =
    dateKey(a.planned_payment_date) - dateKey(b.planned_payment_date) ||
    dateKey(a.submission_date) - dateKey(b.submission_date) ||
    dateKey(a.created_at) - dateKey(b.created_at);
  if (dateDiff !== 0) return dateDiff;

  return a.id - b.id;
}

export function compareProposalsForManagement(a: Proposal, b: Proposal) {
  if (a.sort_order > 0 || b.sort_order > 0) {
    const aOrder = a.sort_order > 0 ? a.sort_order : Number.MAX_SAFE_INTEGER;
    const bOrder = b.sort_order > 0 ? b.sort_order : Number.MAX_SAFE_INTEGER;
    const orderDiff = aOrder - bOrder;
    if (orderDiff !== 0) return orderDiff;
  }

  return compareProposalsByBusinessMonth(a, b);
}

export function orderProposalsForManagement(proposals: Proposal[]) {
  return proposals.slice().sort(compareProposalsForManagement);
}

export function orderProposalsByBusinessMonth(proposals: Proposal[]) {
  return proposals.slice().sort(compareProposalsByBusinessMonth);
}
