import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarDays, CheckCircle2, Download, FileWarning, Gauge, Landmark, UsersRound } from "lucide-react";
import { getCalendarAgenda, type CalendarEventItem, type CalendarEventTag } from "@/lib/calendar";
import { getDadareumDashboard } from "@/lib/db/dadareum";
import { listProjects } from "@/lib/db/organizations";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatRate(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const rate = Math.min(100, Math.max(0, formatRate(value, total)));

  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-sm bg-[var(--surface-2)]">
      <div className="h-full rounded-sm bg-[var(--terra-600)]" style={{ width: `${rate}%` }} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof Gauge;
}) {
  return (
    <div className="panel px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-[var(--ink-mid)]">{label}</div>
        <Icon className="h-5 w-5 text-[var(--green-600)]" />
      </div>
      <div className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold leading-none text-[var(--green-800)]">
        {value}
      </div>
      <div className="mt-2 text-xs text-[var(--ink-mid)]">{caption}</div>
    </div>
  );
}

const tagStyles: Record<CalendarEventTag, string> = {
  settlement: "pill pill-terra",
  report: "pill pill-terra",
  operations: "pill pill-canvas",
  counseling: "pill pill-green",
  program: "pill pill-green",
  expense: "pill pill-green",
  other: "pill pill-canvas",
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
});

function formatEventDate(event: CalendarEventItem) {
  return dateFormatter.format(new Date(event.start));
}

function formatEventTime(event: CalendarEventItem) {
  if (event.allDay) return "종일";
  return timeFormatter.format(new Date(event.start));
}

