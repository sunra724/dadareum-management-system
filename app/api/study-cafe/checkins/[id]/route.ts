import { NextResponse } from "next/server";
import { reviewStudyCafeCheckin } from "@/lib/db/study-cafe";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { StudyCafeCheckinStatus } from "@/lib/types";

type ReviewPayload = {
  status?: StudyCafeCheckinStatus;
  review_note?: string;
};

async function getReviewerEmail() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? "";
  } catch {
    return "";
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as ReviewPayload;
  const status = body.status;

  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    return NextResponse.json({ message: "상태값을 확인해 주세요." }, { status: 400 });
  }

  const updated = await reviewStudyCafeCheckin(Number(id), {
    status,
    review_note: (body.review_note ?? "").trim().slice(0, 600),
    reviewed_by: await getReviewerEmail(),
  });

  return updated ? NextResponse.json(updated) : NextResponse.json({ message: "Not found" }, { status: 404 });
}
