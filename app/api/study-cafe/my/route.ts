import { NextResponse } from "next/server";
import { listStudyCafeCheckinsForYouth } from "@/lib/db/study-cafe";
import { verifyStudyCafeCheckinToken } from "@/lib/study-cafe-token";

type MyCheckinsPayload = {
  token?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as MyCheckinsPayload;
  const payload = verifyStudyCafeCheckinToken(body.token ?? "");

  if (!payload) {
    return NextResponse.json(
      { message: "인증 시간이 만료되었습니다. 다시 인증해 주세요." },
      { status: 401 },
    );
  }

  const checkins = await listStudyCafeCheckinsForYouth(payload.projectId, payload.youthId);

  return NextResponse.json({
    checkins: checkins.map((checkin) => ({
      id: checkin.id,
      project_name: checkin.project_name,
      youth_name: checkin.youth_name,
      submitted_at: checkin.submitted_at,
      attendance_date: checkin.attendance_date,
      cafe_name: checkin.cafe_name,
      memo: checkin.memo,
      status: checkin.status,
      reviewed_at: checkin.reviewed_at,
      review_note: checkin.review_note,
      has_location: Boolean(checkin.latitude && checkin.longitude),
    })),
  });
}
