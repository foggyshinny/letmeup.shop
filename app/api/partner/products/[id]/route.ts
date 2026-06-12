import { NextResponse } from "next/server";
import { getCurrentSeller } from "@/lib/seller";
import { deleteProduct, getProduct, saveProduct } from "@/lib/store";
import { applyProductInput, validateProductInput } from "@/lib/product";

/** 상품 수정 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const existing = await getProduct(id);
  if (!existing || existing.sellerId !== seller.id) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const result = validateProductInput(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const updated = applyProductInput(existing, result.value);
  await saveProduct(updated);
  return NextResponse.json({ product: updated });
}

/** 상품 삭제 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const existing = await getProduct(id);
  if (!existing || existing.sellerId !== seller.id) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
}
