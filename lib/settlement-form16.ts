import ExcelJS from "exceljs";
import path from "node:path";
import { listAllExpenditureYouthAllocations, listProjectYouths, getProjectBudgetSetup } from "@/lib/db/dadareum";
import { listExpenditures } from "@/lib/db/expenditures";
import { listOrganizations } from "@/lib/db/organizations";
import type {
  BudgetCategory,
  Expenditure,
  ExpenditureYouthAllocation,
  Organization,
  ProjectBudgetSetup,
  ProjectYouth,
} from "@/lib/types";

const TEMPLATE_PATH = path.join(process.cwd(), "templates", "settlement", "form16.xlsx");
const MAIN_DIRECT_CATEGORY = "자립지원                - 교육훈련";
const RELIEF_DIRECT_CATEGORY = "기타                      - 애로사항";

type SettlementWorkbookResult = {
  buffer: Buffer;
  filename: string;
};

type BudgetAmounts = {
  agreed: number;
  revised: number;
};

type DirectDetailRow = {
  evidenceNo: number;
  date: string;
  category: string;
  vendor: string;
  youthName: string;
  description: string;
  paymentMethod: string;
  amount: number;
  note: string;
};

type IndirectRoute = "payroll" | "operations" | "travel" | "business" | "otherPay";

type IndirectDetailRow = {
  evidenceNo: number;
  date: string;
  subtype: string;
  vendor: string;
  target: string;
  destination: string;
  attendeeCount: number | null;
  description: string;
  paymentMethod: string;
  amount: number;
  note: string;
};

function getWorksheet(workbook: ExcelJS.Workbook, name: string) {
  const worksheet = workbook.getWorksheet(name);
  if (!worksheet) throw new Error(`Missing settlement worksheet: ${name}`);
  return worksheet;
}

function setCell(worksheet: ExcelJS.Worksheet, address: string, value: ExcelJS.CellValue | undefined) {
  worksheet.getCell(address).value = value ?? null;
}

function clearCells(worksheet: ExcelJS.Worksheet, startRow: number, endRow: number, columns: string[]) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (const column of columns) {
      worksheet.getCell(`${column}${row}`).value = null;
    }
  }
}

function cellValue(value: number | string | null | undefined): ExcelJS.CellValue {
  if (typeof value === "number") return value || null;
  return value?.toString().trim() || null;
}

function setBudgetRow(worksheet: ExcelJS.Worksheet, row: number, amounts: BudgetAmounts) {
  setCell(worksheet, `E${row}`, amounts.agreed || null);
  setCell(worksheet, `F${row}`, amounts.revised && amounts.revised !== amounts.agreed ? amounts.revised : null);
}

function textIncludesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getCategoryContext(
  expenditure: Pick<Expenditure, "budget_category_id" | "budget_category" | "budget_item" | "expense_category">,
  categoryById: Map<number, BudgetCategory>,
) {
  const category = expenditure.budget_category_id ? categoryById.get(expenditure.budget_category_id) ?? null : null;
  const parent = category?.parent_id ? categoryById.get(category.parent_id) ?? null : null;
  const combinedText = [
    category?.code,
    category?.name,
    parent?.code,
    parent?.name,
    expenditure.budget_category,
    expenditure.budget_item,
    expenditure.expense_category,
  ]
    .filter(Boolean)
    .join(" ");

  return { category, parent, combinedText };
}

function getExecutionAmount(expenditure: Expenditure) {
  return Number(expenditure.eligible_amount || expenditure.total_amount || 0);
}

function getVendor(expenditure: Expenditure) {
  return expenditure.payee_company || expenditure.receipt_name || expenditure.payee_name || "";
}

function getTarget(expenditure: Expenditure) {
  return expenditure.payee_name || expenditure.payee_company || expenditure.receipt_name || "";
}

function getDescription(expenditure: Expenditure) {
  const itemDescriptions = expenditure.items
    .map((item) => item.description)
    .filter(Boolean)
    .join(" / ");
  return itemDescriptions || expenditure.expense_category || expenditure.budget_item || "";
}

