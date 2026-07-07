import { today } from "@/lib/format";
import type {
  EvidenceAttachmentItem,
  EvidenceAttachmentSheet,
  EvidenceDocumentType,
  ExpenditureItem,
  InspectionSheet,
  InspectionSheetItem,
  PhotoAttachmentItem,
  PhotoAttachmentSheet,
} from "@/lib/types";

export const evidenceDocumentTypeOptions: { value: EvidenceDocumentType; label: string }[] = [
  { value: "card_slip", label: "카드 전표" },
  { value: "tax_invoice", label: "세금계산서" },
  { value: "cash_receipt", label: "현금영수증" },
  { value: "receipt", label: "영수증" },
  { value: "transaction_statement", label: "거래명세서" },
  { value: "other", label: "기타" },
];

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

export function evidenceTypeLabel(type: EvidenceDocumentType) {
  return evidenceDocumentTypeOptions.find((option) => option.value === type)?.label ?? "기타";
}

export function createEvidenceAttachmentItem(): EvidenceAttachmentItem {
  return {
    id: makeId("evidence"),
    evidence_type: "receipt",
    title: "",
    issuer: "",
    issued_on: today(),
    amount: 0,
    related_item: "",
    file_note: "",
    note: "",
    attachment_name: "",
    attachment_data_url: "",
    attachment_mime_type: "",
  };
}

export function createPhotoAttachmentItem(): PhotoAttachmentItem {
  return {
    id: makeId("photo"),
    title: "",
    shot_date: today(),
    location: "",
    description: "",
    related_item: "",
    file_note: "",
    note: "",
    images: [],
  };
}

export function createInspectionSheetItem(item?: Partial<ExpenditureItem>): InspectionSheetItem {
  return {
    id: makeId("inspection"),
    item_name: item?.description ?? "",
    quantity: item?.description ? "1식" : "",
    specification: item?.note ?? "",
    appearance_note: "",
    inspection_result: "적합",
    note: "",
    photo_name: "",
    photo_data_url: "",
  };
}

export function createEvidenceAttachmentSheet(projectName = ""): EvidenceAttachmentSheet {
  return {
    title: projectName ? `${projectName} 증빙서류 첨부철` : "증빙서류 첨부철",
    submission_note: "",
    items: [createEvidenceAttachmentItem()],
  };
}

export function createInspectionSheet(projectName = "", items: ExpenditureItem[] = []): InspectionSheet {
  return {
    title: projectName ? `${projectName} 물품·용역 검수 내역서` : "물품·용역 검수 내역서",
    inspection_date: today(),
    inspection_place: "",
    inspector_name: "",
    overall_result: "적합",
    submission_note: "물품 또는 용역을 납품(제공)받은 이후 검수한 내역입니다.",
    items: items.length ? items.map((item) => createInspectionSheetItem(item)) : [createInspectionSheetItem()],
  };
}

export function createPhotoAttachmentSheet(projectName = ""): PhotoAttachmentSheet {
  return {
    title: projectName ? `${projectName} 증빙사진 첨부철` : "증빙사진 첨부철",
    submission_note: "",
    items: [createPhotoAttachmentItem()],
  };
}

export function normalizeInspectionSheet(
  value: unknown,
  projectName = "",
  expenditureItems: ExpenditureItem[] = [],
): InspectionSheet {
  const record = asRecord(value);
  const items = Array.isArray(record.items)
    ? record.items.map((entry) => {
        const item = asRecord(entry);
        return {
          id: asText(item.id) || makeId("inspection"),
          item_name: asText(item.item_name),
          quantity: asText(item.quantity),
          specification: asText(item.specification),
          appearance_note: asText(item.appearance_note),
          inspection_result: asText(item.inspection_result) || "적합",
          note: asText(item.note),
          photo_name: asText(item.photo_name),
          photo_data_url: asText(item.photo_data_url),
        };
      })
    : [];

  const fallback = createInspectionSheet(projectName, expenditureItems);
  return {
    title: asText(record.title) || fallback.title,
    inspection_date: asText(record.inspection_date) || fallback.inspection_date,
    inspection_place: asText(record.inspection_place),
    inspector_name: asText(record.inspector_name),
    overall_result: asText(record.overall_result) || fallback.overall_result,
    submission_note: asText(record.submission_note) || fallback.submission_note,
    items: items.length ? items : fallback.items,
  };
}

