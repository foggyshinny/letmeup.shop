import { NextResponse } from "next/server";
import { getCurrentSeller } from "@/lib/seller";
import { listProductsBySeller, newId, saveProduct } from "@/lib/store";
import { validateProductInput } from "@/lib/product";
import type { Coupon } from "@/lib/types";

/** 내 상품 목록 */
export async function GET() {
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  return NextResponse.json({ products: await listProductsBySeller(seller.id) });
}

/** 상품 등록 */
export async function POST(req: Request) {
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (seller.status !== "approved") {
    return NextResponse.json(
      { error: "승인 완료 후 상품을 등록할 수 있습니다." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const result = validateProductInput(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const now = new Date().toISOString();
  const product: Coupon = {
    id: newId("P").toLowerCase(),
    ...result.value,
    seller: seller.businessName,
    sellerId: seller.id,
    createdAt: now,
  };
  await saveProduct(product);
  return NextResponse.json({ product });
}
