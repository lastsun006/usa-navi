import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | LA & SoCal コンシェルジュ",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 mb-8 inline-block">← トップへ戻る</Link>

        <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>
        <p className="text-sm text-slate-500 mb-8">LA &amp; SoCal コンシェルジュ　／　運営者：Yorozu LLC　／　最終更新日：2026年5月4日</p>

        <p className="text-sm mb-8">LA &amp; SoCal コンシェルジュ（以下「本サービス」）は、ユーザーのプライバシーを尊重し、取得した情報を適切に取り扱います。本プライバシーポリシーは、本サービスにおける個人情報および関連情報の収集、利用、管理について説明するものです。</p>

        {[
          {
            title: "1. 取得する情報",
            items: [
              "LINE上でユーザーが送信したメッセージ内容",
              "相談内容、旅行日程、希望エリア、希望店舗、予約希望内容",
              "氏名、ニックネーム、LINEアカウント情報",
              "メールアドレス、電話番号など、ユーザーが任意で提供する情報",
              "有料サービス利用時の決済情報（※クレジットカード番号等は決済代行サービス側で管理され、当サービスが直接保存することはありません）",
              "サイト閲覧情報、アクセス情報、端末情報、Cookie等の情報",
            ],
          },
          {
            title: "2. 会話データの保存について",
            body: "本サービスでは、サービス品質の向上、過去の相談内容の確認、トラブル防止、予約代行・相談対応の継続のため、LINEやフォーム等で送信された会話内容を保存する場合があります。保存された会話データは、ユーザー対応、サービス改善、内部確認、必要な記録管理の目的で使用されます。",
          },
          {
            title: "3. 利用目的",
            items: [
              "旅行相談、移動案内、レストラン情報、観光情報等の提供",
              "有料スタッフ相談、予約代行、お土産代行などの対応",
              "ユーザーからの問い合わせ対応",
              "サービス改善、品質向上、AI回答精度の改善",
              "不正利用、迷惑行為、トラブルの防止",
              "決済、返金、注文管理",
              "必要に応じた重要なお知らせの送信",
              "法令または公的機関からの要請への対応",
            ],
          },
          {
            title: "4. AIサービスの利用について",
            body: "本サービスでは、ユーザーからの質問に対する回答作成や情報整理のため、AIツールを利用する場合があります。AIによる回答は、可能な限り正確な情報提供を目指しますが、内容の完全性、正確性、最新性を保証するものではありません。旅行、交通、治安、営業時間、料金、予約状況等は変更される場合がありますので、最終確認はユーザー自身の責任で行ってください。",
          },
          {
            title: "5. 第三者サービスの利用",
            items: ["LINE", "決済サービス", "予約・地図・交通・旅行関連サービス", "アクセス解析ツール", "AI回答作成ツール", "アフィリエイトサービス"],
            body2: "これらの外部サービスにおける情報の取り扱いについては、各サービスのプライバシーポリシーが適用されます。",
          },
          {
            title: "6. 第三者提供について",
            body: "当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に販売または不当に提供することはありません。",
            items: [
              "ユーザーの同意がある場合",
              "予約代行、問い合わせ代行、配送代行など、サービス提供に必要な範囲で店舗・施設・配送業者等に情報を提供する場合",
              "決済処理、システム運営、データ管理等を外部事業者に委託する場合",
              "法令に基づく場合",
              "不正利用、トラブル、権利保護のために必要な場合",
            ],
          },
          {
            title: "7. 情報の保存期間",
            body: "取得した情報は、サービス提供、記録管理、トラブル防止、法令上必要な期間に限り保存します。不要となった情報は、合理的な範囲で削除または匿名化します。",
          },
          {
            title: "8. ユーザーによる情報の確認・削除依頼",
            body: "ユーザーは、当サービスに対して、自身の個人情報の確認、修正、削除を依頼することができます。削除を希望する場合は、LINEまたは問い合わせフォームよりご連絡ください。ただし、決済記録、取引記録、法令上保存が必要な情報、トラブル対応に必要な情報については、一定期間保存する場合があります。",
          },
          {
            title: "9. Cookie等の利用",
            body: "本サービスのウェブサイトでは、利便性向上、アクセス解析、広告効果測定のためにCookie等を使用する場合があります。ユーザーはブラウザ設定によりCookieを無効にすることができます。",
          },
          {
            title: "10. 未成年の利用について",
            body: "未成年の方が本サービスを利用する場合は、保護者の同意を得た上でご利用ください。",
          },
          {
            title: "11. セキュリティ",
            body: "当サービスは、取得した情報について、不正アクセス、紛失、漏えい、改ざん等を防止するため、合理的な安全管理措置を講じます。",
          },
          {
            title: "12. ポリシーの変更",
            body: "本プライバシーポリシーは、必要に応じて変更される場合があります。重要な変更がある場合は、ウェブサイト上またはLINE等で通知します。",
          },
          {
            title: "13. お問い合わせ",
            body: "本プライバシーポリシーに関するお問い合わせは、LINEまたは当サービスのお問い合わせ窓口よりご連絡ください。",
          },
        ].map((section) => (
          <section key={section.title} className="mb-8">
            <h2 className="text-base font-bold mb-3">{section.title}</h2>
            {section.body && <p className="text-sm text-slate-600 mb-3 leading-relaxed">{section.body}</p>}
            {section.items && (
              <ul className="text-sm text-slate-600 space-y-1 mb-3 pl-4">
                {section.items.map((item) => <li key={item} className="before:content-['・'] before:-ml-4">{item}</li>)}
              </ul>
            )}
            {"body2" in section && section.body2 && <p className="text-sm text-slate-600 leading-relaxed">{section.body2}</p>}
          </section>
        ))}

        <div className="border-t pt-8 text-center text-xs text-slate-400">
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
