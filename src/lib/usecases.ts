import type { Usecase } from "@/types";

export const USECASES: Usecase[] = [
  {
    id: "lax_transport",
    title: "LAX到着・ホテル移動",
    subtitle: "空港から迷わずスムーズに移動したい",
    icon: "✈️",
    color: "#3B82F6",
    tags: ["空港", "移動", "Uber", "入国審査"],
    initialMessage:
      "LAXへのご到着おめでとうございます！✈️\n\nスムーズに移動できるよう、確認させてください。\n\n① 到着ターミナルはわかりますか？（国際線の方はTom Bradleyターミナル、国内線の方はTerminal番号）\n\nまたは、今どのあたりでお困りですか？",
    quickReplies: [
      "国際線（Tom Bradley）で到着した",
      "国内線で到着した",
      "入国審査で何を言えばいい？",
      "Uberの乗り方を教えて",
      "子連れでの移動について",
      "これから出発する（事前知識がほしい）",
    ],
    guideSlug: "lax-transport",
    subpromptId: "UC-01",
  },
  {
    id: "dodgers",
    title: "ドジャース観戦",
    subtitle: "スタジアムの楽しみ方・注意点を知りたい",
    icon: "⚾",
    color: "#1D4ED8",
    tags: ["野球", "スタジアム", "チケット", "大谷"],
    initialMessage:
      "ドジャース観戦、楽しみですね！⚾\n\nどのようなことでお困りですか？",
    quickReplies: [
      "チケットをどこで買えばいい？",
      "スタジアムへのアクセスは？",
      "当日の持ち物・禁止品は？",
      "場内の食事・注文方法",
      "チップは必要？",
      "子連れで観戦するには？",
    ],
    guideSlug: "dodgers",
    subpromptId: "UC-02",
  },
  {
    id: "restaurant",
    title: "レストラン利用",
    subtitle: "注文・チップ・席の取り方がわからない",
    icon: "🍽️",
    color: "#D97706",
    tags: ["食事", "チップ", "注文", "英語フレーズ"],
    initialMessage:
      "アメリカのレストラン、最初は緊張しますよね。でも基本を押さえれば大丈夫です！\n\nどんな場面でお困りですか？",
    quickReplies: [
      "入店から会計まで全部教えて",
      "チップの払い方・金額を教えて",
      "英語で注文するフレーズがほしい",
      "子連れでも入れるお店は？",
      "アレルギーの伝え方",
      "お会計の仕方",
    ],
    guideSlug: "restaurant",
    subpromptId: "UC-03",
  },
  {
    id: "family_travel",
    title: "子連れ旅行",
    subtitle: "子どもと一緒でも安心して旅したい",
    icon: "👨‍👩‍👧",
    color: "#059669",
    tags: ["子連れ", "ベビーカー", "食事", "緊急時"],
    initialMessage:
      "子連れでのアメリカ旅行、しっかりサポートします！\n\nお子さんの年齢を教えていただけますか？より具体的なアドバイスができます。",
    quickReplies: [
      "0〜2歳（乳幼児）",
      "3〜5歳（幼児）",
      "6〜10歳（小学生）",
      "子どもが熱を出した・体調不良",
      "持ち物・事前準備を教えて",
      "子連れディズニー攻略",
    ],
    guideSlug: "family-travel",
    subpromptId: "UC-04",
  },
  {
    id: "disney",
    title: "ディズニーランド",
    subtitle: "Genie+・混雑対策・子連れ攻略を知りたい",
    icon: "🏰",
    color: "#7C3AED",
    tags: ["ディズニー", "Genie+", "アナハイム", "アトラクション"],
    initialMessage:
      "ディズニーランド（アナハイム）、楽しみですね！🏰\n\n訪問するパークを教えてください。",
    quickReplies: [
      "ディズニーランド（クラシック）",
      "California Adventure（DCA）",
      "両方（Park Hopper）",
      "Genie+の使い方を教えて",
      "混雑を避けるコツは？",
      "子連れ向けアトラクションは？",
    ],
    guideSlug: "disney",
    subpromptId: "UC-05",
  },
];

export function getUsecase(id: string): Usecase | undefined {
  return USECASES.find((uc) => uc.id === id);
}