function getPaymentMethodText(expenditure: Expenditure) {
  return expenditure.payment_method === "corporate_card" ? "카드" : "계좌이체";
}

function getDateText(expenditure: Expenditure) {
  return expenditure.record_date || expenditure.issue_date || expenditure.receipt_date || "";
}

function getBaseNote(expenditure: Expenditure, extra?: string) {
  return [expenditure.doc_number, extra].filter(Boolean).join(" / ");
}

function isFinalizedProjectExpenditure(expenditure: Expenditure, projectId: number) {
  return expenditure.project_id === projectId && expenditure.status === "finalized";
}

function resolveDirectTemplateCategory(expenditure: Expenditure, categoryById: Map<number, BudgetCategory>) {
  const { combinedText } = getCategoryContext(expenditure, categoryById);

  if (textIncludesAny(combinedText, ["DIRECT.MAKER.PROGRAM", "공동운영"])) {
    return "제작소특화프로그램 - 공동운영프로그램";
  }
  if (textIncludesAny(combinedText, ["DIRECT.MAKER.MENTORING", "멘토"])) {
    return "제작소특화프로그램 - 멘토링";
  }
  if (textIncludesAny(combinedText, ["DIRECT.MAKER.LECTURE", "강의", "특강"])) {
    return "제작소특화프로그램 - 강의(특강) 등";
  }
  if (textIncludesAny(combinedText, ["DIRECT.MAKER.OPERATIONS", "소그룹", "커뮤니티", "부대"])) {
    return "제작소특화프로그램 - 소그룹 커뮤니티";
  }
  if (textIncludesAny(combinedText, ["DIRECT.SELF.CAREER", "진로"])) {
    return "자기발견                - 진로설계";
  }
  if (textIncludesAny(combinedText, ["DIRECT.SELF.MENTAL", "마음", "상담"])) {
    return "자기발견                - 마음건강";
  }
  if (textIncludesAny(combinedText, ["DIRECT.SOCIAL", "인턴"])) {
    return "자립지원                - 인턴쉽";
  }
  if (textIncludesAny(combinedText, ["애로사항"])) {
    return RELIEF_DIRECT_CATEGORY;
  }

  return MAIN_DIRECT_CATEGORY;
}

function resolveSummaryBudgetRow(
  category: BudgetCategory,
  parent: BudgetCategory | null,
) {
  const text = [category.code, category.name, parent?.code, parent?.name].filter(Boolean).join(" ");

  if (category.budget_scope === "direct") return category.level === 1 ? 8 : null;
  if (textIncludesAny(text, ["기타직보수", "OTHER_PAY", "OTHERPAY"])) return 41;
  if (textIncludesAny(text, ["보수", "인건비", "INDIRECT.PAY"])) return 33;
  if (textIncludesAny(text, ["홍보", "PROMO"])) return 35;
  if (textIncludesAny(text, ["공공", "제세", "PUBLIC", "UTILITY"])) return 36;
  if (textIncludesAny(text, ["특근", "매식", "MEAL"])) return 37;
  if (textIncludesAny(text, ["여비", "출장", "TRAVEL"])) return 38;
  if (textIncludesAny(text, ["회의", "MEETING"])) return 40;
  if (textIncludesAny(text, ["업무추진", "사업추진", "INDIRECT.BIZ"])) return 39;
  if (textIncludesAny(text, ["일반운영", "일반수용", "INDIRECT.OPS"])) return 34;
  if (textIncludesAny(text, ["기타사항", "기타"])) return 42;
  return null;
}

function getLineCategory(
  setup: ProjectBudgetSetup,
  categoryId: number,
) {
  return setup.categories.find((category) => category.id === categoryId) ?? null;
}

