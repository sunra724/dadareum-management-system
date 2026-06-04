import { NextResponse } from "next/server";
import { authenticateStudyCafeYouth } from "@/lib/db/study-cafe";
import { isValidPhoneNumber } from "@/lib/phone-auth";
import { createStudyCafeCheckinToken } from "@/lib/study-cafe-token";

type AuthPayload = {
  project_id?: number | null;
  name?: string;
  phone_number?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AuthPayload;
  const name = body.name?.trim() ?? "";
  const phoneNumber = body.phone_number?.trim() ?? "";

  if (!name || !isValidPhoneNumber(phoneNumber)) {
    return NextResponse.json(
      { message: "이름과 휴대폰번호를 확인해 주세요." },
      { status: 400 },
    );
  }

  const matched = await authenticateStudyCafeYouth({
    project_id: body.project_id ?? null,
    name,
    phone_number: phoneNumber,
  });

  if (!matched) {
    return NextResponse.json(
      { message: "등록된 청년 정보와 일치하지 않습니다." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    token: createStudyCafeCheckinToken(matched.project.id, matched.youth.id),
    youth: {
      id: matched.youth.id,
      display_name: matched.youth.display_name,
      serial_no: matched.youth.serial_no,
    },
    project: {
      id: matched.project.id,
      name: matched.project.name,
    },
  });
}
