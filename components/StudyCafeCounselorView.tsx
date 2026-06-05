/* eslint-disable @next/next/no-img-element */
import CounselorSignOutButton from "@/components/CounselorSignOutButton";
import { formatCurrency } from "@/lib/format";
import { AlertTriangle, BarChart3, ClipboardCheck, Coins, UsersRound, WalletCards } from "lucide-react";
import type {
  DadareumDashboard,
  DadareumDashboardYouthRow,
  StudyCafeCheckin,
  StudyCafeCheckinStatus,
} from "@/lib/types";

const statusLabels: Record<StudyCafeCheckinStatus, string> = {
  pending: "확인 대기",
  approved: "승인",
  rejected: "반려",
};

const statusStyles: Record<StudyCafeCheckinStatus, string> = {
  pending: "badge-draft",
  approved: "badge-finalized",
  rejected: "bg-red-50 text-red-700",
};

function formatDateTime(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRate(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const rate = Math.min(100, Math.max(0, formatRate(value, total)));

  return (
    <div className="h-2 w-full overflow-hidden rounded bg-slate-200">
      <div className="h-full rounded bg-teal-700" style={{ width: `${rate}%` }} />
    </div>
  );
}

function getYouthUsageState(row: DadareumDashboardYouthRow, mainLimit: number) {
  if (row.status === "unassigned") {
    return {
      label: "배정 필요",
      className: "bg-amber-50 text-amber-800",
    };
  }
  if (row.mainRemaining < 0) {
    return {
      label: "한도 초과",
      className: "bg-red-50 text-red-700",
    };
  }
  if (mainLimit && formatRate(row.mainUsed, mainLimit) < 50) {
    return {
      label: "사용 촉진",
      className: "bg-amber-50 text-amber-800",
    };
  }
  return {
    label: "정상",
    className: "bg-emerald-50 text-emerald-700",
  };
}

function SectionLabel({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof BarChart3;
}) {
  return (
    <div className="flex flex-col gap-3 border-l-4 border-teal-700 pl-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">{eyebrow}</div>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <Icon className="hidden h-7 w-7 text-teal-700 md:block" />
    </div>
  );
}

export default function StudyCafeCounselorView({
  checkins,
  dashboard,
}: {
  checkins: StudyCafeCheckin[];
  dashboard: DadareumDashboard;
}) {
  const pendingCount = checkins.filter((checkin) => checkin.status === "pending").length;
  const approvedCount = checkins.filter((checkin) => checkin.status === "approved").length;
  const directRate = formatRate(
    dashboard.totals.directExecutedTotal,
    dashboard.totals.directBudgetTotal,
  );
  const directYouthRows = dashboard.youthRows.filter((row) => row.status !== "unassigned");
  const directYouthCount = directYouthRows.length;
  const averageMainUsed = directYouthCount
    ? Math.round(directYouthRows.reduce((sum, row) => sum + row.mainUsed, 0) / directYouthCount)
    : 0;
  const promotionNeededCount = directYouthRows.filter(
    (row) =>
      dashboard.settings.per_youth_main_limit &&
      formatRate(row.mainUsed, dashboard.settings.per_youth_main_limit) < 50,
  ).length;

  return (
    <div className="mx-auto max-w-[1120px] space-y-6">
      <section className="panel flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-500">Counselor</div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl">청년 출석 및 사용 현황</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            스터디카페 출석 인증과 직접사업비 사용 흐름을 함께 확인합니다.
          </p>
        </div>
        <CounselorSignOutButton />
      </section>

      <SectionLabel
        eyebrow="Attendance"
        title="스터디카페 출석 현황"
        description="청년이 제출한 출석 인증의 전체 흐름입니다."
        icon={ClipboardCheck}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel px-5 py-5">
          <div className="text-sm text-slate-500">전체 제출</div>
          <div className="mt-3 text-3xl font-semibold">{checkins.length}</div>
        </div>
        <div className="panel px-5 py-5">
          <div className="text-sm text-slate-500">확인 대기</div>
          <div className="mt-3 text-3xl font-semibold">{pendingCount}</div>
        </div>
        <div className="panel px-5 py-5">
          <div className="text-sm text-slate-500">승인</div>
          <div className="mt-3 text-3xl font-semibold">{approvedCount}</div>
        </div>
      </section>

      <section className="mt-10 border-y-2 border-slate-900 bg-slate-950 px-5 py-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white text-slate-950">
              <WalletCards className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">Direct Cost</div>
              <h2 className="mt-2 text-3xl font-semibold">청년별 직접사업비 사용현황</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                직접사업비 집행률과 청년별 사용액을 별도 영역으로 확인합니다.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-white/20 px-4 py-3 text-sm">
            <div className="text-slate-300">총 참여청년</div>
            <div className="mt-1 text-2xl font-semibold">{dashboard.youthRows.length}명</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="panel px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-500">직접사업비 집행률</div>
            <BarChart3 className="h-5 w-5 text-teal-700" />
          </div>
          <div className="mt-3 text-3xl font-semibold">{directRate}%</div>
          <div className="mt-3">
            <ProgressBar
              value={dashboard.totals.directExecutedTotal}
              total={dashboard.totals.directBudgetTotal}
            />
          </div>
        </div>
        <div className="panel px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-500">집행 완료액</div>
            <Coins className="h-5 w-5 text-teal-700" />
          </div>
          <div className="mt-3 text-2xl font-semibold">
            {formatCurrency(dashboard.totals.directExecutedTotal)}원
          </div>
          <div className="mt-2 text-xs text-slate-500">
            예산 {formatCurrency(dashboard.totals.directBudgetTotal)}원
          </div>
        </div>
        <div className="panel px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-500">청년별 평균 사용</div>
            <UsersRound className="h-5 w-5 text-teal-700" />
          </div>
          <div className="mt-3 text-2xl font-semibold">{formatCurrency(averageMainUsed)}원</div>
          <div className="mt-2 text-xs text-slate-500">
            기준 {formatCurrency(dashboard.settings.per_youth_main_limit)}원
          </div>
        </div>
        <div className="panel px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-500">사용 촉진</div>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-3 text-3xl font-semibold">{promotionNeededCount}</div>
          <div className="mt-2 text-xs text-slate-500">주 예산 50% 미만</div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Youth Usage Table</div>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">청년별 사용액 상세</h3>
            <p className="mt-1 text-sm text-slate-500">완료 처리된 결의서와 청년별 안분 금액 기준입니다.</p>
          </div>
          <div className="text-xs text-slate-500">
            총 {dashboard.youthRows.length}명
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">청년</th>
                <th className="px-4 py-3 text-right">주 예산 사용</th>
                <th className="px-4 py-3 text-right">잔액</th>
                <th className="px-4 py-3 text-right">사용률</th>
                <th className="px-4 py-3 text-right">문서</th>
                <th className="px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.youthRows.length ? (
                dashboard.youthRows.map((row) => {
                  const usageState = getYouthUsageState(row, dashboard.settings.per_youth_main_limit);
                  const usageRate = formatRate(row.mainUsed, dashboard.settings.per_youth_main_limit);

                  return (
                    <tr key={`${row.youthId ?? "unassigned"}-${row.name}`} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {row.serialNo ? `${row.serialNo}. ` : ""}
                          {row.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {row.status === "unassigned" ? "청년 배정 필요" : row.status}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.mainUsed)}원</td>
                      <td className={`px-4 py-3 text-right ${row.mainRemaining < 0 ? "text-red-700" : ""}`}>
                        {row.status === "unassigned" ? "-" : `${formatCurrency(row.mainRemaining)}원`}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.status === "unassigned" ? "-" : `${usageRate}%`}
                      </td>
                      <td className="px-4 py-3 text-right">{row.documentCount}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${usageState.className}`}>
                          {usageState.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    참여청년을 등록하면 청년별 사용액이 표시됩니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">스터디카페 출석 내역</h2>
          <p className="mt-1 text-sm text-slate-500">제출된 출석 인증 사진과 제출시각입니다.</p>
        </div>
        {checkins.length ? (
          checkins.map((checkin) => (
            <article key={checkin.id} className="panel overflow-hidden">
              <div className="grid gap-5 p-5 lg:grid-cols-[220px_1fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-2">
                  <img
                    src={checkin.photo_data_url}
                    alt={`${checkin.youth_name} 출석 인증 사진`}
                    className="max-h-[300px] w-full rounded object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-slate-950">
                          {checkin.youth_serial_no ? `${checkin.youth_serial_no}. ` : ""}
                          {checkin.youth_name || `청년 #${checkin.youth_id}`}
                        </h2>
                        <span className={`badge ${statusStyles[checkin.status]}`}>
                          {statusLabels[checkin.status]}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {checkin.cafe_name || "스터디카페명 미입력"}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">{formatDateTime(checkin.submitted_at)}</div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                      <div className="text-slate-500">인증일</div>
                      <div className="mt-1 font-semibold text-slate-900">{checkin.attendance_date}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                      <div className="text-slate-500">위치정보</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {checkin.latitude && checkin.longitude ? "제출됨" : "없음"}
                      </div>
                    </div>
                  </div>

                  {checkin.memo ? (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                      <div className="text-slate-500">청년 메모</div>
                      <div className="mt-1 whitespace-pre-wrap text-slate-900">{checkin.memo}</div>
                    </div>
                  ) : null}

                  {checkin.review_note ? (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <div className="text-slate-500">관리자 메모</div>
                      <div className="mt-1 whitespace-pre-wrap text-slate-900">{checkin.review_note}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="panel px-6 py-12 text-center text-sm text-slate-500">
            제출된 스터디카페 출석 인증이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
