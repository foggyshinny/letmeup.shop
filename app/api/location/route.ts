import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/device";
import { getLocation, saveLocation } from "@/lib/store";
import { nearestStores } from "@/lib/places";

export async function GET() {
  const deviceId = await getOwnerId();
  const loc = getLocation(deviceId);
  if (!loc) return NextResponse.json({ location: null, nearby: [] });
  return NextResponse.json({
    location: loc,
    nearby: nearestStores({ lat: loc.lat, lng: loc.lng }),
  });
}

/** 사용자 동의 후 수집한 위치를 저장하고, 가까운 매장을 반환 */
export async function POST(req: Request) {
  const deviceId = await getOwnerId();
  let body: { lat?: number; lng?: number; accuracy?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { lat, lng, accuracy } = body;
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json({ error: "좌표가 올바르지 않습니다." }, { status: 400 });
  }

  const rec = saveLocation(deviceId, {
    lat,
    lng,
    accuracy,
    consentedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    location: rec,
    nearby: nearestStores({ lat, lng }),
  });
}
