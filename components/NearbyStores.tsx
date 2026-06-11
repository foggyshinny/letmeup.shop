"use client";

import { useEffect, useState } from "react";
import type { Store } from "@/lib/places";

type NearStore = Store & { distanceKm: number };

export default function NearbyStores() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "denied" | "error">(
    "idle",
  );
  const [nearby, setNearby] = useState<NearStore[]>([]);

  // 이전에 수집 동의한 위치가 있으면 자동으로 표시
  useEffect(() => {
    fetch("/api/location")
      .then((r) => r.json())
      .then((d) => {
        if (d.location && d.nearby?.length) {
          setNearby(d.nearby);
          setStatus("done");
        }
      })
      .catch(() => {});
  }, []);

  function findNearby() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          });
          const d = await res.json();
          setNearby(d.nearby ?? []);
          setStatus("done");
        } catch {
          setStatus("error");
        }
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <section className="container-page py-10">
      <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-100 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold">📍 내 주변 렛미업 매장</h2>
            <p className="mt-1 text-sm text-ink-muted">
              위치를 켜면 가까운 매장과 사용 가능한 쿠폰을 알려드려요.
            </p>
          </div>
          {status !== "done" && (
            <button onClick={findNearby} disabled={status === "loading"} className="btn-primary">
              {status === "loading" ? "위치 확인 중…" : "내 주변 찾기"}
            </button>
          )}
        </div>

        {status === "denied" && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용하면 가까운 매장을
            찾을 수 있어요.
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            위치를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {nearby.length > 0 && (
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {nearby.map((s) => (
              <li key={s.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold">{s.name}</span>
                  <span className="chip bg-brand-light text-brand">
                    {s.distanceKm < 1
                      ? `${Math.round(s.distanceKm * 1000)}m`
                      : `${s.distanceKm.toFixed(1)}km`}
                  </span>
                </div>
                <div className="mt-1 text-xs text-ink-muted">{s.address}</div>
                <div className="mt-1 text-xs text-ink-muted">운영 {s.hours}</div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-ink-muted">
          수집한 위치는 가까운 매장 안내 목적에만 사용되며, 동의를 철회할 수 있습니다.
        </p>
      </div>
    </section>
  );
}