function CalendarEventList({
  events,
  emptyText,
}: {
  events: CalendarEventItem[];
  emptyText: string;
}) {
  if (!events.length) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--canvas)] px-4 py-6 text-center text-sm text-[var(--ink-mid)]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.slice(0, 6).map((event) => (
        <div key={event.id} className="rounded-md border border-[var(--border)] px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium text-[var(--ink)]">{event.title}</div>
              <div className="mt-1 text-xs text-[var(--ink-mid)]">
                {formatEventDate(event)} · {formatEventTime(event)}
                {event.location ? ` · ${event.location}` : ""}
              </div>
            </div>
            <span className={`shrink-0 ${tagStyles[event.tag]}`}>
              {event.tagLabel}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; fromProposalId?: string }>;
}) {
  const params = await searchParams;
  if (params.fromProposalId) redirect(`/expenditures?fromProposalId=${params.fromProposalId}`);

  const projects = await listProjects();
  const selectedProjectId = params.projectId ? Number(params.projectId) : null;
  const [dashboard, calendar] = await Promise.all([
    getDadareumDashboard(selectedProjectId),
    getCalendarAgenda(),
  ]);

  const selectedProject = dashboard.project;
  const settlementDownloadHref = `/api/settlement/form16${
    selectedProject?.id ? `?projectId=${selectedProject.id}` : ""
  }`;
  const executedRate = formatRate(dashboard.totals.executedTotal, dashboard.totals.budgetTotal);
  const directRate = formatRate(dashboard.totals.directExecutedTotal, dashboard.totals.directBudgetTotal);
  const indirectRate = formatRate(dashboard.totals.indirectExecutedTotal, dashboard.totals.indirectBudgetTotal);
  const indirectAdvanceAmount = Math.round(dashboard.totals.indirectBudgetTotal * 0.7);
  const indirectBalanceAmount = dashboard.totals.indirectBudgetTotal - indirectAdvanceAmount;

  return (
    <div className="space-y-6">
      <section className="panel px-6 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm uppercase text-[var(--green-800)]">Dadareum Settlement</div>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--ink)]">
              청년 다다름 정산 대시보드
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--ink-mid)]">
              지출품의서와 지출결의서 데이터를 기준으로 예산 집행률, 청년별 한도, 증빙 상태를 한 곳에서 확인합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={settlementDownloadHref}
              className="btn btn-primary !px-3 !py-2 text-sm font-semibold"
            >
              <Download className="h-4 w-4" />
              서식16 다운로드
            </a>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/?projectId=${project.id}`}
                className={`inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium ${
                  selectedProject?.id === project.id
                    ? "bg-[var(--green-800)] text-white shadow-sm"
                    : "border border-[var(--green-800)] text-[var(--green-800)] hover:bg-[var(--green-50)]"
                }`}
              >
                {project.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="panel px-6 py-6">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[var(--green-600)]" />
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">사업 일정</h2>
              <p className="mt-1 text-sm text-[var(--ink-mid)]">{calendar.calendarName}</p>
            </div>
          </div>
          <div className="text-xs text-[var(--ink-mid)]">
            오늘 {calendar.today.length}건 · 14일 {calendar.upcoming.length}건 · 마감 {calendar.deadlines.length}건
          </div>
        </div>

        {calendar.error ? (
          <div className="rounded-md border border-[rgba(184,80,48,0.24)] bg-[var(--terra-100)] px-4 py-3 text-sm text-[var(--terra-800)]">
            구글 캘린더 일정을 읽지 못했습니다. iCal 주소를 다시 확인해 주세요.
          </div>
        ) : calendar.configured ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <div className="mb-3 text-sm font-semibold text-[var(--ink)]">오늘</div>
              <CalendarEventList events={calendar.today} emptyText="오늘 일정이 없습니다." />
            </div>
            <div>
              <div className="mb-3 text-sm font-semibold text-[var(--ink)]">앞으로 14일</div>
              <CalendarEventList events={calendar.upcoming} emptyText="예정된 일정이 없습니다." />
            </div>
            <div>
              <div className="mb-3 text-sm font-semibold text-[var(--ink)]">정산·보고 마감</div>
              <CalendarEventList events={calendar.deadlines} emptyText="다가오는 정산·보고 마감이 없습니다." />
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-[var(--border)] bg-[var(--canvas)] px-4 py-6 text-center text-sm text-[var(--ink-mid)]">
            캘린더 주소가 아직 설정되지 않았습니다.
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="전체 집행률"
          value={`${executedRate}%`}
          caption={`${formatCurrency(dashboard.totals.executedTotal)}원 / ${formatCurrency(
            dashboard.totals.budgetTotal,
          )}원`}
          icon={Gauge}
        />
        <MetricCard
          label="직접비"
          value={`${directRate}%`}
          caption={`${formatCurrency(dashboard.totals.directExecutedTotal)}원 / ${formatCurrency(
            dashboard.totals.directBudgetTotal,
          )}원`}
          icon={UsersRound}
        />
        <MetricCard
          label="간접비"
          value={`${indirectRate}%`}
          caption={`${formatCurrency(dashboard.totals.indirectExecutedTotal)}원 / ${formatCurrency(
            dashboard.totals.indirectBudgetTotal,
          )}원`}
          icon={Landmark}
        />
        <MetricCard
          label="정산 알림"
          value={`${dashboard.alerts.length}건`}
          caption={`증빙대기 ${dashboard.totals.evidencePendingCount}건 · 승인확인 ${dashboard.totals.approvalPendingCount}건`}
          icon={FileWarning}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">예산 집행 현황</h2>
              <p className="mt-1 text-sm text-[var(--ink-mid)]">완료 처리된 결의서의 집행 인정금액 기준입니다.</p>
            </div>
            <Link href="/expenditures" className="btn btn-secondary !min-h-0 !px-3 !py-2 text-sm">
              결의서 보기
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--ink)]">전체</span>
                <span className="text-[var(--ink-mid)]">{executedRate}%</span>
              </div>
              <ProgressBar value={dashboard.totals.executedTotal} total={dashboard.totals.budgetTotal} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--ink)]">직접비</span>
                <span className="text-[var(--ink-mid)]">{directRate}%</span>
              </div>
              <ProgressBar value={dashboard.totals.directExecutedTotal} total={dashboard.totals.directBudgetTotal} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--ink)]">간접비</span>
                <span className="text-[var(--ink-mid)]">{indirectRate}%</span>
              </div>
              <ProgressBar
                value={dashboard.totals.indirectExecutedTotal}
                total={dashboard.totals.indirectBudgetTotal}
              />
            </div>
          </div>

          <div className="mt-5 rounded-md border border-[var(--border)] bg-[var(--canvas)] px-4 py-3">
            <div className="text-sm font-semibold text-[var(--ink)]">계약 사업비</div>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--ink-mid)]">총 사업비</span>
                <span className="font-semibold text-[var(--ink)]">{formatCurrency(dashboard.totals.budgetTotal)}원</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--ink-mid)]">직접사업비</span>
                <span className="font-semibold text-[var(--ink)]">
                  {formatCurrency(dashboard.totals.directBudgetTotal)}원
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--ink-mid)]">간접사업비 선금</span>
                <span className="font-semibold text-[var(--ink)]">{formatCurrency(indirectAdvanceAmount)}원</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--ink-mid)]">간접사업비 잔금</span>
                <span className="font-semibold text-[var(--ink)]">{formatCurrency(indirectBalanceAmount)}원</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-[var(--ink-mid)]">직접사업비는 20명 x 2,400,000원 기준입니다.</div>
          </div>
        </div>

        <div className="panel px-6 py-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[var(--terra-800)]" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">정산 체크</h2>
          </div>

          <div className="mt-4 space-y-3">
            {dashboard.alerts.length ? (
              dashboard.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-md border px-3 py-3 text-sm ${
                    alert.severity === "blocking"
                      ? "border-[rgba(184,80,48,0.28)] bg-[var(--terra-100)] text-[var(--terra-800)]"
                      : "border-[rgba(184,80,48,0.24)] bg-[var(--terra-50)] text-[var(--terra-800)]"
                  }`}
                >
                  <div className="font-semibold">{alert.title}</div>
                  <div className="mt-1 text-xs opacity-80">{alert.description}</div>
                  {alert.href ? (
                    <Link className="mt-2 inline-block text-xs font-semibold underline" href={alert.href}>
                      확인하기
                    </Link>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-md border border-[rgba(45,106,79,0.24)] bg-[var(--green-50)] px-3 py-4 text-sm text-[var(--green-800)]">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  큰 경고 없음
                </div>
                <p className="mt-1 text-xs">현재 입력된 문서 기준으로 즉시 확인할 정산 경고는 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel px-6 py-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--ink)]">비목별 집행</h2>
            <span className="text-xs text-[var(--ink-mid)]">세세목 예산표 연결 전에는 문서 입력값으로 묶입니다.</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--border-md)] text-left text-[var(--ink-mid)]">
                <tr>
                  <th className="py-2 pr-3">구분</th>
                  <th className="py-2 pr-3">항목</th>
                  <th className="py-2 pr-3 text-right">집행</th>
                  <th className="py-2 pr-3 text-right">잔액</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.budgetRows.length ? (
                  dashboard.budgetRows.map((row) => (
                    <tr key={row.key} className="border-b border-[var(--border)]">
                      <td className="py-3 pr-3 text-[var(--ink-mid)]">{row.scope === "direct" ? "직접비" : "간접비"}</td>
                      <td className="py-3 pr-3">
                        <div className="font-medium text-[var(--ink)]">{row.categoryName}</div>
                        <div className="mt-1 text-xs text-[var(--ink-mid)]">{row.itemName}</div>
                      </td>
                      <td className="py-3 pr-3 text-right">{formatCurrency(row.executedAmount)}원</td>
                      <td className="py-3 pr-3 text-right">
                        {row.budgetAmount ? `${formatCurrency(row.remainingAmount)}원` : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-8 text-center text-[var(--ink-mid)]" colSpan={4}>
                      아직 집행 완료된 결의서가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel px-6 py-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--ink)]">청년별 한도</h2>
            <span className="text-xs text-[var(--ink-mid)]">주 예산 {formatCurrency(dashboard.settings.per_youth_main_limit)}원 기준</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--border-md)] text-left text-[var(--ink-mid)]">
                <tr>
                  <th className="py-2 pr-3">청년</th>
                  <th className="py-2 pr-3 text-right">주 예산 사용</th>
                  <th className="py-2 pr-3 text-right">잔액</th>
                  <th className="py-2 pr-3 text-right">문서</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.youthRows.length ? (
                  dashboard.youthRows.map((row) => (
                    <tr key={`${row.youthId ?? "unassigned"}-${row.name}`} className="border-b border-[var(--border)]">
                      <td className="py-3 pr-3">
                        <div className="font-medium text-[var(--ink)]">
                          {row.serialNo ? `${row.serialNo}. ` : ""}
                          {row.name}
                        </div>
                        <div className="mt-1 text-xs text-[var(--ink-mid)]">
                          {row.status === "unassigned" ? "청년 배정 필요" : row.status}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-right">{formatCurrency(row.mainUsed)}원</td>
                      <td className={`py-3 pr-3 text-right ${row.mainRemaining < 0 ? "text-[var(--terra-800)]" : ""}`}>
                        {row.status === "unassigned" ? "-" : `${formatCurrency(row.mainRemaining)}원`}
                      </td>
                      <td className="py-3 pr-3 text-right">{row.documentCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-8 text-center text-[var(--ink-mid)]" colSpan={4}>
                      참여청년을 등록하면 청년별 사용액이 표시됩니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
