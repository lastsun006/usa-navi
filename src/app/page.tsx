import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoCal Navi｜南カリフォルニア旅行をもっと自由に",
  description:
    "LA・アナハイム・サンディエゴを旅する日本人のためのAIコンシェルジュ。ホテル予約・観光・グルメ・治安・天気アラートをLINEで日本語サポート。",
  openGraph: {
    title: "SoCal Navi｜南カリフォルニア旅行をもっと自由に",
    description: "LA・アナハイム・サンディエゴを旅する日本人向けAIコンシェルジュ。LINEで24時間日本語サポート。",
    url: "https://usa-navi-app.vercel.app",
    siteName: "SoCal Navi",
    locale: "ja_JP",
    type: "website",
  },
};

const LINE_ADD_URL = "https://lin.ee/t8do1LO";

const FEATURES = [
  { icon: "✈️", title: "LAX空港から市内へ", desc: "Uber/Lyft・メトロ・バスの使い方を即案内" },
  { icon: "⚾", title: "ドジャース観戦", desc: "チケット・アクセス・スタジアムの楽しみ方" },
  { icon: "🍔", title: "グルメ案内", desc: "In-N-Out・タコス・ブランチ…アメリカ体験を優先" },
  { icon: "👨‍👩‍👧", title: "子連れ家族旅行", desc: "チャイルドシート・授乳室・子供料金まで対応" },
  { icon: "🏰", title: "ディズニー攻略", desc: "待ち時間・Genie+・限定グッズを熟知" },
  { icon: "🔒", title: "治安チェック", desc: "位置情報送信でリアルLAPDデータを即表示" },
  { icon: "🎁", title: "お土産ガイド", desc: "用途別・予算別・バラまき用まで完全対応" },
  { icon: "🛍️", title: "ショッピング", desc: "アウトレット・ブランド街・ローカルスポット" },
  { icon: "🏨", title: "ホテル予約", desc: "エリア別おすすめ＋Booking.com日本語予約" },
];

const STEPS = [
  { num: "01", title: "LINEで友達追加", desc: "下のボタンをタップするだけ。アプリ不要。" },
  { num: "02", title: "質問を送る", desc: "「LAXからホテルへの行き方は？」など自然な日本語でOK。" },
  { num: "03", title: "即座に回答", desc: "AIが現地情報・地図リンク・予約サイトまで案内。" },
];

const PAINS = [
  "英語が不安で現地スタッフに聞けない",
  "GoogleマップはあるけどLAの交通が複雑すぎる",
  "治安が心配で行っていいエリアかわからない",
  "ディズニーランドの攻略法が多すぎてわからない",
  "日本人向けのリアルな情報が見つからない",
];

