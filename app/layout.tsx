import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "letmeup.shop — 쿠폰 할인 마켓",
  description:
    "스터디카페 이용권부터 카페·외식·기프트카드까지. 매일 새로운 할인 쿠폰을 가장 합리적인 가격에.",
  openGraph: {
    title: "letmeup.shop — 쿠폰 할인 마켓",
    description: "매일 새로운 할인 쿠폰을 가장 합리적인 가격에.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <CartProvider>
          <Header />
          <main className="min-h-[calc(100vh-var(--header-h))]">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
