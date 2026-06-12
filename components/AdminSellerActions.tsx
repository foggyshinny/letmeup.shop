"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SellerStatus } from "@/lib/types";

export default function AdminSellerActions({
  id,
  status,
}: {
  id: string;
  status: SellerStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(next: SellerStatus) {
    setBusy(true);
    const r = await fetch(`/api/admin/sellers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (r.ok) router.refresh();
    else alert("처리에 실패했습니다.");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" && (
        <button
          onClick={() => patch("approved")}
          disabled={busy}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark"
        >
          승인
        </button>
      )}
      {status !== "suspended" && (
        <button
          onClick={() => patch("suspended")}
          disabled={busy}
          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
        >
          정지
        </button>
      )}
      {status === "suspended" && (
        <button
          onClick={() => patch("approved")}
          disabled={busy}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark"
        >
          정지 해제
        </button>
      )}
    </div>
  );
}
