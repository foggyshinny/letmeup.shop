import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSeller } from "@/lib/seller";
import { getProduct } from "@/lib/store";
import PartnerProductForm, { type ProductFormValues } from "@/components/PartnerProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const seller = await getCurrentSeller();
  const { id } = await params;
  if (!seller) redirect(`/partner/login?next=/partner/products/${id}/edit`);

  const product = await getProduct(id);
  if (!product || product.sellerId !== seller.id) notFound();

  const initial: Partial<ProductFormValues> = {
    title: product.title,
    brand: product.brand,
    category: product.category,
    price: String(product.price),
    listPrice: String(product.listPrice),
    summary: product.summary,
    description: product.description,
    validity: product.validity,
    usage: product.usage.join("\n"),
    badges: product.badges.join("\n"),
    stock: product.stock === null ? "" : String(product.stock),
    thumb: product.thumb,
    status: product.status === "inactive" ? "inactive" : "active",
  };

  return (
    <div className="container-page max-w-3xl py-10">
      <Link href="/partner" className="text-sm font-semibold text-ink-muted hover:text-ink">
        ← 파트너 센터
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">상품 수정</h1>
      <PartnerProductForm productId={product.id} initial={initial} />
    </div>
  );
}
