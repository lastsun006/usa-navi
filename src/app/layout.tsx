import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "USA Navi — 初めてのアメリカ旅行をサポートするAIコンシェルジュ",
  description: "英語に不安がある方、子連れ旅行者、初めてのアメリカ個人旅行者のための AIコンシェルジュ。LAX移動・レストラン・ドジャース・ディズニーまで対応。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${noto.variable} font-[family-name:var(--font-noto)] min-h-full flex flex-col bg-white text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
