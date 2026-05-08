"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    const res = await fetch("https://formsubmit.co/ajax/info@yorozu-usa.com", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data,
    });

    if (res.ok) {
      setStatus("done");
      form.reset();
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-lg mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 mb-8 inline-block">← トップへ戻る</Link>

        <h1 className="text-2xl font-bold mb-2">お問い合わせ</h1>
        <p className="text-sm text-slate-500 mb-8">LA &amp; SoCal コンシェルジュ　／　Yorozu LLC</p>

        {status === "done" ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <p className="text-green-700 font-semibold mb-1">送信完了しました ✅</p>
            <p className="text-sm text-green-600">内容を確認次第、ご連絡いたします。</p>
            <Link href="/" className="inline-block mt-4 text-sm text-slate-500 hover:text-slate-700">トップへ戻る</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_subject" value="【SoCal Navi】お問い合わせ" />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">お名前 <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="name"
                required
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス <span className="text-red-400">*</span></label>
              <input
                type="email"
                name="email"
                required
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">件名</label>
              <input
                type="text"
                name="subject"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="ご質問・ご要望など"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">メッセージ <span className="text-red-400">*</span></label>
              <textarea
                name="message"
                required
                rows={5}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                placeholder="お気軽にご記入ください"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-500">送信に失敗しました。時間をおいて再度お試しください。</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-slate-800 text-white rounded-lg py-3 text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {status === "sending" ? "送信中..." : "送信する"}
            </button>
          </form>
        )}

        <div className="border-t pt-8 mt-10 text-center text-xs text-slate-400">
          <p>© 2025 Yorozu LLC. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-slate-600">プライバシーポリシー</Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-slate-600">利用規約</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
