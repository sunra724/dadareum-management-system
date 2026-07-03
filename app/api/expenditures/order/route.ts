import { NextResponse } from "next/server";
import { reorderExpenditures } from "@/lib/db/expenditures";

export async function PUT(request: Request) {
  const body = (await request.json()) as { ids?: unknown };
  const ids = Array.isArray(body.ids)
    ? body.ids.map((value) => Number(value)).filter(Boolean)
    : [];

  return NextResponse.json(await reorderExpenditures(ids));
}
