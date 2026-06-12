"use client";

import { useRouter } from "next/navigation";

export default function PartnerLogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/partner/logout", { method: "POST" });
    router.push("/partner/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="btn-ghost">
      로그아웃
    </button>
  );
}