function fillSummarySheet(
  workbook: ExcelJS.Workbook,
  setup: ProjectBudgetSetup,
  organization: Organization | null,
) {
  const summary = getWorksheet(workbook, "사업비 사용실적 명세서");
  setCell(summary, "D3", organization?.name || "");

  clearCells(summary, 8, 23, ["E", "F", "S"]);
  clearCells(summary, 33, 44, ["E", "F"]);
  clearCells(summary, 82, 96, ["E", "G", "J", "M", "N"]);

  const byRow = new Map<number, BudgetAmounts>();
  const directRoot = setup.lines.find((line) => {
    const category = getLineCategory(setup, line.budget_category_id);
    return category?.code === "DIRECT" || (category?.budget_scope === "direct" && category.level === 1);
  });

  const directAgreed =
    directRoot?.agreed_amount || setup.settings.direct_budget_total || setup.project?.direct_budget_total || 0;
  const directRevised = directRoot?.revised_amount || directAgreed;
  byRow.set(8, { agreed: directAgreed, revised: directRevised });

  for (const line of setup.lines) {
    const category = getLineCategory(setup, line.budget_category_id);
    if (!category || category.budget_scope === "direct") continue;

    const parent = category.parent_id ? getLineCategory(setup, category.parent_id) : null;
    const row = resolveSummaryBudgetRow(category, parent);
    if (!row) continue;

    const existing = byRow.get(row) ?? { agreed: 0, revised: 0 };
    byRow.set(row, {
      agreed: existing.agreed + Number(line.agreed_amount || 0),
      revised: existing.revised + Number(line.revised_amount || line.agreed_amount || 0),
    });
  }

  for (const [row, amounts] of byRow.entries()) {
    setBudgetRow(summary, row, amounts);
  }
}

function buildDirectRows(
  expenditures: Expenditure[],
  allocations: ExpenditureYouthAllocation[],
  youths: ProjectYouth[],
  categoryById: Map<number, BudgetCategory>,
) {
  const youthById = new Map(youths.map((youth) => [youth.id, youth]));
  const allocationsByExpenditureId = new Map<number, ExpenditureYouthAllocation[]>();

  for (const allocation of allocations) {
    allocationsByExpenditureId.set(allocation.expenditure_id, [
      ...(allocationsByExpenditureId.get(allocation.expenditure_id) ?? []),
      allocation,
    ]);
  }

  const rows: DirectDetailRow[] = [];

  for (const expenditure of expenditures) {
    const expenditureAllocations = allocationsByExpenditureId.get(expenditure.id) ?? [];
    const baseCategory = resolveDirectTemplateCategory(expenditure, categoryById);

    if (expenditureAllocations.length) {
      for (const allocation of expenditureAllocations) {
        const youth = youthById.get(allocation.youth_id);
        rows.push({
          evidenceNo: rows.length + 1,
          date: getDateText(expenditure),
          category: allocation.allocation_kind === "relief" ? RELIEF_DIRECT_CATEGORY : baseCategory,
          vendor: getVendor(expenditure),
          youthName: youth?.display_name || "",
          description: getDescription(expenditure),
          paymentMethod: getPaymentMethodText(expenditure),
          amount: Number(allocation.allocated_amount || 0),
          note: getBaseNote(expenditure, allocation.allocation_note),
        });
      }
    } else {
      rows.push({
        evidenceNo: rows.length + 1,
        date: getDateText(expenditure),
        category: baseCategory,
        vendor: getVendor(expenditure),
        youthName: "",
        description: getDescription(expenditure),
        paymentMethod: getPaymentMethodText(expenditure),
        amount: getExecutionAmount(expenditure),
        note: getBaseNote(expenditure),
      });
    }
  }

  return rows;
}

function fillDirectSheet(workbook: ExcelJS.Workbook, rows: DirectDetailRow[]) {
  const worksheet = getWorksheet(workbook, "직접비-역량강화지원금");
  clearCells(worksheet, 8, Math.max(320, rows.length + 8), ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]);

  rows.forEach((row, index) => {
    const rowNumber = 8 + index;
    setCell(worksheet, `B${rowNumber}`, { formula: `CONCATENATE(E${rowNumber},G${rowNumber})` });
    setCell(worksheet, `C${rowNumber}`, row.evidenceNo);
    setCell(worksheet, `D${rowNumber}`, cellValue(row.date));
    setCell(worksheet, `E${rowNumber}`, cellValue(row.category));
    setCell(worksheet, `F${rowNumber}`, cellValue(row.vendor));
    setCell(worksheet, `G${rowNumber}`, cellValue(row.youthName));
    setCell(worksheet, `H${rowNumber}`, cellValue(row.description));
    setCell(worksheet, `I${rowNumber}`, cellValue(row.paymentMethod));
    setCell(worksheet, `J${rowNumber}`, row.amount || null);
    setCell(worksheet, `K${rowNumber}`, cellValue(row.note));
  });
}

