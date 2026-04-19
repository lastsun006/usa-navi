import Link from "next/link";
import { USECASES } from "@/lib/usecases";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
      {/* ヒーローセクション */}
      <header className="px-4 pt-12 pb-8 text-center">
        <div className="text-5xl mb-4">🗺️</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">USA Navi</h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-xs mx-auto">
          初めてのアメリカ旅行を
          <br />
          <span className="font-semibold text-blue-700">安心・確実</span>
          にサポートする
          <br />
          AIコンシェルジュ
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["英語に不安がある", "子連れ旅行", "個人旅行"].map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* ユースケース選択 */}
      <main className="px-4 pb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
          何についてお困りですか？
        </h2>
        <div className="space-y-3 max-w-lg mx-auto">
          {USECASES.map((usecase) => (
            <Link
              key={usecase.id}
              href={`/chat/${usecase.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 active:scale-[0.98] transition-all"
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${usecase.color}20` }}
              >
                {usecase.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">
                  {usecase.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {usecase.subtitle}
                </p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {usecase.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${usecase.color}15`,
                        color: usecase.color,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-slate-300 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>

        {/* フッター情報 */}
        <div className="mt-8 text-center text-xs text-slate-400 space-y-1 max-w-xs mx-auto">
          <p>
            AIの回答は参考情報です。最新情報は必ず公式サイトでご確認ください。
          </p>
          <p>
            緊急時は{" "}
            <strong className="text-slate-600">911</strong> または 日本領事館LA{" "}
            <strong className="text-slate-600">+1-213-617-6700</strong>
          </p>
        </div>
      </main>
    </div>
  );
}
