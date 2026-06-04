/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { Check, Clock3, MapPin, X } from "lucide-react";
import type { StudyCafeCheckin, StudyCafeCheckinStatus } from "@/lib/types";

const statusStyles: Record<StudyCafeCheckinStatus, string> = {
  pending: "badge-draft",
  approved: "badge-finalized",
  rejected: "bg-red-50 text-red-700",
};

const statusLabels: Record<StudyCafeCheckinStatus, string> = {
  pending: "확인 대기",
  approved: "승인",
  rejected: "반려",
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

export default function StudyCafeAdmin({
  initialCheckins,
  checkinUrl,
  counselorUrl,
}: {
  initialCheckins: StudyCafeCheckin[];
  checkinUrl: string;
  counselorUrl: string;
}) {
  const [checkins, setCheckins] = useState(initialCheckins);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const counts = useMemo(
    () => ({
      total: checkins.length,
      pending: checkins.filter((item) => item.status === "pending").length,
      approved: checkins.filter((item) => item.status === "approved").length,
      rejected: checkins.filter((item) => item.status === "rejected").length,
    }),
    [checkins],
  );

  async function reviewCheckin(id: number, status: StudyCafeCheckinStatus) {
    setMessage("");
    setSavingId(id);
    try {
      const response = await fetch(`/api/study-cafe/checkins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          review_note: reviewNotes[id] ?? "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message ?? "상태 변경에 실패했습니다.");
        return;
      }
      setCheckins((current) =>
        current.map((item) => (item.id === id ? (data as StudyCafeCheckin) : item)),
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-500">Study Cafe</div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl">스터디카페 출석 인증</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            청년이 제출한 사진, 서버 제출시각, 위치정보, 관리자 확인 상태를 관리합니다.
          </p>
        </div>
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <div>
            <div className="font-semibold text-slate-900">청년용 링크</div>
            <a className="mt-1 block break-all text-teal-700 underline" href={checkinUrl}>
              {checkinUrl}
            </a>
          </div>
          <div>
            <div className="font-semibold text-slate-900">상담실무자 링크</div>
            <a className="mt-1 block break-all text-teal-700 underline" href={counselorUrl}>
              {counselorUrl}
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="panel px-5 py-5">
          <div className="text-sm text-slate-500">전체</div>
          <div className="mt-3 text-3xl font-semibold">{counts.total}</div>
        </div>
        <div className="panel px-5 py-5">
          <div className="text-sm text-slate-500">확인 대기</div>
          <div className="mt-3 text-3xl font-semibold">{counts.pending}</div>
        </div>
        <div className="panel px-5 py-5">
          <div className="text-sm text-slate-500">승인</div>
          <div className="mt-3 text-3xl font-semibold">{counts.approved}</div>
        </div>
        <div className="panel px-5 py-5">
          <div className="text-sm text-slate-500">반려</div>
          <div className="mt-3 text-3xl font-semibold">{counts.rejected}</div>
        </div>
      </section>

      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </div>
      ) : null}

      <section className="space-y-4">
        {checkins.length ? (
          checkins.map((checkin) => {
            const mapUrl =
              checkin.latitude && checkin.longitude
                ? `https://www.google.com/maps?q=${checkin.latitude},${checkin.longitude}`
                : "";

            return (
              <article key={checkin.id} className="panel overflow-hidden">
                <div className="grid gap-5 p-5 lg:grid-cols-[260px_1fr]">
                  <div className="rounded-lg border border-slate-200 bg-white p-2">
                    <img
                      src={checkin.photo_data_url}
                      alt={`${checkin.youth_name} 스터디카페 출석 인증 사진`}
                      className="max-h-[360px] w-full rounded object-contain"
                    />
                  </div>
                  <div className="min-w-0 space-y-4">
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
                          {checkin.project_name || "-"} · {checkin.cafe_name || "스터디카페명 미입력"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        {formatDateTime(checkin.submitted_at)}
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                        <div className="text-slate-500">인증일</div>
                        <div className="mt-1 font-semibold text-slate-900">{checkin.attendance_date}</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                        <div className="text-slate-500">사진 파일</div>
                        <div className="mt-1 truncate font-semibold text-slate-900">
                          {checkin.photo_file_name || "-"}
                        </div>
                      </div>
                    </div>

                    {checkin.memo ? (
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                        <div className="text-slate-500">메모</div>
                        <div className="mt-1 whitespace-pre-wrap text-slate-900">{checkin.memo}</div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                      {mapUrl ? (
                        <a className="btn btn-secondary !px-3 !py-2" href={mapUrl} target="_blank" rel="noreferrer">
                          <MapPin className="h-4 w-4" />
                          위치 보기
                        </a>
                      ) : null}
                      <button
                        className="btn btn-primary !px-3 !py-2"
                        onClick={() => reviewCheckin(checkin.id, "approved")}
                        disabled={savingId === checkin.id}
                      >
                        <Check className="h-4 w-4" />
                        승인
                      </button>
                      <button
                        className="btn btn-danger !px-3 !py-2"
                        onClick={() => reviewCheckin(checkin.id, "rejected")}
                        disabled={savingId === checkin.id}
                      >
                        <X className="h-4 w-4" />
                        반려
                      </button>
                    </div>

                    <label className="block text-sm">
                      확인 메모
                      <textarea
                        className="textarea mt-2"
                        value={reviewNotes[checkin.id] ?? checkin.review_note}
                        onChange={(event) =>
                          setReviewNotes((current) => ({
                            ...current,
                            [checkin.id]: event.target.value,
                          }))
                        }
                      />
                    </label>

                    {checkin.reviewed_at ? (
                      <div className="text-xs text-slate-500">
                        확인: {formatDateTime(checkin.reviewed_at)}
                        {checkin.reviewed_by ? ` · ${checkin.reviewed_by}` : ""}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="panel px-6 py-12 text-center text-sm text-slate-500">
            제출된 스터디카페 출석 인증이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