export function normalizeEvidenceAttachmentSheet(value: unknown, projectName = ""): EvidenceAttachmentSheet {
  const record = asRecord(value);
  const items = Array.isArray(record.items)
    ? record.items.map((entry) => {
        const item = asRecord(entry);
        const type = asText(item.evidence_type) as EvidenceDocumentType;
        return {
          id: asText(item.id) || makeId("evidence"),
          evidence_type: evidenceDocumentTypeOptions.some((option) => option.value === type) ? type : "receipt",
          title: asText(item.title),
          issuer: asText(item.issuer),
          issued_on: asText(item.issued_on),
          amount: asNumber(item.amount),
          related_item: asText(item.related_item),
          file_note: asText(item.file_note),
          note: asText(item.note),
          attachment_name: asText(item.attachment_name),
          attachment_data_url: asText(item.attachment_data_url),
          attachment_mime_type: asText(item.attachment_mime_type),
        };
      })
    : [];

  const fallback = createEvidenceAttachmentSheet(projectName);
  return {
    title: asText(record.title) || fallback.title,
    submission_note: asText(record.submission_note),
    items: items.length ? items : fallback.items,
  };
}

export function normalizePhotoAttachmentSheet(value: unknown, projectName = ""): PhotoAttachmentSheet {
  const record = asRecord(value);
  const items = Array.isArray(record.items)
    ? record.items.map((entry) => {
        const item = asRecord(entry);
        const images = Array.isArray(item.images)
          ? item.images
              .map((imageEntry) => {
                const image = asRecord(imageEntry);
                return {
                  name: asText(image.name),
                  data_url: asText(image.data_url),
                };
              })
              .filter((image) => image.name || image.data_url)
              .slice(0, 2)
          : [];

        const legacyName = asText(item.image_name);
        const legacyDataUrl = asText(item.image_data_url);
        const normalizedImages =
          images.length > 0
            ? images
            : legacyName || legacyDataUrl
              ? [{ name: legacyName, data_url: legacyDataUrl }]
              : [];

        return {
          id: asText(item.id) || makeId("photo"),
          title: asText(item.title),
          shot_date: asText(item.shot_date),
          location: asText(item.location),
          description: asText(item.description),
          related_item: asText(item.related_item),
          file_note: asText(item.file_note),
          note: asText(item.note),
          images: normalizedImages,
        };
      })
    : [];

  const fallback = createPhotoAttachmentSheet(projectName);
  return {
    title: asText(record.title) || fallback.title,
    submission_note: asText(record.submission_note),
    items: items.length ? items : fallback.items,
  };
}

export function countFilledInspectionItems(sheet: InspectionSheet) {
  return sheet.items.filter(
    (item) =>
      item.item_name ||
      item.quantity ||
      item.specification ||
      item.appearance_note ||
      item.note ||
      item.photo_name ||
      item.photo_data_url,
  ).length;
}

export function countFilledEvidenceItems(sheet: EvidenceAttachmentSheet) {
  return sheet.items.filter(
    (item) =>
      item.title ||
      item.issuer ||
      item.amount ||
      item.related_item ||
      item.file_note ||
      item.note ||
      item.attachment_name ||
      item.attachment_data_url,
  ).length;
}

export function countFilledPhotoItems(sheet: PhotoAttachmentSheet) {
  return sheet.items.filter(
    (item) =>
      item.title ||
      item.location ||
      item.description ||
      item.related_item ||
      item.file_note ||
      item.note ||
      item.images.some((image) => image.name || image.data_url),
  ).length;
}