function fillYouthSheet(
  workbook: ExcelJS.Workbook,
  youths: ProjectYouth[],
  setup: ProjectBudgetSetup,
) {
  const worksheet = getWorksheet(workbook, "참여청년현황");
  clearCells(worksheet, 5, Math.max(26, youths.length + 5), ["B", "C", "D", "E", "I", "K"]);

  youths.slice(0, setup.settings.max_youth_count || 20).forEach((youth, index) => {
    const rowNumber = 5 + index;
    setCell(worksheet, `B${rowNumber}`, youth.serial_no || index + 1);
    setCell(worksheet, `C${rowNumber}`, youth.display_name);
    setCell(worksheet, `D${rowNumber}`, null);
    setCell(worksheet, `E${rowNumber}`, setup.settings.per_youth_main_limit);
    setCell(worksheet, `I${rowNumber}`, RELIEF_DIRECT_CATEGORY);
    setCell(worksheet, `K${rowNumber}`, setup.settings.per_youth_relief_limit);
  });
}

function resolveIndirectRoute(expenditure: Expenditure, categoryById: Map<number, BudgetCategory>): IndirectRoute {
  const { combinedText } = getCategoryContext(expenditure, categoryById);

  if (textIncludesAny(combinedText, ["기타직보수", "OTHER_PAY", "OTHERPAY"])) return "otherPay";
  if (textIncludesAny(combinedText, ["여비", "출장", "TRAVEL"])) return "travel";
  if (textIncludesAny(combinedText, ["업무추진", "사업추진", "회의", "INDIRECT.BIZ"])) return "business";
  if (textIncludesAny(combinedText, ["보수", "인건비", "급여", "INDIRECT.PAY"])) return "payroll";
  return "operations";
}

function resolveOperationsSubtype(expenditure: Expenditure, categoryById: Map<number, BudgetCategory>) {
  const { combinedText } = getCategoryContext(expenditure, categoryById);
  if (textIncludesAny(combinedText, ["홍보", "PROMO"])) return "일반수용비(홍보비)";
  if (textIncludesAny(combinedText, ["공공", "제세", "PUBLIC", "UTILITY"])) return "공공요금 및 제세";
  if (textIncludesAny(combinedText, ["특근", "매식", "MEAL"])) return "특근매식비";
  return "일반수용비(홍보비 외)";
}

function resolveBusinessSubtype(expenditure: Expenditure, categoryById: Map<number, BudgetCategory>) {
  const { combinedText } = getCategoryContext(expenditure, categoryById);
  return textIncludesAny(combinedText, ["회의", "MEETING"]) ? "회의비" : "사업추진비";
}

function buildIndirectRows(expenditures: Expenditure[], categoryById: Map<number, BudgetCategory>) {
  const rows: Record<IndirectRoute, IndirectDetailRow[]> = {
    payroll: [],
    operations: [],
    travel: [],
    business: [],
    otherPay: [],
  };

  for (const expenditure of expenditures) {
    const route = resolveIndirectRoute(expenditure, categoryById);
    const detailRow: IndirectDetailRow = {
      evidenceNo: rows[route].length + 1,
      date: getDateText(expenditure),
      subtype:
        route === "operations"
          ? resolveOperationsSubtype(expenditure, categoryById)
          : route === "business"
            ? resolveBusinessSubtype(expenditure, categoryById)
            : "",
      vendor: getVendor(expenditure),
      target: getTarget(expenditure),
      destination: "",
      attendeeCount: expenditure.attendee_count || null,
      description: getDescription(expenditure),
      paymentMethod: getPaymentMethodText(expenditure),
      amount: getExecutionAmount(expenditure),
      note: getBaseNote(expenditure),
    };

    rows[route].push(detailRow);
  }

  return rows;
}

