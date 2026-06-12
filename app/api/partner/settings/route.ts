import { NextResponse } from "next/server";
import { getCurrentSeller, toPublicSeller } from "@/lib/seller";
import { updateSeller } from "@/lib/store";
import type { SettlementAccount } from "@/lib/types";

/** 판매자 정산 계좌·소개·연락처 수정 */
export async function PATCH(req: Request) {
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let body: {
    name?: string;
    phone?: string;
    intro?: string;
    settlement?: { bank?: string; account?: string; holder?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.phone === "string" && body.phone.trim()) patch.phone = body.phone.trim();
  if (typeof body.intro === "string") patch.intro = body.intro.trim() || undefined;

  if (body.settlement) {
    const bank = (body.settlement.bank ?? "").trim();
    const account = (body.settlement.account ?? "").trim();
    const holder = (body.settlement.holder ?? "").trim();
    if (bank && account && holder) {
      const settlement: SettlementAccount = { bank, account, holder };
      patch.settlement = settlement;
    } else if (!bank && !account && !holder) {
      patch.settlement = undefined;
    } else {
      return NextResponse.json(
        { error: "정산 계좌는 은행·계좌번호·예금주를 모두 입력해야 합니다." },
        { status: 400 },
      );
    }
  }

  const updated = await updateSeller(seller.id, patch);
  return NextResponse.json({ seller: updated ? toPublicSeller(updated) : null });
}
