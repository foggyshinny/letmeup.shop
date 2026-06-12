import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/lib/seller";
import PartnerProductForm from "@/components/PartnerProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/partner/login?next=/partner/products/new");
  if (seller.status !== "approved") redirect("/partner");

  return (
    <div className="container-page max-w-3xl py-10">
      <Link href="/partner" className="text-sm font-semibold text-ink-muted hover:text-ink">
        ← 파트너 센터
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">상품 등록</h1>
      <p className="mt-2 text-ink-muted">
        등록 즉시 스토어에 노출됩니다. 판매자명은 “{seller.businessName}”으로 표시됩니다.
      </p>
      <PartnerProductForm />
    </div>
  );
}
