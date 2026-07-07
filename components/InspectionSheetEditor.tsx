/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ImagePlus, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import InspectionSheetPrint from "@/components/InspectionSheetPrint";
import PrintButton from "@/components/PrintButton";
import {
  countFilledInspectionItems,
  createInspectionSheetItem,
  getInspectionItemPhotos,
  INSPECTION_PHOTO_LIMIT,
} from "@/lib/attachment-sheets";
import { convertImageFileToDataUrl } from "@/lib/browser-image";
import type { Expenditure, InspectionSheet } from "@/lib/types";

const resultOptions = ["적합", "부분 적합", "부적합", "보완 필요"];

type ReusablePhoto = {
  id: string;
  label: string;
  name: string;
  dataUrl: string;
};

type InspectionItem = InspectionSheet["items"][number];
type InspectionPhoto = InspectionItem["photos"][number];

function withInspectionPhotos(item: InspectionItem, photos: InspectionPhoto[]): InspectionItem {
  const normalizedPhotos = photos
    .filter((photo) => photo.name || photo.data_url)
    .slice(0, INSPECTION_PHOTO_LIMIT);
  const primaryPhoto = normalizedPhotos[0] ?? { name: "", data_url: "" };

  return {
    ...item,
    photo_name: primaryPhoto.name,
    photo_data_url: primaryPhoto.data_url,
    photos: normalizedPhotos,
  };
}

