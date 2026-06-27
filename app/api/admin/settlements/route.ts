import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getSeller } from "@/lib/store";
import { executeSettlement } from "@/lib/settlement";

/** 판매자 정산 실행(이체) — 관리자 전용 */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  let body: { sellerId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const sellerId = (body.sellerId ?? "").trim();
  if (!sellerId) {
    return NextResponse.json({ error: "판매자를 지정해 주세요." }, { status: 400 });
  }
  const seller = await getSeller(sellerId);
  if (!seller) {
    return NextResponse.json({ error: "판매자를 찾을 수 없습니다." }, { status: 404 });
  }

  const result = await executeSettlement(seller);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, settlement: result.settlement ?? null },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, settlement: result.settlement });
}
