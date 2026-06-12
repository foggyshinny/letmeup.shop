import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getSeller, updateSeller } from "@/lib/store";
import { toPublicSeller } from "@/lib/seller";
import type { SellerStatus } from "@/lib/types";

const ALLOWED: SellerStatus[] = ["pending", "approved", "suspended"];

/** 판매자 상태 변경(승인/정지) 및 수수료율 조정 — 관리자 전용 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  const seller = await getSeller(id);
  if (!seller) return NextResponse.json({ error: "판매자를 찾을 수 없습니다." }, { status: 404 });

  let body: { status?: string; commissionRate?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.status) {
    if (!ALLOWED.includes(body.status as SellerStatus)) {
      return NextResponse.json({ error: "알 수 없는 상태입니다." }, { status: 400 });
    }
    patch.status = body.status;
    if (body.status === "approved" && !seller.approvedAt) {
      patch.approvedAt = new Date().toISOString();
    }
  }
  if (typeof body.commissionRate === "number") {
    const r = body.commissionRate;
    if (r < 0 || r >= 1) {
      return NextResponse.json({ error: "수수료율은 0 이상 1 미만이어야 합니다." }, { status: 400 });
    }
    patch.commissionRate = r;
  }

  const updated = await updateSeller(id, patch);
  return NextResponse.json({
    ok: true,
    seller: updated ? toPublicSeller(updated) : null,
  });
}