export default function InspectionSheetEditor({ expenditure }: { expenditure: Expenditure }) {
  const [sheet, setSheet] = useState<InspectionSheet>(expenditure.inspection_sheet);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const reusablePhotos = useMemo<ReusablePhoto[]>(
    () =>
      expenditure.photo_sheet.items.flatMap((photoItem, photoItemIndex) =>
        photoItem.images
          .filter((image) => image.data_url)
          .map((image, imageIndex) => {
            const title = photoItem.title || photoItem.related_item || `증빙사진 ${photoItemIndex + 1}`;
            const name = image.name || `${title} ${imageIndex + 1}`;
            return {
              id: `${photoItem.id}-${imageIndex}`,
              label: `${title}${photoItem.images.length > 1 ? ` ${imageIndex + 1}` : ""}`,
              name,
              dataUrl: image.data_url,
            };
          }),
      ),
    [expenditure.photo_sheet.items],
  );

  function updateItem(index: number, key: keyof InspectionSheet["items"][number], value: string) {
    setSheet((current) => {
      const items = [...current.items];
      items[index] = { ...items[index], [key]: value };
      return { ...current, items };
    });
  }

  async function uploadImage(index: number, files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) return;

    const currentPhotos = getInspectionItemPhotos(sheet.items[index]);
    const remainingSlots = INSPECTION_PHOTO_LIMIT - currentPhotos.length;
    if (remainingSlots <= 0) {
      setMessage(`검수 사진은 항목당 최대 ${INSPECTION_PHOTO_LIMIT}장까지 첨부할 수 있습니다.`);
      return;
    }

    const filesToAdd = selectedFiles.slice(0, remainingSlots);

    try {
      const photosToAdd = await Promise.all(
        filesToAdd.map(async (file) => ({
          name: file.name,
          data_url: await convertImageFileToDataUrl(file),
        })),
      );

      setSheet((current) => {
        const items = [...current.items];
        const photos = [...getInspectionItemPhotos(items[index]), ...photosToAdd];
        items[index] = withInspectionPhotos(items[index], photos);
        return { ...current, items };
      });

      const skippedCount = selectedFiles.length - filesToAdd.length;
      setMessage(
        skippedCount
          ? `검수 사진 ${filesToAdd.length}장을 반영했습니다. 항목당 최대 ${INSPECTION_PHOTO_LIMIT}장까지만 저장됩니다.`
          : `검수 사진 ${filesToAdd.length}장을 반영했습니다. 저장을 누르면 실제로 보관됩니다.`,
      );
    } catch {
      setMessage("검수 사진을 불러오지 못했습니다. 다른 이미지로 다시 시도해 주세요.");
    }
  }

  function removePhoto(index: number, photoIndex: number) {
    setSheet((current) => {
      const items = [...current.items];
      const photos = getInspectionItemPhotos(items[index]).filter(
        (_, currentPhotoIndex) => currentPhotoIndex !== photoIndex,
      );
      items[index] = withInspectionPhotos(items[index], photos);
      return { ...current, items };
    });
  }

  function reusePhoto(index: number, photoId: string) {
    const photo = reusablePhotos.find((item) => item.id === photoId);
    if (!photo) return;

    const currentPhotos = getInspectionItemPhotos(sheet.items[index]);
    if (currentPhotos.length >= INSPECTION_PHOTO_LIMIT) {
      setMessage(`검수 사진은 항목당 최대 ${INSPECTION_PHOTO_LIMIT}장까지 첨부할 수 있습니다.`);
      return;
    }

    setSheet((current) => {
      const items = [...current.items];
      const photos = [
        ...getInspectionItemPhotos(items[index]),
        { name: photo.name, data_url: photo.dataUrl },
      ];
      items[index] = withInspectionPhotos(items[index], photos);
      return { ...current, items };
    });
    setMessage("증빙사진 첨부지의 사진을 검수 품목에 반영했습니다. 저장을 누르면 실제로 보관됩니다.");
  }

  function fillEmptyImagesFromPhotoSheet() {
    if (!reusablePhotos.length) {
      setMessage("재사용할 증빙사진이 없습니다. 증빙사진 첨부지에 사진을 먼저 저장해 주세요.");
      return;
    }

    let appliedCount = 0;
    const items = sheet.items.map((item) => {
      const photos = getInspectionItemPhotos(item);
      const remainingSlots = INSPECTION_PHOTO_LIMIT - photos.length;
      if (remainingSlots <= 0) return item;

      const photosToAdd = reusablePhotos
        .slice(appliedCount, appliedCount + remainingSlots)
        .map((photo) => ({ name: photo.name, data_url: photo.dataUrl }));
      if (!photosToAdd.length) return item;

      appliedCount += photosToAdd.length;
      return withInspectionPhotos(item, [...photos, ...photosToAdd]);
    });

    if (!appliedCount) {
      setMessage("비어 있는 검수 사진 칸이 없습니다.");
      return;
    }

    setSheet({ ...sheet, items });

    setMessage(`증빙사진 ${appliedCount}장을 빈 검수 사진 칸에 반영했습니다. 저장을 누르면 실제로 보관됩니다.`);
  }

  function removeItem(index: number) {
    setSheet((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function refillFromExpenditureItems() {
    setSheet((current) => ({
      ...current,
      items: expenditure.items.length
        ? expenditure.items.map((item) => createInspectionSheetItem(item))
        : [createInspectionSheetItem()],
    }));
  }

  function saveSheet() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/expenditures/${expenditure.id}/attachments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspection_sheet: sheet }),
      });

      if (!response.ok) {
        setMessage("검수 내역서 저장에 실패했습니다.");
        return;
      }

      const updated = (await response.json()) as Expenditure;
      setSheet(updated.inspection_sheet);
      setMessage("검수 내역서를 저장했습니다.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
        <section className="panel px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-500">
                Inspection Sheet
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl">물품·용역 검수 내역서</h1>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <div>연결 결의서: {expenditure.doc_number || `#${expenditure.id}`}</div>
                <div>사업명: {expenditure.project_name || "-"}</div>
                <div>품명, 수량, 사양, 외관 사진, 검수일, 결과, 검수자 성명을 기록합니다.</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-secondary" href={`/preview/${expenditure.id}`}>
                결의서 보기
              </Link>
              <Link className="btn btn-secondary" href={`/expenditures/${expenditure.id}/evidence`}>
                증빙서류
              </Link>
              <Link className="btn btn-secondary" href={`/expenditures/${expenditure.id}/photos`}>
                사진
              </Link>
              <button className="btn btn-primary" onClick={saveSheet} disabled={isPending}>
                <Save className="h-4 w-4" />
                {isPending ? "저장 중..." : "저장"}
              </button>
              <PrintButton label="검수서 인쇄" documentTitle={sheet.title} />
            </div>
          </div>
        </section>

        <section className="panel px-6 py-6">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="block text-sm md:col-span-2">
              첨부지 제목
              <input
                className="field mt-2"
                value={sheet.title}
                onChange={(event) => setSheet((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className="block text-sm">
              검수일
              <input
                className="field mt-2"
                type="date"
                value={sheet.inspection_date}
                onChange={(event) =>
                  setSheet((current) => ({ ...current, inspection_date: event.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              종합 검수결과
              <select
                className="select mt-2"
                value={sheet.overall_result}
                onChange={(event) =>
                  setSheet((current) => ({ ...current, overall_result: event.target.value }))
                }
              >
                {resultOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              검수 장소
              <input
                className="field mt-2"
                value={sheet.inspection_place}
                onChange={(event) =>
                  setSheet((current) => ({ ...current, inspection_place: event.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              검수자 성명
              <input
                className="field mt-2"
                value={sheet.inspector_name}
                onChange={(event) =>
                  setSheet((current) => ({ ...current, inspector_name: event.target.value }))
                }
              />
            </label>
            <div className="rounded-2xl bg-slate-100 px-4 py-4 text-sm">
              <div className="text-slate-500">검수 건수</div>
              <div className="mt-2 text-2xl font-semibold">{countFilledInspectionItems(sheet)}건</div>
            </div>
            <button className="btn btn-secondary self-end" onClick={refillFromExpenditureItems}>
              <RefreshCw className="h-4 w-4" />
              지출내역 불러오기
            </button>
            <button className="btn btn-secondary self-end" onClick={fillEmptyImagesFromPhotoSheet}>
              <ImagePlus className="h-4 w-4" />
              증빙사진 채우기
            </button>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium text-slate-700">검수 확인 내용</span>
            <textarea
              className="textarea"
              value={sheet.submission_note}
              onChange={(event) =>
                setSheet((current) => ({ ...current, submission_note: event.target.value }))
              }
            />
          </label>
        </section>

        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold">검수 품목</div>
              <div className="mt-1 text-sm text-slate-500">
                납품받은 물품 또는 제공받은 용역 단위로 검수 항목을 남깁니다.
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() =>
                setSheet((current) => ({
                  ...current,
                  items: [...current.items, createInspectionSheetItem()],
                }))
              }
            >
              <Plus className="h-4 w-4" />
              검수 품목 추가
            </button>
          </div>

          <div className="grid gap-4 px-6 py-6">
            {sheet.items.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white/75 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600">검수 품목 {index + 1}</div>
                  <button className="btn btn-danger !px-3 !py-2" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="btn btn-secondary cursor-pointer !px-3 !py-2">
                        <ImagePlus className="h-4 w-4" />
                        사진 선택
                        <input
                          className="hidden"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => {
                            uploadImage(index, event.target.files);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                      {reusablePhotos.length ? (
                        <select
                          className="select min-h-0 w-full max-w-[220px] !px-3 !py-2 text-sm"
                          defaultValue=""
                          onChange={(event) => {
                            reusePhoto(index, event.target.value);
                            event.currentTarget.value = "";
                          }}
                        >
                          <option value="">증빙사진에서 선택</option>
                          {reusablePhotos.map((photo) => (
                            <option key={photo.id} value={photo.id}>
                              {photo.label}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      <div className="text-xs text-slate-500">
                        {getInspectionItemPhotos(item).length}/{INSPECTION_PHOTO_LIMIT}장
                      </div>
                    </div>
                    {getInspectionItemPhotos(item).length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {getInspectionItemPhotos(item).map((photo, photoIndex) => (
                          <div
                            key={`${item.id}-inspection-photo-${photoIndex}`}
                            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                          >
                            <div className="relative grid aspect-[4/3] place-items-center bg-slate-50">
                              <img
                                src={photo.data_url}
                                alt={item.item_name || `검수 사진 ${index + 1}-${photoIndex + 1}`}
                                className="h-full w-full object-contain"
                              />
                              <button
                                className="absolute right-1 top-1 rounded bg-white/90 p-1 text-rose-600 shadow-sm"
                                onClick={() => removePhoto(index, photoIndex)}
                                title="사진 제거"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="truncate px-2 py-1 text-[11px] text-slate-500">
                              {photo.name || `검수 사진 ${photoIndex + 1}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400">
                        외관 사진 업로드 영역
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-sm">
                      품명
                      <input
                        className="field mt-2"
                        value={item.item_name}
                        onChange={(event) => updateItem(index, "item_name", event.target.value)}
                      />
                    </label>
                    <label className="block text-sm">
                      수량
                      <input
                        className="field mt-2"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, "quantity", event.target.value)}
                        placeholder="예: 1식, 3개"
                      />
                    </label>
                    <label className="block text-sm">
                      사양
                      <input
                        className="field mt-2"
                        value={item.specification}
                        onChange={(event) => updateItem(index, "specification", event.target.value)}
                        placeholder="모델명, 규격, 계약 사양 등"
                      />
                    </label>
                    <label className="block text-sm">
                      검수결과
                      <select
                        className="select mt-2"
                        value={item.inspection_result}
                        onChange={(event) => updateItem(index, "inspection_result", event.target.value)}
                      >
                        {resultOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm md:col-span-2">
                      외관 확인 내용
                      <textarea
                        className="textarea mt-2"
                        value={item.appearance_note}
                        onChange={(event) => updateItem(index, "appearance_note", event.target.value)}
                        placeholder="파손, 누락, 설치 상태, 제공 완료 여부 등"
                      />
                    </label>
                    <label className="block text-sm md:col-span-2">
                      비고
                      <textarea
                        className="textarea mt-2"
                        value={item.note}
                        onChange={(event) => updateItem(index, "note", event.target.value)}
                        placeholder="추가 검수 메모"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
      </div>

      <InspectionSheetPrint expenditure={expenditure} sheet={sheet} />
    </div>
  );
}
