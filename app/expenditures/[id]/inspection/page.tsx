import Link from "next/link";
import InspectionSheetEditor from "@/components/InspectionSheetEditor";
import { getExpenditure } from "@/lib/db/expenditures";

export default async function InspectionSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expenditure = await getExpenditure(Number(id));
  if (!expenditure) {
    return (
      <section className="panel mx-auto max-w-3xl px-6 py-8">
        <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Inspection Sheet</div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">검수 내역서를 찾지 못했습니다.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          요청한 결의서 번호 #{id}가 현재 데이터에 없어서 검수 내역서를 열 수 없습니다.
          지출결의서 목록에서 해당 결의서의 검수 버튼으로 다시 열어 주세요.
        </p>
        <div className="mt-6">
          <Link className="btn btn-primary" href="/expenditures">
            지출결의서 목록으로
          </Link>
        </div>
      </section>
    );
  }

  return <InspectionSheetEditor expenditure={expenditure} />;
}
