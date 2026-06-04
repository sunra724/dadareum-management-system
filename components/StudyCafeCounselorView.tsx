/* eslint-disable @next/next/no-img-element */
import CounselorSignOutButton from "@/components/CounselorSignOutButton";
import type { StudyCafeCheckin, StudyCafeCheckinStatus } from "@/lib/types";

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

export default function StudyCafeCounselorView({
  checkins,
}: {
  checkins: StudyCafeCheckin[];
}) {
  const pendingCount = checkins.filter((checkin) => checkin.status === "pending").length;
  const approvedCount = checkins.filter((checkin) => checkin.status === "approved").length;

  return (
    <div className="mx-auto max-w-[1120px] space-y-6">
      <section className="panel flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-500">Counselor</div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl">청년 출석 현황</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            스터디카페 출석 인증 제출 현황을 읽기 전용으로 확인합니다.
          </p>
        </div>
        <CounselorSignOutButton />
      </section>

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

      <section className="space-y-4">
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