function fillPayrollSheet(workbook: ExcelJS.Workbook, rows: IndirectDetailRow[]) {
  const worksheet = getWorksheet(workbook, "간접비-보수");
  clearCells(worksheet, 5, 5, ["B", "C", "D", "E", "F"]);
  clearCells(worksheet, 14, Math.max(45, rows.length + 14), ["B", "C", "D", "E", "H", "I", "J"]);

  rows.forEach((row, index) => {
    const rowNumber = 14 + index;
    setCell(worksheet, `B${rowNumber}`, row.evidenceNo);
    setCell(worksheet, `C${rowNumber}`, cellValue(row.date));
    setCell(worksheet, `D${rowNumber}`, cellValue(row.target));
    setCell(worksheet, `E${rowNumber}`, cellValue(row.description));
    setCell(worksheet, `H${rowNumber}`, cellValue(row.paymentMethod));
    setCell(worksheet, `I${rowNumber}`, row.amount || null);
    setCell(worksheet, `J${rowNumber}`, cellValue(row.note));
  });
}

function fillOperationsSheet(workbook: ExcelJS.Workbook, rows: IndirectDetailRow[]) {
  const worksheet = getWorksheet(workbook, "간접비-일반운영비");
  clearCells(worksheet, 21, Math.max(163, rows.length + 21), ["B", "C", "D", "E", "F", "I", "J", "K"]);

  rows.forEach((row, index) => {
    const rowNumber = 21 + index;
    setCell(worksheet, `B${rowNumber}`, row.evidenceNo);
    setCell(worksheet, `C${rowNumber}`, cellValue(row.date));
    setCell(worksheet, `D${rowNumber}`, cellValue(row.subtype));
    setCell(worksheet, `E${rowNumber}`, cellValue(row.vendor));
    setCell(worksheet, `F${rowNumber}`, cellValue(row.description));
    setCell(worksheet, `I${rowNumber}`, cellValue(row.paymentMethod));
    setCell(worksheet, `J${rowNumber}`, row.amount || null);
    setCell(worksheet, `K${rowNumber}`, cellValue(row.note));
  });
}

function fillTravelSheet(workbook: ExcelJS.Workbook, rows: IndirectDetailRow[]) {
  const worksheet = getWorksheet(workbook, "간접비-여비");
  clearCells(worksheet, 8, Math.max(47, rows.length + 8), ["B", "C", "D", "E", "F", "G", "H", "I"]);

  rows.forEach((row, index) => {
    const rowNumber = 8 + index;
    setCell(worksheet, `B${rowNumber}`, row.evidenceNo);
    setCell(worksheet, `C${rowNumber}`, cellValue(row.date));
    setCell(worksheet, `D${rowNumber}`, cellValue(row.target));
    setCell(worksheet, `E${rowNumber}`, cellValue(row.destination));
    setCell(worksheet, `F${rowNumber}`, cellValue(row.description));
    setCell(worksheet, `G${rowNumber}`, cellValue(row.paymentMethod));
    setCell(worksheet, `H${rowNumber}`, row.amount || null);
    setCell(worksheet, `I${rowNumber}`, cellValue(row.note));
  });
}

