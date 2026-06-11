export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: string;
}

/** 렛미업 가맹 매장 (시드 데이터). 실제 운영 시 DB/지도 API로 교체. */
export const stores: Store[] = [
  { id: "gangnam", name: "렛미업 강남점", address: "서울 강남구 테헤란로 123", lat: 37.4979, lng: 127.0276, hours: "24시간" },
  { id: "hongdae", name: "렛미업 홍대점", address: "서울 마포구 양화로 45", lat: 37.5563, lng: 126.9236, hours: "24시간" },
  { id: "jamsil", name: "렛미업 잠실점", address: "서울 송파구 올림픽로 300", lat: 37.5133, lng: 127.1, hours: "06:00–24:00" },
  { id: "sinchon", name: "렛미업 신촌점", address: "서울 서대문구 신촌로 83", lat: 37.5552, lng: 126.9368, hours: "24시간" },
  { id: "pangyo", name: "렛미업 판교점", address: "경기 성남시 분당구 판교역로 152", lat: 37.3947, lng: 127.1112, hours: "24시간" },
  { id: "bucheon", name: "렛미업 부천점", address: "경기 부천시 길주로 100", lat: 37.5036, lng: 126.766, hours: "06:00–24:00" },
  { id: "suwon", name: "렛미업 수원역점", address: "경기 수원시 팔달구 덕영대로 924", lat: 37.2659, lng: 127.0001, hours: "24시간" },
  { id: "incheon", name: "렛미업 인천송도점", address: "인천 연수구 컨벤시아대로 165", lat: 37.3894, lng: 126.6398, hours: "24시간" },
];

/** 두 좌표 간 거리(km) — 하버사인 공식 */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 현재 위치에서 가까운 매장 순으로 정렬 */
export function nearestStores(
  point: { lat: number; lng: number },
  limit = 3,
): (Store & { distanceKm: number })[] {
  return stores
    .map((s) => ({ ...s, distanceKm: distanceKm(point, s) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
