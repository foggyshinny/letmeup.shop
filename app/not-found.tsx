import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-4 text-3xl font-extrabold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-ink-muted">요청하신 쿠폰이나 페이지가 존재하지 않습니다.</p>
      <Link href="/" className="btn-primary mt-6">홈으로 돌아가기</Link>
    </div>
  );
}
