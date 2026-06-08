import { NextResponse } from "next/server";
import { getDeviceId } from "@/lib/device";
import { removePaymentMethod, setDefaultPaymentMethod } from "@/lib/store";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deviceId = await getDeviceId();
  const ok = removePaymentMethod(deviceId, id);
  if (!ok) return NextResponse.json({ error: "결제수단을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deviceId = await getDeviceId();
  const ok = setDefaultPaymentMethod(deviceId, id);
  if (!ok) return NextResponse.json({ error: "결제수단을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
