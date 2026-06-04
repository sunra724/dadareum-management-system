import { NextResponse } from "next/server";
import { createStudyCafeCheckin } from "@/lib/db/study-cafe";
import { verifyStudyCafeCheckinToken } from "@/lib/study-cafe-token";

const MAX_PHOTO_DATA_URL_LENGTH = 6_000_000;
const PHOTO_DATA_URL_PATTERN = /^data:image\/(?:jpeg|jpg|png|webp);base64,/i;

type SubmitPayload = {
  token?: string;
  cafe_name?: string;
  memo?: string;
  photo?: {
    data_url?: string;
    file_name?: string;
    mime_type?: string;
    size_bytes?: number;
  };
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    accuracy_m?: number | null;
  } | null;
};

function cleanText(value: string | undefined, maxLength: number) {
  return (value ?? "").trim().slice(0, maxLength);
}

function cleanNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as SubmitPayload;
  const payload = verifyStudyCafeCheckinToken(body.token ?? "");

  if (!payload) {
    return NextResponse.json(
      { message: "인증 시간이 만료되었습니다. 다시 인증해 주세요." },
      { status: 401 },
    );
  }

  const dataUrl = body.photo?.data_url ?? "";
  if (
    !PHOTO_DATA_URL_PATTERN.test(dataUrl) ||
    dataUrl.length > MAX_PHOTO_DATA_URL_LENGTH
  ) {
    return NextResponse.json(
      { message: "사진 파일을 다시 선택해 주세요." },
      { status: 400 },
    );
  }

  const created = await createStudyCafeCheckin({
    project_id: payload.projectId,
    youth_id: payload.youthId,
    cafe_name: cleanText(body.cafe_name, 120),
    memo: cleanText(body.memo, 600),
    photo_data_url: dataUrl,
    photo_file_name: cleanText(body.photo?.file_name, 180),
    photo_mime_type: cleanText(body.photo?.mime_type, 80),
    photo_size_bytes: Math.max(Number(body.photo?.size_bytes ?? 0) || 0, 0),
    latitude: cleanNumber(body.location?.latitude),
    longitude: cleanNumber(body.location?.longitude),
    location_accuracy_m: cleanNumber(body.location?.accuracy_m),
  });

  return NextResponse.json(
    {
      id: created.id,
      submitted_at: created.submitted_at,
      attendance_date: created.attendance_date,
      status: created.status,
    },
    { status: 201 },
  );
}
