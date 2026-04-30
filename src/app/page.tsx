import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoCal Navi｜南カリフォルニア旅行をもっと自由に",
  description:
    "LA・アナハイム・サンディエゴを旅する日本人のためのAIコンシェルジュ。ホテル予約・観光・グルメ・治安・天気アラートをLINEで日本語サポート。",
};

const LINE_URL = "https://lin.ee/t8do1LO";

// ─── 共通パーツ ─────────────────────────────────────────
function LineBtn({ variant = "primary", size = "md" }: { variant?: "primary" | "white"; size?: "md" | "lg" }) {
  const base = "inline-flex items-center justify-center gap-2.5 font-bold rounded-full transition-all duration-200 active:scale-95";
  const variants = {
    primary: "bg-[#06C755] hover:bg-[#04a845] text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40",
    white:   "bg-white hover:bg-slate-50 text-slate-900 shadow-lg hover:shadow-xl",
  };
  const sizes = {
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-8 py-4",
  };
  return (
    <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
      className={`${base} ${variants[variant]} ${sizes[size]}`}>
      <LineLogo className={size === "lg" ? "w-6 h-6" : "w-5 h-5"} />
      {size === "lg" ? "LINEで無料で始める" : "友達追加（無料）"}
    </a>
  );
}

function LineLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