function fillBusinessSheet(workbook: ExcelJS.Workbook, rows: IndirectDetailRow[]) {
  const worksheet = getWorksheet(workbook, "간접비-업무추진비");
  clearCells(worksheet, 10, Math.max(48, rows.length + 10), ["B", "C", "D", "E", "F", "G", "H", "I"]);

  rows.forEach((row, index) => {
    const rowNumber = 10 + index;
    setCell(worksheet, `B${rowNumber}`, row.evidenceNo);
    setCell(worksheet, `C${rowNumber}`, cellValue(row.date));
    setCell(worksheet, `D${rowNumber}`, cellValue(row.subtype));
    setCell(worksheet, `E${rowNumber}`, row.attendeeCount);
    setCell(worksheet, `F${rowNumber}`, cellValue(row.vendor));
    setCell(worksheet, `G${rowNumber}`, cellValue(row.description));
    setCell(worksheet, `H${rowNumber}`, cellValue(row.paymentMethod));
    setCell(worksheet, `I${rowNumber}`, row.amount || null);
    setCell(worksheet, `J${rowNumber}`, { formula: `IFERROR(IF((I${rowNumber})/E${rowNumber}>30000,"한도초과","OK"),"-")` });
  });
}

function fillOtherPaySheet(workbook: ExcelJS.Workbook, rows: IndirectDetailRow[]) {
  const worksheet = getWorksheet(workbook, "간접비-기타직보수");
  clearCells(worksheet, 8, Math.max(39, rows.length + 8), ["B", "C", "D", "E", "H", "I", "J"]);

  rows.forEach((row, index) => {
    const rowNumber = 8 + index;
    setCell(worksheet, `B${rowNumber}`, row.evidenceNo);
    setCell(worksheet, `C${rowNumber}`, cellValue(row.date));
    setCell(worksheet, `D${rowNumber}`, cellValue(row.target));
    setCell(worksheet, `E${rowNumber}`, cellValue(row.description));
    setCell(worksheet, `H${rowNumber}`, cellValue(row.paymentMethod));
    setCell(worksheet, `I${rowNumber}`, row.amount || null);
    setCell(worksheet, `J${rowNumber}`, cellValue(row.note));
  });
}

function fillIndirectSheets(workbook: ExcelJS.Workbook, rows: Record<IndirectRoute, IndirectDetailRow[]>) {
  fillPayrollSheet(workbook, rows.payroll);
  fillOperationsSheet(workbook, rows.operations);
  fillTravelSheet(workbook, rows.travel);
  fillBusinessSheet(workbook, rows.business);
  fillOtherPaySheet(workbook, rows.otherPay);
}

function buildFilename(setup: ProjectBudgetSetup) {
  const projectCode = setup.project?.code || `project-${setup.settings.project_id || "unknown"}`;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `서식16_사업비정산보고_${projectCode}_${today}.xlsx`;
}

export async function buildSettlementForm16Workbook(projectId?: number | null): Promise<SettlementWorkbookResult> {
  const setup = await getProjectBudgetSetup(projectId);
  if (!setup.project) throw new Error("정산보고서를 만들 프로젝트가 없습니다.");

  const [organizations, allExpenditures, youths, allocations] = await Promise.all([
    listOrganizations(),
    listExpenditures(),
    listProjectYouths(setup.project.id),
    listAllExpenditureYouthAllocations(),
  ]);

  const organization = organizations.find((item) => item.id === setup.project?.organization_id) ?? null;
  const categoryById = new Map(setup.categories.map((category) => [category.id, category]));
  const projectExpenditures = allExpenditures.filter((expenditure) =>
    isFinalizedProjectExpenditure(expenditure, setup.project!.id),
  );
  const projectExpenditureIds = new Set(projectExpenditures.map((expenditure) => expenditure.id));
  const projectAllocations = allocations.filter((allocation) => projectExpenditureIds.has(allocation.expenditure_id));
  const directRows = buildDirectRows(
    projectExpenditures.filter((expenditure) => expenditure.budget_scope === "direct"),
    projectAllocations,
    youths,
    categoryById,
  );
  const indirectRows = buildIndirectRows(
    projectExpenditures.filter((expenditure) => expenditure.budget_scope === "indirect"),
    categoryById,
  );

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
  workbook.calcProperties.fullCalcOnLoad = true;

  fillSummarySheet(workbook, setup, organization);
  fillDirectSheet(workbook, directRows);
  fillYouthSheet(workbook, youths, setup);
  fillIndirectSheets(workbook, indirectRows);

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
    filename: buildFilename(setup),
  };
}
