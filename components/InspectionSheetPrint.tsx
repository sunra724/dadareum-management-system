/* eslint-disable @next/next/no-img-element */
import { countFilledInspectionItems } from "@/lib/attachment-sheets";
import type { Expenditure, InspectionSheet } from "@/lib/types";

export default function InspectionSheetPrint({
  expenditure,
  sheet,
}: {
  expenditure: Expenditure;
  sheet: InspectionSheet;
}) {
  return (
    <div className="print-sheet">
      <div className="mb-6 text-center">
        <div className="mb-2 text-3xl font-bold tracking-[0.18em]">물품·용역 검수 내역서</div>
        <div className="text-sm text-slate-500">{sheet.title}</div>
      </div>

      <section className="mb-5 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 p-4 text-sm">
        <div>결의서 번호: {expenditure.doc_number || `#${expenditure.id}`}</div>
        <div>사업명: {expenditure.project_name || "-"}</div>
        <div>거래처: {expenditure.payee_company || expenditure.receipt_name || "-"}</div>
        <div>검수일: {sheet.inspection_date || "-"}</div>
        <div>검수 장소: {sheet.inspection_place || "-"}</div>
        <div>검수자 성명: {sheet.inspector_name || "-"}</div>
        <div>검수 건수: {countFilledInspectionItems(sheet)}건</div>
        <div>종합 검수결과: {sheet.overall_result || "-"}</div>
      </section>

      <section className="mb-5 rounded-2xl border border-slate-200 p-4 text-sm">
        <div className="mb-2 font-semibold">검수 확인 내용</div>
        <div className="whitespace-pre-wrap">{sheet.submission_note || "-"}</div>
      </section>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            {["번호", "품명", "수량", "사양", "외관(사진)", "검수결과", "비고"].map((label) => (
              <th key={label} className="border border-slate-200 px-3 py-2">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.items.map((item, index) => (
            <tr key={item.id}>
              <td className="w-12 border border-slate-200 px-3 py-2 text-center">{index + 1}</td>
              <td className="border border-slate-200 px-3 py-2">{item.item_name || "-"}</td>
              <td className="w-20 border border-slate-200 px-3 py-2 text-center">{item.quantity || "-"}</td>
              <td className="border border-slate-200 px-3 py-2">{item.specification || "-"}</td>
              <td className="w-44 border border-slate-200 px-3 py-2">
                {item.photo_data_url ? (
                  <img
                    src={item.photo_data_url}
                    alt={item.item_name || `검수 사진 ${index + 1}`}
                    className="max-h-[120px] w-full object-contain"
                  />
                ) : (
                  <div className="grid min-h-[96px] place-items-center border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                    사진 없음
                  </div>
                )}
                <div className="mt-2 whitespace-pre-wrap text-xs text-slate-600">
                  {item.appearance_note || "-"}
                </div>
              </td>
              <td className="w-24 border border-slate-200 px-3 py-2 text-center">
                {item.inspection_result || "-"}
              </td>
              <td className="border border-slate-200 px-3 py-2">{item.note || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm">
        위와 같이 납품 또는 제공받은 물품·용역을 검수하였음을 확인합니다.
      </section>

      <div className="mt-12 flex justify-end">
        <table className="w-80 border-collapse text-sm">
          <tbody>
            <tr>
              <th className="w-28 border border-slate-200 bg-slate-50 px-3 py-3 text-left">검수자 성명</th>
              <td className="border border-slate-200 px-3 py-3">{sheet.inspector_name || ""}</td>
            </tr>
            <tr>
              <th className="border border-slate-200 bg-slate-50 px-3 py-6 text-left">서명</th>
              <td className="border border-slate-200 px-3 py-6">(서명)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
