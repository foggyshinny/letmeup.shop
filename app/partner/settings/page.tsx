import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/lib/seller";
import PartnerSettingsForm from "@/components/PartnerSettingsForm";

export const dynamic = "force-dynamic";

export default async function PartnerSettingsPage() {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/partner/login?next=/partner/settings");

  return (
    <div className="container-page max-w-xl py-10">
      <Link href="/partner" className="text-sm font-semibold text-ink-muted hover:text-ink">
        ← 파트너 센터
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">판매자 정보</h1>
      <p className="mt-2 text-ink-muted">담당자 정보와 정산 계좌를 관리합니다.</p>

      <PartnerSettingsForm
        initial={{
          name: seller.name,
          phone: seller.phone,
          intro: seller.intro ?? "",
          bank: seller.settlement?.bank ?? "",
          account: seller.settlement?.account ?? "",
          holder: seller.settlement?.holder ?? "",
        }}
      />
    </div>
  );
}