// ─── セクション ─────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased overflow-x-hidden">

      {/* ════ NAVBAR ════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌴</span>
            <span className="font-black text-slate-900 tracking-tight">SoCal Navi</span>
          </div>
          <LineBtn variant="primary" size="md" />
        </div>
      </nav>

      {/* ════ HERO ════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 背景写真 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?auto=format&fit=crop&w=1920&q=80"
          alt="Los Angeles skyline"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="relative z-10 text-center text-white px-5 pt-20 pb-12 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full mb-8 tracking-wide">
            🇺🇸&nbsp; LA &middot; アナハイム &middot; サンディエゴ
          </div>

          <h1 className="text-4xl sm:text-6xl font-black leading-[1.1] tracking-tight mb-6">
            初めてのSoCal旅行も、<br />
            <span className="text-amber-400">ローカルのように</span><br />
            楽しめる。
          </h1>

          <p className="text-base sm:text-lg text-white/75 leading-relaxed mb-10 max-w-md mx-auto">
            アメリカ在住10年以上の知識をAIが凝縮。<br />
            LINEで聞くだけ。英語ゼロでも大丈夫。
          </p>

          <LineBtn variant="white" size="lg" />
          <p className="mt-4 text-xs text-white/40">登録無料 &middot; いつでも配信停止可能</p>
        </div>

        {/* スクロールヒント */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
          <span className="text-[10px] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* ════ STATS ════ */}
      <section className="bg-slate-900 text-white py-10 px-5">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { num: "9",    unit: "つの機能",     label: "LAX・観光・グルメ・治安…すべて網羅" },
            { num: "24",   unit: "時間対応",      label: "旅行中いつでも即答" },
            { num: "無料", unit: "で始められる", label: "友達追加だけでフル機能利用可能" },
          ].map((s) => (
            <div key={s.num}>
              <p className="text-3xl sm:text-4xl font-black text-amber-400">
                {s.num}<span className="text-base sm:text-lg font-bold text-white ml-0.5">{s.unit}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1 hidden sm:block">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════ PROBLEM ════ */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase text-center mb-4">Problem</p>
          <h2 className="text-2xl sm:text-3xl font-black text-center leading-tight mb-12">
            旅行前に不安、旅行中も不安。<br />
            <span className="text-slate-400 font-medium">そんな旅、もったいない。</span>
          </h2>

          <div className="space-y-3">
            {[
              { icon: "💬", text: "英語が不安で現地スタッフに聞けず、困ったまま" },
              { icon: "🗺️", text: "GoogleマップはあるけどLAの交通が複雑すぎる" },
              { icon: "⚠️", text: "治安が心配で、行っていいエリアかわからない" },
              { icon: "🏰", text: "ディズニーの攻略情報が多すぎて何を信じればいいか" },
              { icon: "🏨", text: "ホテルをどのエリアで選べばいいかわからない" },
            ].map((p) => (
              <div key={p.text}
                className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4">
                <span className="text-xl w-8 text-center flex-shrink-0">{p.icon}</span>
                <p className="text-sm text-slate-700 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FEATURES ════ */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase text-center mb-4">Features</p>
          <h2 className="text-2xl sm:text-3xl font-black text-center leading-tight mb-3">
            旅行中のすべてに答える、<br />9つの機能
          </h2>
          <p className="text-sm text-slate-500 text-center mb-12">
            普段使いのLINEで。アプリ不要。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "✈️", color: "bg-blue-50 border-blue-100",   title: "LAX空港案内",    desc: "Uber/Lyft・メトロ・バスの使い方を即ガイド" },
              { icon: "⚾", color: "bg-red-50 border-red-100",     title: "ドジャース観戦",  desc: "チケット・アクセス・大谷情報まで対応" },
              { icon: "🍔", color: "bg-orange-50 border-orange-100", title: "グルメ案内",    desc: "In-N-Out・タコス・ブランチ… 本場体験を優先" },
              { icon: "👨‍👩‍👧", color: "bg-green-50 border-green-100",  title: "子連れ旅行",  desc: "チャイルドシート・授乳室・子供料金まで" },
              { icon: "🏰", color: "bg-purple-50 border-purple-100", title: "ディズニー",   desc: "待ち時間・Genie+・限定グッズを熟知" },
              { icon: "🔒", color: "bg-slate-50 border-slate-200",  title: "治安チェック",  desc: "位置情報送信でLAPDデータを即表示" },
              { icon: "🎁", color: "bg-yellow-50 border-yellow-100", title: "お土産ガイド", desc: "用途別・予算別・バラまき用まで完全対応" },
              { icon: "🛍️", color: "bg-pink-50 border-pink-100",   title: "ショッピング",   desc: "アウトレット・ブランド街・ローカルスポット" },
              { icon: "🏨", color: "bg-cyan-50 border-cyan-100",   title: "ホテル予約",     desc: "エリア別おすすめ＋Booking.com予約リンク" },
            ].map((f) => (
              <div key={f.title}
                className={`${f.color} border rounded-2xl p-5 hover:shadow-md transition-shadow`}>
                <div className="text-2xl mb-3">{f.icon}</div>
                <p className="font-bold text-slate-900 text-sm mb-1">{f.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase text-center mb-4">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-12">30秒で始められる</h2>

          <div className="relative">
            {/* 縦線 */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-slate-100" />

            <div className="space-y-8">
              {[
                { step: "01", title: "LINEで友達追加", desc: "下のボタンをタップするだけ。アプリのインストールは不要です。" },
                { step: "02", title: "質問を日本語で送る", desc: "「LAXからホテルへの行き方は？」「ディズニーのチケットはどこで買う？」など、自然な言葉でOK。" },
                { step: "03", title: "AIが即座に回答", desc: "現地情報・地図リンク・予約サイトまでまとめてお届け。旅行前の計画から旅行中のトラブル対応まで。" },
              ].map((s) => (
                <div key={s.step} className="flex gap-5 items-start relative">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs z-10">
                    {s.step}
                  </div>
                  <div className="pt-2">
                    <p className="font-bold text-slate-900 mb-1">{s.title}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <LineBtn variant="primary" size="lg" />
          </div>
        </div>
      </section>

      {/* ════ HOTEL ════ */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase text-center mb-4">Hotel</p>
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3">
            ホテル選びも、チャットで完結。
          </h2>
          <p className="text-sm text-slate-500 text-center mb-10">
            エリア・予算・目的に合わせたおすすめを提案。<br />
            そのままBooking.comで日本語予約できます。
          </p>

          {/* チャットデモ */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-6">
            {/* チャットヘッダー */}
            <div className="bg-slate-900 px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center text-sm">🌴</div>
              <div>
                <p className="text-white text-sm font-bold">SoCal Navi</p>
                <p className="text-white/40 text-xs">オンライン</p>
              </div>
            </div>

            {/* メッセージ */}
            <div className="p-5 space-y-4 bg-[#EBEFF3]">
              {/* ユーザー */}
              <div className="flex justify-end">
                <div className="bg-[#06C755] text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[75%] leading-relaxed">
                  ディズニーに近くて子連れに向いているホテルを教えて
                </div>
              </div>
              {/* ボット */}
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs flex-shrink-0">🌴</div>
                <div className="bg-white text-slate-800 text-sm px-4 py-3 rounded-2xl rounded-bl-sm max-w-[80%] leading-relaxed shadow-sm">
                  アナハイムのHarbor Blvd沿いがディズニーまで徒歩圏でおすすめです。<br /><br />
                  <span className="font-semibold">子連れに特に人気：</span><br />
                  🏨 Hilton Anaheim — プール付き・$220〜<br />
                  🏨 Marriott — ディズニービュー・$180〜<br /><br />
                  下のリンクで空き状況・最安値を確認できます📌
                </div>
              </div>
            </div>

            {/* Booking.com CTA */}
            <div className="px-5 py-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-slate-900">Booking.comで予約</p>
                <p className="text-xs text-slate-400">日本語対応 · 無料キャンセル多数 · 最安値保証</p>
              </div>
              <a
                href="https://www.booking.com/searchresults.html?ss=Anaheim%2C+California&lang=ja&selected_currency=USD"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                空室を確認 →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════ SAFETY ════ */}
      <section className="py-20 px-5 bg-slate-900 text-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-amber-400 uppercase text-center mb-4">Safety</p>
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3">
            安全情報を、毎朝自動でお届け。
          </h2>
          <p className="text-sm text-slate-400 text-center mb-12">
            デモ・道路閉鎖・猛暑・山火事…<br />
            外出前に知っておくべき情報をLA時間7時に配信。
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: "🌤️",
                label: "天気アラート",
                desc: "雨・猛暑・嵐など外出に影響する予報を事前通知",
                color: "border-sky-500/30 bg-sky-500/5",
              },
              {
                icon: "⚠️",
                label: "安全・ニュース",
                desc: "デモ・道路閉鎖・緊急事態をリアルタイム検出",
                color: "border-amber-500/30 bg-amber-500/5",
              },
              {
                icon: "📍",
                label: "治安チェック",
                desc: "位置情報を送るとLAPD犯罪データで周辺を即評価",
                color: "border-rose-500/30 bg-rose-500/5",
              },
            ].map((a) => (
              <div key={a.label}
                className={`border rounded-2xl p-5 ${a.color}`}>
                <div className="text-3xl mb-3">{a.icon}</div>
                <p className="font-bold text-white text-sm mb-2">{a.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section className="relative py-24 px-5 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80"
          alt="California"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 max-w-sm mx-auto text-center text-white">
          <p className="text-4xl mb-5">🌴</p>
          <h2 className="text-2xl sm:text-3xl font-black mb-4 leading-tight">
            さあ、SoCalへ。<br />
            準備はSoCal Naviで。
          </h2>
          <p className="text-sm text-white/60 mb-8 leading-relaxed">
            旅の計画から旅行中のリアルタイム質問まで、<br />ずっとそばに。無料で始められます。
          </p>
          <LineBtn variant="white" size="lg" />
          <p className="mt-4 text-xs text-white/30">無料 · 配信停止はいつでも可能</p>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="bg-slate-950 text-slate-500 py-8 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌴</span>
              <span className="font-black text-white text-sm">SoCal Navi</span>
            </div>
            <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-white transition-colors">
              友達追加 →
            </a>
          </div>
          <div className="border-t border-white/5 pt-6 space-y-2 text-xs">
            <p>本サービスはAIによる情報提供です。最新情報は必ず公式サイトでご確認ください。</p>
            <p>
              緊急時：<strong className="text-slate-300">911</strong>
              在ロサンゼルス日本国総領事館：<strong className="text-slate-300">+1-213-617-6700</strong>
            </p>
            <p className="text-slate-600">© 2025 SoCal Navi</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
