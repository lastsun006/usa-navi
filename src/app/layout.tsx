import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-noto",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LA・SoCal コンシェルジュ | ロサンゼルス旅行を日本語でサポート",
  description: "ロサンゼルス・南カリフォルニア旅行を日本語でサポートするAIコンシェルジュ。LAX移動・Uber/Lyft・レストラン予約・ドジャース・ディズニー・治安情報・お土産まで、旅行前から旅行中までLINEで何でも相談できます。",
  keywords: ["ロサンゼルス 旅行", "LA 観光 日本語", "SoCal 旅行", "LAX 行き方", "ロサンゼルス コンシェルジュ", "アメリカ旅行 日本語サポート", "LA 日本語ガイド", "ドジャース 観戦", "ディズニーランド 攻略", "Uber Lyft 使い方", "ロサンゼルス レストラン 予約", "南カリフォルニア 旅行 日本人"],
  authors: [{ name: "Yorozu LLC" }],
  creator: "Yorozu LLC",
  publisher: "Yorozu LLC",
  metadataBase: new URL("https://lasocalconcierge.vercel.app"),
  alternates: {
    canonical: "https://lasocalconcierge.vercel.app",
  },
  openGraph: {
    title: "LA・SoCal コンシェルジュ | ロサンゼルス旅行を日本語でサポート",
    description: "ロサンゼルス・南カリフォルニア旅行を日本語でサポートするAIコンシェルジュ。LAX移動・レストラン予約・治安情報まで、LINEで何でも相談できます。",
    url: "https://lasocalconcierge.vercel.app",
    siteName: "LA・SoCal コンシェルジュ",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "LA・SoCal コンシェルジュ — ロサンゼルス旅行を日本語でサポート",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LA・SoCal コンシェルジュ | ロサンゼルス旅行を日本語でサポート",
    description: "ロサンゼルス・南カリフォルニア旅行を日本語でサポートするAIコンシェルジュ。LAXからお土産まで、LINEで日本語対応。",
    images: ["/hero-bg.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
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
      <body className={`${noto.variable} ${inter.variable} font-[family-name:var(--font-noto)] min-h-full flex flex-col bg-white text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
