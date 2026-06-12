"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PartnerProductActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("이 상품을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setBusy(true);
    const r = await fetch(`/api/partner/products/${id}`, { method: "DELETE" });
    setBusy(false);
    if (r.ok) router.refresh();
    else alert("삭제에 실패했습니다.");
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/partner/products/${id}/edit`} className="text-sm font-semibold text-brand">
        수정
      </Link>
      <button
        onClick={remove}
        disabled={busy}
        className="text-sm font-semibold text-ink-muted hover:text-accent"
      >
        삭제
      </button>
    </div>
  );
}
