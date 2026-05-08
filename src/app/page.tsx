"use client";

import { useEffect } from "react";

const LINE_URL = "https://lin.ee/t8do1LO";

// ── LINE SVG Icon ──────────────────────────────────────────
function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18 3C9.16 3 2 8.74 2 15.81c0 6.34 5.68 11.65 13.36 12.65.52.11 1.23.34 1.41.79.16.4.1 1.03.05 1.43l-.23 1.37c-.07.4-.32 1.58 1.39.86 1.71-.72 9.21-5.43 12.57-9.29 2.32-2.55 3.45-5.13 3.45-8 0-7.07-7.16-12.81-16-12.81zM10.93 19.97H7.74c-.46 0-.84-.38-.84-.84v-6.38c0-.46.38-.84.84-.84.46 0 .84.38.84.84v5.54h2.35c.46 0 .84.38.84.84 0 .46-.38.84-.84.84zm3.45-.84c0 .46-.38.84-.84.84-.46 0-.84-.38-.84-.84v-6.38c0-.46.38-.84.84-.84.46 0 .84.38.84.84v6.38zm7.7 0c0 .36-.23.68-.57.79-.09.03-.18.05-.27.05-.27 0-.5-.12-.67-.34l-3.27-4.45v3.95c0 .46-.38.84-.84.84-.46 0-.84-.38-.84-.84v-6.38c0-.36.23-.68.57-.79.08-.03.18-.05.27-.05.26 0 .5.13.67.34l3.27 4.45v-3.95c0-.46.38-.84.84-.84.46 0 .84.38.84.84v6.38zm5.16-3.97c.46 0 .84.38.84.84 0 .46-.38.84-.84.84h-2.35v1.5h2.35c.46 0 .84.38.84.84 0 .46-.38.84-.84.84h-3.19c-.46 0-.84-.38-.84-.84v-6.38c0-.46.38-.84.84-.84h3.19c.46 0 .84.38.84.84 0 .46-.38.84-.84.84h-2.35v1.51h2.35z"/>
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  );
}

// ── Sticky CTA Observer ────────────────────────────────────
function useStickyCtaObserver() {
  useEffect(() => {
    const sticky = document.getElementById("sticky-cta");
    if (!sticky) return;

    let heroVisible = true;
    let finalVisible = false;

    const update = () => {
      if (heroVisible || finalVisible) {
        sticky.classList.add("hidden-cta");
      } else {
        sticky.classList.remove("hidden-cta");
      }
    };

    const heroObs = new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      update();
    }, { threshold: 0.01 });

    const finalObs = new IntersectionObserver(([e]) => {
      finalVisible = e.isIntersecting;
      update();
    }, { threshold: 0.01 });

    const hero = document.getElementById("hero");
    const finalCta = document.getElementById("final-cta");
    if (hero) heroObs.observe(hero);
    if (finalCta) finalObs.observe(finalCta);

    return () => {
      heroObs.disconnect();
      finalObs.disconnect();
    };
  }, []);
}

// ── JSON-LD 構造化データ ───────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "LA・SoCal コンシェルジュ",
  "alternateName": "Yorozu LLC",
  "description": "ロサンゼルス・南カリフォルニア旅行を日本語でサポートするAIコンシェルジュ。LAX移動・レストラン予約・治安情報・お土産まで、LINEで何でも相談できます。",
  "url": "https://lasocalconcierge.vercel.app",
  "logo": "https://lasocalconcierge.vercel.app/hero-bg.jpg",
  "image": "https://lasocalconcierge.vercel.app/hero-bg.jpg",
  "areaServed": {
    "@type": "Place",
    "name": "Los Angeles, Southern California, USA"
  },
  "availableLanguage": ["Japanese", "English"],
  "serviceType": ["旅行コンシェルジュ", "AIアシスタント", "翻訳・通訳サポート", "レストラン予約代行"],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "availableLanguage": "Japanese",
    "url": "https://lasocalconcierge.vercel.app/contact"
  },
  "sameAs": ["https://lin.ee/t8do1LO"],
  "keywords": "ロサンゼルス旅行,LA観光,SoCal,日本語サポート,LAX,コンシェルジュ,ドジャース,ディズニーランド,治安情報,レストラン予約"
};

