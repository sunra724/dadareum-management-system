/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Camera, CheckCircle2, Loader2, MapPin, ShieldCheck } from "lucide-react";
import PwaInstallButton from "@/components/PwaInstallButton";
import { convertImageFileToDataUrl } from "@/lib/browser-image";

type AuthResult = {
  token: string;
  youth: {
    id: number;
    display_name: string;
    serial_no: number;
  };
  project: {
    id: number;
    name: string;
  };
};

type LocationSnapshot = {
  latitude: number;
  longitude: number;
  accuracy_m: number;
} | null;

type SubmittedResult = {
  id: number;
  submitted_at: string;
  attendance_date: string;
  status: "pending" | "approved" | "rejected";
};

function formatSubmittedAt(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getLocationSnapshot() {
  return new Promise<LocationSnapshot>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_m: Math.round(position.coords.accuracy),
        }),
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 60000,
      },
    );
  });
}

export default function StudyCafeCheckinForm() {
  const [auth, setAuth] = useState<AuthResult | null>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cafeName, setCafeName] = useState("");
  const [memo, setMemo] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedResult | null>(null);

  const submittedAt = useMemo(
    () => formatSubmittedAt(submitted?.submitted_at ?? ""),
    [submitted?.submitted_at],
  );

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
      setAuth(data as AuthResult);
    } finally {
      setLoading(false);
    }
  }

  async function selectPhoto(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setMessage("");
    setLoading(true);
    try {
      const converted = await convertImageFileToDataUrl(file, {
        maxDimension: 1280,
        quality: 0.76,
      });
      setPhotoFile(file);
      setPhotoDataUrl(converted);
    } catch {
      setMessage("사진을 불러오지 못했습니다. 다른 사진으로 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function submitCheckin() {
    if (!auth || !photoDataUrl) {
      setMessage("사진을 선택해 주세요.");
      return;
    }

    setMessage("");
    setLoading(true);
    try {
      const location = includeLocation ? await getLocationSnapshot() : null;
      const response = await fetch("/api/study-cafe/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: auth.token,
          cafe_name: cafeName,
          memo,
          photo: {
            data_url: photoDataUrl,
            file_name: photoFile?.name ?? "",
            mime_type: photoFile?.type ?? "image/jpeg",
            size_bytes: photoFile?.size ?? 0,
          },
          location,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message ?? "출석 인증 저장에 실패했습니다.");
        return;
      }
      setSubmitted(data as SubmittedResult);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md py-10">
        <section className="panel px-6 py-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">제출 완료</h1>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-4 text-left text-sm text-slate-700">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">제출시각</span>
              <span className="font-semibold">{submittedAt}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-slate-500">상태</span>
              <span className="badge badge-draft">확인 대기</span>
            </div>
          </div>
          <Link className="btn btn-primary mt-5 w-full" href="/study-cafe/my">
            내 출석내역 확인
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-6">
      <section className="panel px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-700 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Study Cafe</div>
            <h1 className="text-2xl font-semibold text-slate-950">스터디카페 출석 인증</h1>
            <div className="mt-1 text-xs font-medium text-slate-500">청년다다름사업</div>
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          <PwaInstallButton />
          <Link className="btn btn-secondary w-full" href="/study-cafe/my">
            내 출석내역 확인
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
              인증하기
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {auth.youth.display_name}님 인증됨
            </div>
            <label className="block text-sm">
              스터디카페명
              <input
                className="field mt-2"
                value={cafeName}
                onChange={(event) => setCafeName(event.target.value)}
                placeholder="예: 작심스터디카페"
              />
            </label>
            <label className="block text-sm">
              메모
              <textarea
                className="textarea mt-2"
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="좌석번호, 이용권, 영수증 정보 등"
              />
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={includeLocation}
                onChange={(event) => setIncludeLocation(event.target.checked)}
              />
              <MapPin className="h-4 w-4 text-teal-700" />
              위치정보 함께 제출
            </label>

            <label className="btn btn-secondary w-full cursor-pointer">
              <Camera className="h-4 w-4" />
              사진 선택 또는 촬영
              <input
                className="hidden"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => selectPhoto(event.target.files)}
              />
            </label>

            {photoDataUrl ? (
              <img
                src={photoDataUrl}
                alt="선택한 출석 인증 사진"
                className="max-h-[360px] w-full rounded-lg border border-slate-200 object-contain"
              />
            ) : null}

            <button className="btn btn-primary w-full" onClick={submitCheckin} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              제출하기
            </button>
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
