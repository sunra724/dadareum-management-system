import type { Expenditure } from "@/lib/types";

type YearMonth = {
  year: number;
  month: number;
};

const numericYearMonthPattern = /(\d{4})\s*[./-]\s*(0?[1-9]|1[0-2])/u;
const namedMonthPattern = /(?:(\d{4})\s*\uB144\s*)?(0?[1-9]|1[0-2])\s*\uC6D4/u;
const documentDatePattern = /(?:^|[^\d])(\d{2})-(0[1-9]|1[0-2])([0-3]\d)(?:[^\d]|$)/u;

function toYearMonthKey(value: YearMonth | null) {
  return value ? value.year * 100 + value.month : Number.MAX_SAFE_INTEGER;
}

function parseDateYearMonth(value?: string | null): YearMonth | null {
  const match = String(value ?? "").match(/^(\d{4})-(0?[1-9]|1[0-2])/u);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

function fallbackYear(expenditure: Expenditure) {
  return (
    parseDateYearMonth(expenditure.issue_date)?.year ??
    parseDateYearMonth(expenditure.record_date)?.year ??
    parseDateYearMonth(expenditure.receipt_date)?.year ??
    parseDateYearMonth(expenditure.created_at)?.year ??
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

function expenditureBusinessText(expenditure: Expenditure) {
  return [
    expenditure.expense_category,
    expenditure.budget_category,
    expenditure.budget_item,
    expenditure.payee_company,
    expenditure.payee_name,
    expenditure.receipt_name,
    ...expenditure.items.flatMap((item) => [item.description, item.note]),
  ].join(" ");
}

function expenditureYearMonth(expenditure: Expenditure) {
  const yearFallback = fallbackYear(expenditure);

  return (
    extractYearMonthFromText(expenditureBusinessText(expenditure), yearFallback) ??
    parseDateYearMonth(expenditure.issue_date) ??
    parseDateYearMonth(expenditure.record_date) ??
    parseDateYearMonth(expenditure.receipt_date) ??
    extractDocumentYearMonth(expenditure.doc_number, yearFallback) ??
    parseDateYearMonth(expenditure.created_at)
  );
}

function dateKey(value?: string | null) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/u);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(`${match[1]}${match[2]}${match[3]}`);
}

function compareExpendituresByBusinessDate(a: Expenditure, b: Expenditure) {
  const monthDiff = toYearMonthKey(expenditureYearMonth(a)) - toYearMonthKey(expenditureYearMonth(b));
  if (monthDiff !== 0) return monthDiff;

  const dateDiff =
    dateKey(a.issue_date) - dateKey(b.issue_date) ||
    dateKey(a.record_date) - dateKey(b.record_date) ||
    dateKey(a.receipt_date) - dateKey(b.receipt_date) ||
    dateKey(a.created_at) - dateKey(b.created_at);
  if (dateDiff !== 0) return dateDiff;

  return a.id - b.id;
}

export function compareExpendituresForManagement(a: Expenditure, b: Expenditure) {
  if (a.sort_order > 0 || b.sort_order > 0) {
    const aOrder = a.sort_order > 0 ? a.sort_order : Number.MAX_SAFE_INTEGER;
    const bOrder = b.sort_order > 0 ? b.sort_order : Number.MAX_SAFE_INTEGER;
    const orderDiff = aOrder - bOrder;
    if (orderDiff !== 0) return orderDiff;
  }

  return compareExpendituresByBusinessDate(a, b);
}

export function orderExpendituresForManagement(expenditures: Expenditure[]) {
  return expenditures.slice().sort(compareExpendituresForManagement);
}

export function orderExpendituresByBusinessDate(expenditures: Expenditure[]) {
  return expenditures.slice().sort(compareExpendituresByBusinessDate);
}