// ── Main Page ──────────────────────────────────────────────
export default function Home() {
  useStickyCtaObserver();

  return (
    <div className="bg-[#F8F7F4] text-[#0F172A] antialiased overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ══ HERO ══ */}
      <section id="hero" className="hero-bg relative min-h-[100svh] flex flex-col text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(120% 80% at 50% 30%, transparent 40%, rgba(0,0,0,0.45) 100%)" }} />
        <div className="absolute inset-x-0 top-0 h-[180px] pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-[85%] pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(8,12,24,0.55) 28%, rgba(8,12,24,0.92) 60%, rgba(8,12,24,1) 100%)" }} />

        <div className="relative z-10 max-w-md mx-auto w-full flex-1 flex flex-col px-7 pt-12 pb-10">

          <div className="rise flex items-center" style={{ animationDelay: "0ms" }}>
            <span className="font-en text-white/85 text-[10px] tracking-[0.32em] uppercase font-semibold">N 34° · W 118°</span>
          </div>

          <div className="mt-auto">

            <div className="rise relative" style={{ animationDelay: "160ms" }}>
              <h1 className="hero-headline font-black text-white" style={{ lineHeight: 1.32, letterSpacing: "-0.04em" }}>
                <span className="block" style={{ fontSize: "clamp(19px, 5.6vw, 26px)" }}>
                  初めての<span className="text-[#F59E0B]"> LA &amp; SoCal </span>でも、
                </span>
                <span className="block mt-2" style={{ fontSize: "clamp(20px, 6vw, 28px)" }}>
                  旅の「これどうする？」を<br /><span className="text-[#F59E0B]">日本語</span>で。
                </span>
              </h1>
            </div>

            <p className="rise mt-6 text-white text-[14.5px] leading-[1.95] font-medium hero-sub" style={{ animationDelay: "240ms" }}>
              LAXからホテルへの行き方、<span className="text-[#F59E0B] font-bold">Uber・Lyft</span>の乗り方、ホテルエリア、治安、レストラン予約、お土産まで。<br />
              旅行前から旅行中まで <span className="text-[#F59E0B] font-bold">LINE</span> で使える日本語AIコンシェルジュ。<span className="text-white/85">英語電話の代行も。</span>
            </p>

            <div className="rise mt-9" style={{ animationDelay: "340ms" }}>
              <a href={LINE_URL} target="_blank" rel="noopener"
                className="line-btn text-white text-[15px] font-bold rounded-full pl-5 pr-6 py-[14px] inline-flex items-center gap-2.5 whitespace-nowrap">
                <span className="w-7 h-7 rounded-full bg-white grid place-items-center flex-shrink-0">
                  <LineIcon className="w-5 h-5 text-[#06C755]" />
                </span>
                LINEで旅の準備を始める
                <ArrowRight className="w-4 h-4 -mr-1" />
              </a>
              <div className="mt-3 text-[11px] text-white/55 font-medium">友だち追加だけ／登録不要</div>
            </div>

            <div className="rise mt-10 pt-5 border-t border-white/20 flex items-center justify-between" style={{ animationDelay: "440ms" }}>
              <span className="font-en text-white/65 text-[10px] tracking-[0.28em] uppercase">Est. 2025 — Yorozu</span>
              <div className="flex items-center gap-1.5">
                <span className="font-en text-white/80 text-[10px] tracking-[0.28em] uppercase">Scroll</span>
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white/80" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROBLEMS ══ */}
      <section className="bg-white">
        <div className="max-w-md mx-auto px-6 py-24">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-6 h-px bg-[#0F172A]/30" />
              <span className="eyebrow font-en text-[#0F172A]/50">The Problem</span>
            </div>
            <h2 className="text-[30px] leading-[1.25] font-black text-[#0F172A]" style={{ letterSpacing: "-0.04em" }}>
              旅先の小さな不安が、<br />大きなストレスに。
            </h2>
          </div>

          <ul className="flex flex-col gap-3">
            {[
              { num: "01", title: "LAX到着後の動き方が分からない", desc: "入国審査、荷物受け取り、Uber・Lyft乗り場——初めての空港は迷子になりがち。" },
              { num: "02", title: "Uber・Lyftの使い方が不安", desc: "アプリの設定から乗り場まで、初めては戸惑うポイントだらけ。" },
              { num: "03", title: "治安が分からない・夜歩いていいか不安", desc: "ホテル周辺の安全性、夜のエリアリスクを日本語で教えてくれる人がいない。" },
              { num: "04", title: "英語での電話・予約が不安", desc: "レストランの予約、空席確認、在庫確認——英語電話が必要なシーンで止まってしまう。" },
              { num: "05", title: "お土産買い回りが大変", desc: "トレジョ、Costco、CVS——どこで何を買えばいいか分からず時間を浪費する。" },
              { num: "06", title: "職場のばらまき土産が悩みの種", desc: "人数分、個包装、喜ばれるもの——毎回悩んで時間と体力を消耗する。" },
            ].map((p) => (
              <li key={p.num} className="border border-black/8 rounded-2xl p-5 bg-white flex items-start gap-4">
                <span className="font-en font-bold text-[#F59E0B] bg-[#F59E0B]/10 text-[13px] rounded-lg w-8 h-8 flex-shrink-0 grid place-items-center"
                  style={{ letterSpacing: "-0.04em" }}>{p.num}</span>
                <div>
                  <p className="text-[14px] font-bold text-[#0F172A] leading-snug">{p.title}</p>
                  <p className="mt-1 text-[12.5px] leading-[1.65] text-[#0F172A]/60">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ WHAT WE DO ══ */}
      <section className="bg-[#F4F3EF]">
        <div className="max-w-md mx-auto px-6 py-24">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-6 h-px bg-[#0F172A]/30" />
              <span className="eyebrow font-en text-[#0F172A]/50">What we do</span>
            </div>
            <h2 className="text-[30px] leading-[1.25] font-black text-[#0F172A]" style={{ letterSpacing: "-0.04em" }}>
              できる<span className="text-[#F59E0B]">こと</span>。
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* LAX */}
            <div className="bg-white border border-black/8 rounded-2xl p-4 flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-[#F59E0B] grid place-items-center mb-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
              </div>
              <h3 className="text-[14px] font-bold text-[#0F172A] leading-tight">LAX・空港移動</h3>
              <p className="mt-1.5 text-[12px] leading-[1.65] text-[#0F172A]/65">入国、荷物受け取り、Uber・Lyft乗り場、ホテルまでの移動を日本語で。</p>
            </div>
            {/* Photo */}
            <div className="bg-white border border-black/8 rounded-2xl p-4 flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-[#F59E0B] grid place-items-center mb-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>
              </div>
              <h3 className="text-[14px] font-bold text-[#0F172A] leading-tight">写真付き現地ガイド</h3>
              <p className="mt-1.5 text-[12px] leading-[1.65] text-[#0F172A]/65">乗り場、動線、観光地の注意点を写真付きで案内。</p>
            </div>
            {/* Safety */}
            <div className="bg-white border border-black/8 rounded-2xl p-4 flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-[#F59E0B] grid place-items-center mb-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
              </div>
              <h3 className="text-[14px] font-bold text-[#0F172A] leading-tight">治安・エリアチェック</h3>
              <p className="mt-1.5 text-[12px] leading-[1.65] text-[#0F172A]/65">ホテル周辺、観光地、夜歩きOKか日本語で確認。</p>
            </div>
            {/* Hotel */}
            <div className="bg-white border border-black/8 rounded-2xl p-4 flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-[#F59E0B] grid place-items-center mb-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M3 21h18"/><rect x="9" y="13" width="6" height="8"/></svg>
              </div>
              <h3 className="text-[14px] font-bold text-[#0F172A] leading-tight">ホテル・観光相談</h3>
              <p className="mt-1.5 text-[12px] leading-[1.65] text-[#0F172A]/65">エリア選び、レンタカー、ルート、子連れ相談まで。</p>
            </div>
            {/* English Phone */}
            <div className="bg-[#0F172A] text-white border border-[#0F172A] rounded-2xl p-4 flex flex-col">
              <div className="w-9 h-9 rounded-lg bg-[#F59E0B] text-[#0F172A] grid place-items-center mb-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <h3 className="text-[14px] font-bold text-[#F59E0B] leading-tight">英語電話・予約代行</h3>
              <p className="mt-1.5 text-[12px] leading-[1.65] text-white/75">レストラン予約、空席・在庫・営業時間の確認まで代行。</p>
            </div>
            {/* Souvenir */}
            <div className="bg-[#F59E0B] text-[#0F172A] border border-[#F59E0B] rounded-2xl p-4 flex flex-col relative">
              <span className="absolute top-3 right-3 text-[9px] font-en font-bold tracking-wider uppercase bg-[#0F172A] text-[#F59E0B] rounded-full px-2 py-0.5">Coming soon</span>
              <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-[#F59E0B] grid place-items-center mb-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="16" height="13" rx="2"/><path d="M4 12h16"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/></svg>
              </div>
              <h3 className="text-[14px] font-bold text-[#0F172A] leading-tight">お土産・ホテル受取</h3>
              <p className="mt-1.5 text-[12px] leading-[1.65] text-[#0F172A]/75">トレジョ・職場ばらまき・人気セットを専用サイトで注文、滞在ホテル受け取り。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="bg-white">
        <div className="max-w-md mx-auto px-6 py-24">
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-6 h-px bg-[#0F172A]/30" />
              <span className="eyebrow font-en text-[#0F172A]/50">How to use</span>
            </div>
            <h2 className="text-[30px] leading-[1.25] font-black text-[#0F172A]" style={{ letterSpacing: "-0.04em" }}>使い方。</h2>
          </div>

          <ol className="relative pl-8 flex flex-col gap-10">
            <span className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-[#F59E0B]/60 via-[#0F172A]/15 to-transparent" />
            {[
              { step: "1", label: "Step 01", title: "LINEで友だち追加", desc: "QRまたはリンクをタップするだけ。アプリ追加・会員登録は不要です。", extra: null },
              { step: "2", label: "Step 02", title: "日本語で聞く", desc: "旅行前の準備、LAXからの移動、ホテルエリア、治安、レストラン予約などを日本語で確認できます。",
                extra: (
                  <div className="mt-4 rounded-xl bg-[#F4F3EF] p-4 border border-black/5">
                    <div className="eyebrow font-en text-[#0F172A]/40 mb-2.5">相談例</div>
                    <ul className="flex flex-col gap-2 text-[12.5px] leading-[1.6] text-[#0F172A]/70">
                      <li>「LAXからホテルまでUberで行くには？」</li>
                      <li>「Uber・Lyftの乗り場を写真付きで見たい」</li>
                      <li>「このホテル周辺は夜歩いて大丈夫？」</li>
                      <li>「明日の夜7時に2名で予約してほしい」</li>
                    </ul>
                  </div>
                )
              },
              { step: "3", label: "Step 03", title: "予約代行はLINEで依頼", desc: "レストラン予約、空席確認、営業時間確認など、英語電話が必要な場面を代行します。内容を日本語で送るだけ。", extra: null },
              { step: "4", label: "Step 04", title: "お土産セットは専用サイトで注文", desc: "トレジョ人気セット、職場ばらまきセットなどを選んで注文。注文後、滞在ホテルでの受け取り方法をご案内します。", extra: null },
            ].map((s) => (
              <li key={s.step} className="relative">
                <span className="absolute -left-8 top-1 w-[22px] h-[22px] rounded-full bg-[#F59E0B] grid place-items-center font-en font-bold text-[11px] text-[#0F172A]">{s.step}</span>
                <div className="font-en eyebrow text-[#0F172A]/40 mb-1.5">{s.label}</div>
                <h3 className="text-[20px] font-bold text-[#0F172A] leading-snug" style={{ letterSpacing: "-0.02em" }}>{s.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.8] text-[#0F172A]/65">{s.desc}</p>
                {s.extra}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ ENGLISH CALL AGENT ══ */}
      <section className="bg-[#F4F3EF]">
        <div className="max-w-md mx-auto px-6 py-24">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-6 h-px bg-[#0F172A]/30" />
              <span className="eyebrow font-en text-[#0F172A]/50">English call agent</span>
            </div>
            <h2 className="text-[30px] leading-[1.25] font-black text-[#0F172A]" style={{ letterSpacing: "-0.04em" }}>
              英語の電話、<br />代わりにかけます。
            </h2>
            <p className="mt-5 text-[14px] leading-[1.85] text-[#0F172A]/65">
              レストランの予約、空席確認、在庫確認、営業時間の問い合わせ——英語電話が必要なシーンをすべて代行。結果を日本語でご報告します。
            </p>
          </div>

          {/* LINE Chat mockup — real conversation flow */}
          <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
            {/* LINE header */}
            <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: "#0F172A" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
              <div className="flex-1 text-center">
                <p className="text-white text-[13px] font-bold leading-none">LA&amp;Socal コンシェルジュ</p>
              </div>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>

            {/* Chat body */}
            <div className="flex flex-col gap-3 px-3 py-4 overflow-y-auto" style={{ background: "#BFC4CA", backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 12px)", maxHeight: "520px" }}>

              {/* User: 備考リクエスト */}
              <div className="flex justify-end items-end gap-1">
                <span className="text-[10px] text-white/60 self-end mb-0.5">既読<br/>1:56</span>
                <div className="text-[13px] font-medium px-3.5 py-2 rounded-[18px] rounded-tr-[4px] max-w-[70%]" style={{ background: "#F5DD29", color: "#0F172A" }}>
                  子供用の椅子が欲しい
                </div>
              </div>

              {/* Bot: 確認メッセージ */}
              <div className="flex items-end gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 self-end">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/IMG_9110.PNG" alt="bot" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 max-w-[75%]">
                  <div className="text-[11px] text-white/80 ml-1 mb-0.5">LA&amp;Socal コンシェルジュ</div>
                  <div className="bg-white text-[#0F172A] text-[12.5px] px-3.5 py-3 rounded-[18px] rounded-tl-[4px] leading-[1.75] shadow-sm">
                    📞 以下の内容で電話をかけます。よろしいですか？<br />
                    <span className="inline-block mt-1.5 space-y-0.5">
                      🍽️ お店: Bestia<br />
                      📅 日時: Sunday, May 10 19:00<br />
                      👥 人数: 5名<br />
                      👤 予約名: Tanaka<br />
                      📝 備考: 子供用の椅子が欲しい
                    </span>
                  </div>
                  <span className="text-[10px] text-white/60 ml-1">1:56</span>
                </div>
              </div>

              {/* User: 確認タップ */}
              <div className="flex justify-end items-end gap-1">
                <span className="text-[10px] text-white/60 self-end mb-0.5">既読<br/>1:56</span>
                <div className="text-[12px] font-medium px-3.5 py-2 rounded-[18px] rounded-tr-[4px]" style={{ background: "#F5DD29", color: "#0F172A" }}>
                  ✅ 確認して発信
                </div>
              </div>

              {/* Bot: 電話中 */}
              <div className="flex items-end gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 self-end">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/IMG_9110.PNG" alt="bot" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 max-w-[75%]">
                  <div className="bg-white text-[#0F172A] text-[12.5px] px-3.5 py-3 rounded-[18px] rounded-tl-[4px] leading-[1.75] shadow-sm">
                    📞 電話をかけています...<br /><br />
                    Bestia に英語で連絡中です。<br />数分後に結果をお届けします🔔
                  </div>
                  <span className="text-[10px] text-white/60 ml-1">1:56</span>
                </div>
              </div>

              {/* Bot: 別時間の提案 */}
              <div className="flex items-end gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 self-end">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/IMG_9110.PNG" alt="bot" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 max-w-[75%]">
                  <div className="bg-white text-[#0F172A] text-[12.5px] px-3.5 py-3 rounded-[18px] rounded-tl-[4px] leading-[1.75] shadow-sm">
                    🕐 Bestia から「20時なら予約できます」とのことでした。<br /><br />
                    20時（同じ条件）で予約を取り直しますか？
                  </div>
                  <span className="text-[10px] text-white/60 ml-1">1:57</span>
                </div>
              </div>

              {/* User: 再予約タップ */}
              <div className="flex justify-end items-end gap-1">
                <span className="text-[10px] text-white/60 self-end mb-0.5">既読<br/>1:58</span>
                <div className="text-[12px] font-medium px-3.5 py-2 rounded-[18px] rounded-tr-[4px]" style={{ background: "#F5DD29", color: "#0F172A" }}>
                  ✅ 20時で予約する
                </div>
              </div>

              {/* Bot: 再発信中 */}
              <div className="flex items-end gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 self-end">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/IMG_9110.PNG" alt="bot" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 max-w-[75%]">
                  <div className="bg-white text-[#0F172A] text-[12.5px] px-3.5 py-3 rounded-[18px] rounded-tl-[4px] leading-[1.75] shadow-sm">
                    📞 Bestia に20時で再予約の電話をかけています...<br />
                    結果はLINEでお知らせします📱
                  </div>
                  <span className="text-[10px] text-white/60 ml-1">1:58</span>
                </div>
              </div>

              {/* Bot: 予約完了 */}
              <div className="flex items-end gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 self-end">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/IMG_9110.PNG" alt="bot" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 max-w-[75%]">
                  <div className="bg-white text-[#0F172A] text-[12.5px] px-3.5 py-3 rounded-[18px] rounded-tl-[4px] leading-[1.75] shadow-sm">
                    ✅ Bestia への予約が完了しました！<br />
                    <span className="inline-block mt-1.5">
                      📅 日時：5月10日（日）20時<br />
                      👥 人数：5名<br />
                      👤 予約名：Tanaka<br />
                      📝 備考：子供用椅子のリクエストあり
                    </span>
                  </div>
                  <span className="text-[10px] text-white/60 ml-1">1:59</span>
                </div>
              </div>

            </div>

            {/* LINE input bar */}
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "#F0EFE9" }}>
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0F172A]/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
              <div className="flex-1 bg-white rounded-full px-4 py-1.5 text-[13px] text-[#0F172A]/30">Aa</div>
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#0F172A]/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {["レストラン予約", "空席確認", "営業時間", "在庫確認", "忘れ物", "子連れ可否"].map((t) => (
              <span key={t} className="text-[12px] bg-white border border-black/8 text-[#0F172A]/70 rounded-full px-3 py-1">{t}</span>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-[#0F172A] p-5 text-white">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <h3 className="text-[15px] font-bold">英語電話・予約代行</h3>
              <span className="font-en font-bold text-[#F59E0B] text-[18px]">$12 <span className="text-[12px] text-white/55 font-medium">/ 3回〜</span></span>
            </div>
            <p className="text-[12.5px] leading-[1.7] text-white/60">現地店舗への英語電話、予約確認、結果の日本語報告。</p>
            <a href={LINE_URL} target="_blank" rel="noopener"
              className="mt-4 line-btn text-white text-[14px] font-bold rounded-full px-5 py-3 inline-flex items-center gap-2">
              <LineIcon className="w-5 h-5" />
              LINEで試してみる
            </a>
          </div>
        </div>
      </section>

      {/* ══ BEFORE / DURING ══ */}
      <section className="bg-[#0F172A] text-white relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/40 to-transparent" />
        <div className="max-w-md mx-auto px-6 py-24">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-6 h-px bg-[#F59E0B]" />
              <span className="eyebrow font-en text-[#F59E0B]">Before · During</span>
            </div>
            <h2 className="text-[30px] leading-[1.25] font-black" style={{ letterSpacing: "-0.04em" }}>
              旅の<span className="text-[#F59E0B]">前</span>も、<br />旅の<span className="text-[#F59E0B]">途中</span>も。
            </h2>
            <p className="mt-5 text-[14px] leading-[1.85] text-white/65">出発前の準備から現地滞在中まで、LINEでそのまま使えます。</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] grid place-items-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16"/><path d="M9 4v4M15 4v4"/></svg>
                </span>
                <h3 className="text-[15px] font-bold">旅行前にできること</h3>
              </div>
              <ul className="flex flex-col gap-2 text-[13px] leading-[1.7] text-white/70">
                {["ホテルエリア相談", "LAX到着後の移動確認", "Uber・Lyftの乗り方確認", "レストラン予約相談", "お土産セットの事前確認", "eSIM・持ち物チェック", "治安が気になるエリアの確認"].map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-[#F59E0B]">·</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] grid place-items-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
                </span>
                <h3 className="text-[15px] font-bold">旅行中にできること</h3>
              </div>
              <ul className="flex flex-col gap-2 text-[13px] leading-[1.7] text-white/70">
                {["英語電話代行", "レストラン予約", "空席・在庫確認", "LAX・ホテル・観光地の移動相談", "治安チェック", "お土産セットのホテル受け取り", "忘れ物問い合わせ", "急な予定変更の相談"].map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-[#F59E0B]">·</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section className="bg-white">
        <div className="max-w-md mx-auto px-6 py-24">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-6 h-px bg-[#0F172A]/30" />
              <span className="eyebrow font-en text-[#0F172A]/50">Pricing</span>
            </div>
            <h2 className="text-[30px] leading-[1.25] font-black text-[#0F172A]" style={{ letterSpacing: "-0.04em" }}>料金。</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-black/8 p-5">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="text-[16px] font-bold text-[#0F172A]">AIコンシェルジュ</h3>
                <div className="font-en font-bold text-[#F59E0B] text-[18px]">無料</div>
              </div>
              <p className="text-[12.5px] leading-[1.7] text-[#0F172A]/60">旅行前の準備、ホテルエリア、観光、移動、治安、お土産セットの案内をLINEで利用できます。</p>
            </div>
            <div className="rounded-2xl border border-[#F59E0B]/40 p-5 bg-[#F59E0B]/[0.06]">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="text-[16px] font-bold text-[#0F172A]">英語電話・予約代行</h3>
                <div className="font-en font-bold text-[#0F172A] text-[18px]">$12 <span className="text-[12px] text-[#0F172A]/55 font-medium">/ 3回〜</span></div>
              </div>
              <p className="text-[12.5px] leading-[1.7] text-[#0F172A]/60">現地店舗への英語電話、予約確認、空席確認、在庫確認、結果の日本語報告。</p>
            </div>
            <div className="rounded-2xl border border-black/8 p-5">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="text-[16px] font-bold text-[#0F172A]">お土産セット・ホテル受け取り</h3>
                <div className="font-en font-bold text-[#0F172A] text-[13px]">実費・手数料</div>
              </div>
              <p className="text-[12.5px] leading-[1.7] text-[#0F172A]/60">用途別のお土産セットを専用サイトで注文し、滞在ホテルで受け取れます。</p>
            </div>
          </div>

          <ul className="mt-6 flex flex-col gap-1.5 text-[11px] leading-[1.6] text-[#0F172A]/50">
            <li>※ ホテルによっては荷物受け取りに制限がある場合があります。</li>
            <li>※ 対応エリア・配送時間は注文画面でご確認ください。</li>
          </ul>
        </div>
      </section>

      {/* ══ RECOMMENDED FOR ══ */}
      <section className="bg-[#F4F3EF]">
        <div className="max-w-md mx-auto px-6 py-24">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-6 h-px bg-[#0F172A]/30" />
              <span className="eyebrow font-en text-[#0F172A]/50">Recommended for</span>
            </div>
            <h2 className="text-[30px] leading-[1.25] font-black text-[#0F172A]" style={{ letterSpacing: "-0.04em" }}>
              こんな方に<br />おすすめです。
            </h2>
          </div>

          <ul className="flex flex-col gap-2.5">
            {[
              "初めてLA・南カリフォルニアに行く方",
              "LAX到着後の動き方が不安な方",
              "英語に自信がない方",
              "子連れ・家族旅行の方",
              "レストランの予約や問い合わせに困る方",
              "治安が心配で夜の行動に迷う方",
              "職場のばらまき土産に毎回悩む方",
              "Uber・Lyftを初めて使う方",
              "旅行前に現地情報をしっかり把握したい方",
              "旅先でリアルタイムに質問したい方",
            ].map((t) => (
              <li key={t} className="bg-white rounded-xl px-4 py-3.5 flex items-start gap-3 border border-black/5">
                <span className="text-[#F59E0B] font-bold mt-0.5">✓</span>
                <span className="text-[13.5px] leading-[1.6] text-[#0F172A]/80">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section id="final-cta" className="bg-[#0F172A] text-white">
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="flex-1 h-px bg-white/10 max-w-[60px]" />
            <span className="eyebrow font-en text-[#F59E0B]">Start free</span>
            <span className="flex-1 h-px bg-white/10 max-w-[60px]" />
          </div>
          <h2 className="text-[32px] font-black leading-[1.2] text-[#F59E0B]" style={{ letterSpacing: "-0.04em" }}>
            LA旅行の「これどうする？」<br />全部解決します。
          </h2>
          <p className="mt-5 text-[14px] leading-[1.85] text-white/65">
            旅行前の準備から、現地のリアルタイム質問まで。<br />LINEで友だち追加するだけ、登録不要。
          </p>
          <div className="mt-10">
            <a href={LINE_URL} target="_blank" rel="noopener"
              className="bg-white text-[#0F172A] text-[15px] font-bold rounded-full pl-5 pr-6 py-[14px] inline-flex items-center gap-2.5 whitespace-nowrap shadow-xl">
              <span className="w-7 h-7 rounded-full bg-[#06C755] grid place-items-center flex-shrink-0">
                <LineIcon className="w-5 h-5 text-white" />
              </span>
              LINEで無料で始める
              <ArrowRight className="w-4 h-4 -mr-1" />
            </a>
            <p className="mt-3 text-[11px] text-white/40">友だち追加だけ／登録不要</p>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-[#0B1220] text-white/40">
        <div className="max-w-md mx-auto px-6 py-10">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/IMG_9110.PNG" alt="SoCal Concierge" className="w-full h-full object-cover" />
            </span>
            <div>
              <p className="font-en font-bold text-white text-[14px] leading-none">LA &amp; SoCal コンシェルジュ</p>
              <p className="text-[10px] text-white/35 mt-0.5">Operated by Yorozu LLC</p>
            </div>
          </div>

          <div className="hr-dark mb-6" />

          <div className="flex flex-col gap-2 text-[11px] leading-[1.7]">
            <p>本サービスはAIによる情報提供です。最新情報は必ず公式サイトでご確認ください。</p>
            <p>緊急時：<span className="text-white/70 font-semibold">911</span></p>
            <p>
              在ロサンゼルス日本国総領事館：
              <a href="tel:+12136176700" className="text-white/70 font-semibold hover:text-white transition-colors">+1-213-617-6700</a>
            </p>
          </div>

          <div className="hr-dark mt-6 mb-5" />

          <div className="text-[10px] leading-relaxed text-white/30 mb-4 space-y-1">
            <p>※本サービスは緊急対応サービスではありません。事故・急病・事件等の場合は、911または現地機関へ直接ご連絡ください。</p>
            <p>※スタッフ相談は有料オプションです。返信時間および問題解決を保証するものではありません。</p>
            <p>※AIによる回答は参考情報であり、営業時間・料金・治安・予約状況等の最新性を保証するものではありません。</p>
          </div>

          <div className="hr-dark mb-5" />

          <div className="flex items-center justify-between text-[11px]">
            <span>© 2025 Yorozu LLC. All rights reserved.</span>
            <a href={LINE_URL} target="_blank" rel="noopener" className="hover:text-white transition-colors">
              LINE友だち追加 →
            </a>
          </div>

          <div className="flex gap-3 text-[10px] mt-3">
            <a href="/privacy" className="hover:text-white/70 transition-colors">プライバシーポリシー</a>
            <span>|</span>
            <a href="/terms" className="hover:text-white/70 transition-colors">利用規約</a>
            <span>|</span>
            <a href="/contact" className="hover:text-white/70 transition-colors">お問い合わせ</a>
          </div>
        </div>
      </footer>

      {/* ══ STICKY CTA ══ */}
      <div id="sticky-cta" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 hidden-cta"
        style={{ width: "calc(100% - 1.5rem)", maxWidth: "448px" }}>
        <a href={LINE_URL} target="_blank" rel="noopener"
          className="line-btn w-full text-white text-[15px] font-bold rounded-full pl-5 pr-6 py-[14px] flex items-center justify-center gap-2.5 shadow-2xl">
          <span className="w-7 h-7 rounded-full bg-white grid place-items-center flex-shrink-0">
            <LineIcon className="w-5 h-5 text-[#06C755]" />
          </span>
          LINEで無料で始める
          <ArrowRight className="w-4 h-4 -mr-1" />
        </a>
      </div>

    </div>
  );
}