function LineButton({ size = "md" }: { size?: "md" | "lg" }) {
  const cls =
    size === "lg"
      ? "inline-flex items-center gap-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
      : "inline-flex items-center gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-base px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95";
  return (
    <a href={LINE_ADD_URL} target="_blank" rel="noopener noreferrer" className={cls}>
      <svg viewBox="0 0 24 24" className={size === "lg" ? "w-7 h-7" : "w-5 h-5"} fill="currentColor">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
      {size === "lg" ? "LINEで無料で始める" : "友達追加（無料）"}
    </a>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0d2347] to-[#1a3a6e] text-white">
        {/* 背景デコレーション */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-orange-400 blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-5 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-white/20">
            🇺🇸 LA・アナハイム・サンディエゴ対応
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
            南カリフォルニアの旅を、<br />
            <span className="text-[#F4A261]">もっと自由に。</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-sm mx-auto">
            アメリカ在住10年以上の経験をもとに、<br />
            旅行中のあらゆる疑問にLINEで即答。<br />
            英語ゼロでも大丈夫。
          </p>

          <LineButton size="lg" />

          <p className="mt-4 text-xs text-slate-400">
            登録無料・いつでも退会可能
          </p>

          {/* 実績バッジ */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm">
            {[
              { icon: "🤖", label: "AI powered" },
              { icon: "🌐", label: "24時間対応" },
              { icon: "🔒", label: "治安データ連携" },
              { icon: "🌤️", label: "天気アラート" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-xs text-slate-200 border border-white/10">
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAINS ── */}
      <section className="bg-slate-50 py-14 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">こんなお悩みありませんか？</p>
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">
            せっかくのSoCal旅行、<br />不安を残したままにしていませんか？
          </h2>
          <ul className="space-y-3">
            {PAINS.map((p) => (
              <li key={p} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100">
                <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                <span className="text-sm text-slate-700">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="py-14 px-5 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">SoCal Naviで解決</p>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            旅行中のすべての疑問に、<br />
            <span className="text-blue-600">AIが即座に日本語で答えます</span>
          </h2>
          <p className="text-sm text-slate-500 mb-10">普段使いのLINEで。アプリのインストール不要。</p>

          <div className="grid grid-cols-3 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="text-2xl mb-1.5">{f.icon}</div>
                <p className="text-xs font-bold text-slate-800 leading-tight mb-1">{f.title}</p>
                <p className="text-[10px] text-slate-500 leading-tight hidden sm:block">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-14 px-5 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-xl mx-auto">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">使い方</p>
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-10">たった3ステップで始められる</h2>
          <div className="space-y-5">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-start gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {s.num}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-0.5">{s.title}</p>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOTEL ── */}
      <section className="py-14 px-5 bg-white">
        <div className="max-w-xl mx-auto">
          <p className="text-center text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">ホテル予約</p>
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-3">
            ホテル選びもチャットで完結
          </h2>
          <p className="text-sm text-slate-500 text-center mb-8">
            「ディズニー近くのホテルが知りたい」と送るだけ。<br />
            エリア別のアドバイスとBooking.com予約リンクをお届け。
          </p>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm flex-shrink-0">👤</div>
              <div className="bg-white/20 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm">
                アナハイムでディズニーに近いホテルを教えて
              </div>
            </div>
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center text-sm flex-shrink-0">🤖</div>
              <div className="bg-white text-slate-800 rounded-2xl rounded-tr-none px-4 py-2.5 text-sm max-w-xs text-left">
                ディズニーランド徒歩圏なら<strong>Harbor Blvd沿い</strong>がベストです。オフィシャルホテルは高いですが早期入場特典があります。下のリンクで日本語で比較・予約できます📌
              </div>
            </div>
          </div>

          <div className="border-2 border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-3 bg-blue-50">
            <div>
              <p className="font-bold text-sm text-blue-700">🏨 Booking.comで検索・予約</p>
              <p className="text-xs text-slate-500 mt-0.5">日本語対応｜無料キャンセル多数｜最低価格保証</p>
            </div>
            <a
              href="https://www.booking.com/searchresults.html?ss=Anaheim%2C+California&lang=ja&selected_currency=USD"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              予約する →
            </a>
          </div>
        </div>
      </section>

      {/* ── ALERTS ── */}
      <section className="py-14 px-5 bg-slate-900 text-white">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">安全情報</p>
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            毎朝7時に届く、<br />旅行者向け安全アラート
          </h2>
          <p className="text-sm text-slate-400 mb-8">
            デモ・道路閉鎖・山火事・猛暑など、<br />
            外出前に知っておきたい情報を自動でお届け。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {[
              { icon: "🌤️", title: "天気アラート", desc: "雨・猛暑など外出に影響する予報をLA時間で通知" },
              { icon: "⚠️", title: "安全・ニュース", desc: "デモ・道路閉鎖・緊急事態をリアルタイム検出" },
              { icon: "📍", title: "治安チェック", desc: "位置情報を送るとLAPD犯罪データで即評価" },
            ].map((a) => (
              <div key={a.title} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-xl mb-2">{a.icon}</div>
                <p className="font-bold text-sm mb-1">{a.title}</p>
                <p className="text-xs text-slate-400">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-5 bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] text-white text-center">
        <div className="max-w-sm mx-auto">
          <div className="text-4xl mb-4">🌴</div>
          <h2 className="text-2xl font-extrabold mb-3">
            さあ、SoCalへ。<br />準備はSoCal Naviで。
          </h2>
          <p className="text-sm text-slate-300 mb-8">
            登録は30秒。LINEで友達追加するだけ。<br />
            旅の前日から旅行中まで、ずっとそばに。
          </p>
          <LineButton size="lg" />
          <p className="mt-4 text-xs text-slate-500">
            無料 ・ 配信停止はいつでも可能
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 text-slate-500 text-xs text-center py-6 px-5">
        <p className="mb-1">© 2025 SoCal Navi｜本サービスはAIによる情報提供です。最新情報は必ず公式サイトでご確認ください。</p>
        <p>
          緊急時：<strong className="text-slate-300">911</strong>｜
          在ロサンゼルス日本国総領事館：<strong className="text-slate-300">+1-213-617-6700</strong>
        </p>
      </footer>
    </div>
  );
}
