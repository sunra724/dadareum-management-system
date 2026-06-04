"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle } from "lucide-react";
import PwaInstallButton from "@/components/PwaInstallButton";

type AuthResult = {
  token: string;
  youth: {
    display_name: string;
    serial_no: number;
  };
  project: {
    name: string;
  };
};

type MyCheckin = {
  id: number;
  project_name: string;
  youth_name: string;
  submitted_at: string;
  attendance_date: string;
  cafe_name: string;
  memo: string;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string;
  review_note: string;
  has_location: boolean;
};

const statusLabel = {
  pending: "확인 대기",
  approved: "승인",
  rejected: "반려",
} satisfies Record<MyCheckin["status"], string>;

const statusClass = {
  pending: "badge-draft",
  approved: "badge-finalized",
  rejected: "bg-red-50 text-red-700",
} satisfies Record<MyCheckin["status"], string>;

function statusIcon(status: MyCheckin["status"]) {
  if (status === "approved") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "rejected") return <XCircle className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}

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

export default function StudyCafeMyCheckins() {
  const [auth, setAuth] = useState<AuthResult | null>(null);
  const [checkins, setCheckins] = useState<MyCheckin[]>([]);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadMyCheckins(nextToken: string) {
    const response = await fetch("/api/study-cafe/my", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: nextToken }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message ?? "출석내역을 불러오지 못했습니다.");
      return;
    }
    setCheckins(data.checkins ?? []);
  }

  async function verifyYouth() {
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/study-cafe/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone_number: phoneNumber }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message ?? "인증에 실패했습니다.");
        return;
      }

      const nextAuth = data as AuthResult;
      setAuth(nextAuth);
      await loadMyCheckins(nextAuth.token);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl py-6">
      <section className="panel px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-700 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500">My Checkins</div>
            <h1 className="text-2xl font-semibold text-slate-950">내 출석내역</h1>
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <PwaInstallButton />
          <Link className="btn btn-secondary w-full" href="/study-cafe/checkin">
            출석 인증하기
          </Link>
        </div>

        {!auth ? (
          <div className="mt-6 space-y-4">
            <label className="block text-sm">
              이름
              <input
                className="field mt-2"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              휴대폰번호
              <input
                className="field mt-2"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="01012345678"
              />
            </label>
            <button className="btn btn-primary w-full" onClick={verifyYouth} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              내역 확인
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {auth.youth.display_name}님 출석내역
            </div>

            {checkins.length ? (
              <div className="space-y-3">
                {checkins.map((checkin) => (
                  <article key={checkin.id} className="rounded-lg border border-slate-200 bg-white px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-950">
                          {checkin.cafe_name || "스터디카페명 미입력"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatDateTime(checkin.submitted_at)}
                        </div>
                      </div>
                      <span className={`badge ${statusClass[checkin.status]}`}>
                        {statusIcon(checkin.status)}
                        {statusLabel[checkin.status]}
                      </span>
                    </div>
                    {checkin.memo ? (
                      <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{checkin.memo}</div>
                    ) : null}
                    {checkin.review_note ? (
                      <div className="mt-3 rounded bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {checkin.review_note}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                제출된 출석 인증이 없습니다.
              </div>
            )}
          </div>
        )}

        {message ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </div>
        ) : null}
      </section>
    </div>
  );
}
