// ─────────────────────────────────────────────
// SoCal 日系サービス ナレッジベース
// 情報源: ビビナビLA・LALALA・ライトハウスLA・ロサンゼルスタウン
// 収集期間: 2024〜2026年
// ─────────────────────────────────────────────

export type Area = "LA" | "OC" | "Anaheim" | "SanDiego" | "SoCal";

export interface Business {
  id: string;
  category: Category;
  area: Area;           // 対応エリア
  name: string;
  nameJa?: string;
  description: string; // Claude に渡す紹介文
  url?: string;        // 営業確認に使う公式URL
  phone?: string;
  address?: string;
  hours?: string;
  features: string[];  // 特徴タグ
  keywords: string[];  // ユーザーメッセージとのマッチングキーワード
  source: string;      // 情報源
}

export type Category =
  | "rental_car"
  | "transport"
  | "restaurant"
  | "supermarket"
  | "hair_salon"
  | "massage"
  | "medical"
  | "urgent_care"
  | "insurance"
  | "legal"
  | "emergency";

// ─────────────────────────────────────────────
// データ
// ─────────────────────────────────────────────
export const KNOWLEDGE_BASE: Business[] = [

  // ── レンタカー ──────────────────────────────
  {
    id: "sakura-rentacar",
    category: "rental_car",
    area: "LA",
    name: "サクラレンタカー (Sakura Rent-A-Car)",
    description:
      "LAX空港から徒歩+シャトルで行ける日本語完全対応レンタカー。創業20年以上。日本の免許証・国際免許証OK。エコノミー〜15人乗りバンまで対応。デビットカード払い可。LAXシャトル送迎あり。",
    url: "https://www.sakura-rentacar.com/",
    phone: "(310) 645-9696",
    address: "5250 W Century Blvd, Suite 100, Los Angeles, CA 90045（LAX近く）",
    hours: "毎日 7:00〜19:00",
    features: ["日本語対応", "日本免許OK", "LAX近く", "シャトル送迎", "デビットカード可"],
    keywords: ["レンタカー", "車", "ドライブ", "rent", "car", "空港", "LAX", "日本語"],
    source: "ビビナビLA / Yelp（2026年4月確認）",
  },
  {
    id: "aoi-rentacar",
    category: "rental_car",
    area: "OC",
    name: "あおいレンタカー (AOI Rent a Car)",
    description:
      "オレンジカウンティ（Brea）拠点の日本語レンタカー。18歳から利用可。自宅への無料送迎あり。1日100マイル走行可。トヨタ・カローラ4週間$649〜。LINEでの予約もOK。",
    url: "https://www.aoirentacar.com/",
    phone: "+1 (323) 629-9097",
    address: "Brea, Orange County",
    hours: "月〜金 9:00〜17:00、土 9:00〜13:00（日曜定休）",
    features: ["日本語対応", "自宅送迎無料", "LINE予約OK", "18歳〜", "OC拠点"],
    keywords: ["レンタカー", "車", "ドライブ", "オレンジカウンティ", "OC", "日本語", "格安"],
    source: "ビビナビLA / ロサンゼルスタウン（2025年確認）",
  },

  // ── 送迎・ツアー ──────────────────────────────
  {
    id: "jts-america",
    category: "transport",
    area: "SoCal",
    name: "JTS America（Japan Transportation Service）",
    description:
      "2015年創業の日本語ドライバーによる空港送迎・観光チャーター・リムジンサービス。LAX⇔ホテルの送迎から、グランドキャニオン・ディズニーランドへの日本語ガイド付きツアーまで対応。",
    url: "https://jtsamerica.com/",
    features: ["日本語ドライバー", "空港送迎", "観光チャーター", "グループ対応"],
    keywords: ["送迎", "シャトル", "空港", "LAX", "チャーター", "ツアー", "ガイド", "日本語"],
    source: "JTS America公式（2025年確認）",
  },
  {
    id: "locotabi-la",
    category: "transport",
    area: "SoCal",
    name: "ロコタビ ロサンゼルス",
    description:
      "LA在住日本人ロコが空港送迎・観光案内・通訳・予約代行を提供するマッチングサービス。1名から利用可能。LAX⇔ホテル・ディズニーランド・サンタモニカ等。料金は個人交渉で大手より安い場合も。",
    url: "https://locotabi.jp/losangeles",
    features: ["在住日本人ガイド", "1名〜", "空港送迎", "柔軟な対応", "通訳"],
    keywords: ["送迎", "ガイド", "観光", "通訳", "空港", "LAX", "ロコタビ"],
    source: "ロコタビ公式（2025年確認）",
  },
  {
    id: "jtb-mybas",
    category: "transport",
    area: "SoCal",
    name: "JTBマイバス（現地ツアー）",
    description:
      "JTBの日本語ガイド付き現地ツアー。LA市内チャーター（4時間／8時間）、グランドキャニオン、ディズニーランド、ドジャース観戦ツアー（2026年3〜9月対応）。JTBはドジャースのアジア地域公式パートナー。",
    url: "https://www.veltra.com/jp/north_america/los_angeles/",
    features: ["日本語ガイド", "ドジャースツアー", "グランドキャニオン", "ディズニー"],
    keywords: ["ツアー", "観光", "ドジャース", "グランドキャニオン", "ディズニー", "JTB", "ガイド"],
    source: "JTB公式 / Veltra（2025〜2026年確認）",
  },

  // ── レストラン ──────────────────────────────
  {
    id: "shinsengumi",
    category: "restaurant",
    area: "LA",
    name: "新撰組レストラングループ（Shin-Sen-Gumi）",
    description:
      "1992年創業、LA・OC周辺に16店舗展開する老舗日本食グループ。博多ラーメン・焼き鳥・しゃぶしゃぶが看板メニュー。ガーデナ・ダウンタウンLA等に複数店舗。テイクアウト対応。",
    url: "https://shinsengumigroup.com/",
    features: ["博多ラーメン", "焼き鳥", "しゃぶしゃぶ", "16店舗", "老舗"],
    keywords: ["ラーメン", "焼き鳥", "しゃぶしゃぶ", "日本食", "レストラン", "和食"],
    source: "ビビナビLA / LALALA USA（2025年確認）",
  },
  {
    id: "torikizoku",
    category: "restaurant",
    area: "LA",
    name: "鳥貴族 トーランス店（Torikizoku）",
    description:
      "日本の大手焼き鳥チェーン、米国1号店が2025年1月トーランスにオープン。均一価格制（$4〜$8）で本場の焼き鳥を楽しめる。日本人には馴染み深い味。",
    url: "https://www.torikizoku.co.jp/",
    address: "Torrance, CA",
    features: ["均一価格", "焼き鳥", "日本チェーン", "トーランス"],
    keywords: ["焼き鳥", "居酒屋", "鳥貴族", "トーランス", "日本食"],
    source: "ロサンゼルスタウン（2025年1月オープン確認）",
  },

  // OC・アナハイム・サンディエゴ レストラン
  {
    id: "marugame-udon-oc",
    category: "restaurant",
    area: "OC",
    name: "丸亀製麺（Marugame Udon）OC",
    description:
      "日本の大手うどんチェーン。アーバイン等OCエリアに複数店舗。セルフスタイルで注文しやすく、英語が苦手でも安心。天ぷらと一緒に$10〜$15で食べられるコスパ最高の選択肢。",
    url: "https://marugameudon.com/",
    features: ["うどん", "セルフ式", "コスパ", "日本チェーン", "OC複数店舗"],
    keywords: ["うどん", "丸亀", "ランチ", "食事", "日本食", "アーバイン", "OC"],
    source: "Marugame公式（2025年確認）",
  },
  {
    id: "kura-sushi-oc",
    category: "restaurant",
    area: "OC",
    name: "くら寿司（Kura Sushi）OC",
    description:
      "日本の回転寿司チェーン。アーバイン・タスティン等OCに複数店舗、サンディエゴ・チュラビスタにも出店。タッチパネルで注文できて英語不要。1皿$3〜$5程度。子連れにも人気。",
    url: "https://kurasushi.com/",
    features: ["回転寿司", "タッチパネル注文", "子連れOK", "OC・SD複数店舗"],
    keywords: ["寿司", "回転寿司", "くら寿司", "日本食", "アーバイン", "OC", "サンディエゴ", "子供"],
    source: "Kura Sushi公式（2025年確認）",
  },
  {
    id: "gyukaku-oc",
    category: "restaurant",
    area: "OC",
    name: "牛角（Gyu-Kaku）アナハイム／OC",
    description:
      "日本式焼肉チェーン。アナハイム・フラートン等OCに複数店舗。テーブルで自分で焼くスタイルで英語が苦手でも楽しめる。ランチセット$20〜、ディナー$30〜が目安。",
    url: "https://www.gyu-kaku.com/",
    features: ["焼肉", "テーブルBBQ", "アナハイム", "フラートン"],
    keywords: ["焼肉", "牛角", "BBQ", "日本食", "アナハイム", "OC", "居酒屋"],
    source: "Gyu-Kaku公式（2025年確認）",
  },
  {
    id: "shinsengumi-oc",
    category: "restaurant",
    area: "OC",
    name: "新撰組 ガーデングローブ店（Shin-Sen-Gumi OC）",
    description:
      "LAで有名な新撰組グループのOC拠点。ガーデングローブ周辺に博多ラーメン・焼き鳥店。日本人コミュニティにも人気の老舗。",
    url: "https://shinsengumigroup.com/",
    address: "Garden Grove, CA",
    features: ["博多ラーメン", "焼き鳥", "ガーデングローブ"],
    keywords: ["ラーメン", "焼き鳥", "日本食", "ガーデングローブ", "OC"],
    source: "新撰組公式（2025年確認）",
  },
  {
    id: "tajima-ramen-sd",
    category: "restaurant",
    area: "SanDiego",
    name: "田島ラーメン（Tajima Ramen）サンディエゴ",
    description:
      "サンディエゴを代表する日系ラーメン店。ノースパーク・ヒルクレスト・ミッションバレー等に複数店舗。日本人旅行者にも人気が高い。こってり〜あっさりまで選べる。",
    url: "https://www.tajimaramen.com/",
    address: "San Diego市内複数店舗",
    features: ["サンディエゴ定番", "複数店舗", "日系老舗"],
    keywords: ["ラーメン", "日本食", "サンディエゴ", "SD"],
    source: "Tajima公式（2025年確認）",
  },
  {
    id: "sushi-ota-sd",
    category: "restaurant",
    area: "SanDiego",
    name: "鮨おおた（Sushi Ota）サンディエゴ",
    description:
      "パシフィックビーチの本格日本式カウンター寿司。サンディエゴで最も評価の高い日本人シェフの寿司店のひとつ。予約必須。特別な夕食に。",
    url: "https://www.sushiota.com/",
    address: "4529 Mission Bay Dr, San Diego, CA",
    features: ["高級寿司", "日本人シェフ", "予約必須", "パシフィックビーチ"],
    keywords: ["寿司", "高級", "日本食", "サンディエゴ", "SD", "記念日"],
    source: "Sushi Ota公式（2025年確認）",
  },

  // ── 日系スーパー ──────────────────────────────
  {
    id: "mitsuwa",
    category: "supermarket",
    area: "LA",
    name: "ミツワマーケットプレイス（Mitsuwa Marketplace）",
    description:
      "LA周辺5店舗（サンタモニカ・トーランス・アーバイン・コスタメサ・サンガブリエル）。日本の食材・書籍・雑貨・コスメが揃う。ラーメン・うどん・寿司のフードコート併設（一部店舗）。",
    url: "https://mitsuwa.com/",
    features: ["フードコート", "日本食材", "書籍", "雑貨", "LA周辺5店舗"],
    keywords: ["スーパー", "食材", "日本食", "ミツワ", "買い物", "フードコート", "ショッピング"],
    source: "Mitsuwa公式（2024〜2025年確認）",
  },
  {
    id: "nijiya",
    category: "supermarket",
    area: "LA",
    name: "ニジヤマーケット（Nijiya Market）",
    description:
      "オーガニック・ナチュラル系の日本食材に強みを持つ日系スーパー。Mid-Wilshire・リトルトーキョー・West LA・トーランス等に店舗あり。惣菜・有機野菜が充実。",
    url: "https://www.nijiya.com/",
    features: ["オーガニック", "惣菜充実", "有機野菜", "West LA・トーランス等"],
    keywords: ["スーパー", "食材", "日本食", "ニジヤ", "買い物", "オーガニック", "ショッピング"],
    source: "Nijiya公式（2024〜2025年確認）",
  },
  {
    id: "tokyo-central",
    category: "supermarket",
    area: "LA",
    name: "東京セントラル（Tokyo Central）",
    description:
      "旧マルカイマーケット。ドン・キホーテ系列。食品・調理器具・生活用品・日本の雑誌まで幅広く取り扱い。2024年12月にトーランスPCH店が新規オープン。",
    url: "https://tokyocentral.com/",
    features: ["ドン・キホーテ系", "生活用品", "調理器具", "日本雑誌"],
    keywords: ["スーパー", "食材", "日本食", "マルカイ", "東京セントラル", "買い物", "生活用品"],
    source: "ロサンゼルスタウン（2024〜2025年確認）",
  },

  // OC・サンディエゴ スーパー
  {
    id: "mitsuwa-irvine",
    category: "supermarket",
    area: "OC",
    name: "ミツワマーケット アーバイン店（Mitsuwa Irvine）",
    description:
      "OCエリア最大の日系スーパー。フードコート・日本食レストランも併設。アーバイン在住の日本人コミュニティの中心地。日本の食材・雑貨・書籍が揃う。OCに来たらここが拠点。",
    url: "https://mitsuwa.com/",
    phone: "(949) 262-0780",
    address: "14230 Culver Dr, Irvine, CA 92604",
    features: ["OC最大", "フードコート", "日本食材", "書籍", "雑貨"],
    keywords: ["スーパー", "食材", "日本食", "ミツワ", "買い物", "アーバイン", "OC", "フードコート"],
    source: "Mitsuwa公式（2025年確認）",
  },
  {
    id: "mitsuwa-costamesa",
    category: "supermarket",
    area: "OC",
    name: "ミツワマーケット コスタメサ店（Mitsuwa Costa Mesa）",
    description:
      "ニューポートビーチ・コスタメサエリアの日系スーパー。日本食材・惣菜・お菓子が揃う。",
    url: "https://mitsuwa.com/",
    phone: "(714) 557-6699",
    address: "665 Paularino Ave, Costa Mesa, CA 92626",
    features: ["コスタメサ", "日本食材", "惣菜"],
    keywords: ["スーパー", "食材", "日本食", "ミツワ", "コスタメサ", "ニューポート", "OC"],
    source: "Mitsuwa公式（2025年確認）",
  },
  {
    id: "daiso-irvine",
    category: "supermarket",
    area: "OC",
    name: "ダイソー アーバイン（Daiso Irvine）",
    description:
      "日本の100均チェーン。アーバイン等OCに複数店舗。日本のお菓子・食品・日用品・文房具が手頃な価格で揃う。旅行中の急な買い物にも便利。",
    url: "https://www.daisous.com/",
    address: "Irvine Spectrum Center周辺",
    features: ["100均", "日本お菓子", "日用品", "お土産"],
    keywords: ["買い物", "100均", "ダイソー", "お菓子", "お土産", "アーバイン", "OC", "ショッピング"],
    source: "Daiso公式（2025年確認）",
  },

  // ── 美容院 ──────────────────────────────
  {
    id: "loops-hair-studio",
    category: "hair_salon",
    area: "LA",
    name: "Loops Hair Studio（ループスヘアスタジオ）",
    description:
      "West LA（ニジヤマーケット2階）の日本語対応ヘアサロン。カット$55〜（男性）/$65〜（女性）。日本ブランド（Milbon・Yuko・Hoyu）使用。日本語予約OK。",
    url: "https://www.loopshairstudio.com/ja-loops/ja-about.html",
    phone: "(310) 231-8999",
    address: "ニジヤマーケット2階, West LA（ソーテル）",
    hours: "9:00〜19:00",
    features: ["日本語対応", "日本ブランド使用", "West LA", "予約制"],
    keywords: ["美容院", "ヘアサロン", "カット", "ヘア", "髪", "美容"],
    source: "ロコタビ / 公式サイト（2025年確認）",
  },
  {
    id: "pia-hair-salon",
    category: "hair_salon",
    area: "LA",
    name: "Pia Hair Salon（ピアヘアサロン）",
    description:
      "日本にも店舗を持つ熟練日本人スタッフ在籍のヘアサロン。トーランス店・アーバイン店あり。日本と変わらない技術。",
    url: "https://www.lataeko.com/LA/pia-hair-salon/",
    phone: "トーランス: (310) 326-0815 / アーバイン: (949) 253-9073",
    address: "トーランス: 2579 Pacific Coast Hwy / アーバイン: 16525 Von Karman Ave",
    features: ["日本人スタッフ", "トーランス", "アーバイン", "日本レベルの技術"],
    keywords: ["美容院", "ヘアサロン", "カット", "ヘア", "髪", "美容", "トーランス", "アーバイン"],
    source: "ライトハウスLA（2025年確認）",
  },

  // ── マッサージ・鍼灸 ──────────────────────────────
  {
    id: "tsubakiyama-acupuncture",
    category: "massage",
    area: "LA",
    name: "椿山鍼灸院（Tsubakiyama Acupuncture）",
    description:
      "1990年開業のサンタモニカの老舗鍼灸院。鍼灸・指圧・マッサージ（足マッサージ含む）。腰痛・坐骨神経痛・首・肩こり・顎関節症など対応。日本語サイトあり。",
    url: "https://tsubakiyama.org/japanese/",
    address: "Santa Monica, CA",
    features: ["1990年開業老舗", "鍼灸", "指圧", "マッサージ", "サンタモニカ"],
    keywords: ["マッサージ", "鍼灸", "鍼", "整体", "指圧", "腰痛", "肩こり", "サンタモニカ"],
    source: "公式サイト（2025年確認）",
  },
  {
    id: "aculeafs-acupuncture",
    category: "massage",
    area: "LA",
    name: "Aculeafs Acupuncture（アキュリーフス鍼灸）",
    description:
      "日本人鍼灸師によるトーランス・ビバリーヒルズ2拠点の鍼灸院。疼痛管理・不妊治療・美容針・スポーツ針。漢方薬も取り扱い。",
    url: "https://losangeles.vivinavi.com/tg/desc/_wid_9249d5af5d39bd998269e54b8d6193819f58072107",
    address: "Torrance / Beverly Hills（2拠点）",
    features: ["日本人鍼灸師", "不妊治療", "美容針", "漢方薬", "ビバリーヒルズ"],
    keywords: ["鍼灸", "鍼", "マッサージ", "美容針", "不妊", "漢方", "ビバリーヒルズ", "トーランス"],
    source: "ビビナビLA（2025年確認）",
  },

  // ── 医療 ──────────────────────────────
  {
    id: "new-sunrise-clinic",
    category: "medical",
    area: "LA",
    name: "ニューサンライズクリニック（New Sunrise Clinic）",
    description:
      "West LA（Pico Blvd）の日本語対応クリニック。旅行保険キャッシュレス対応数がLA最多クラス。AIG・損保ジャパン・東京海上・三井住友・au損保・チューリッヒなど幅広く対応。受診前に保険会社へ連絡し、このクリニック名を伝えればそのまま手続き可能。",
    url: "https://www.nsrclinic.com/",
    phone: "公式サイトで確認",
    address: "2600 W Pico Blvd, Suite 105, Los Angeles, CA 90006",
    hours: "月〜木 9:00〜16:00",
    features: ["旅行保険キャッシュレス多数対応", "AIG・損保ジャパン・東京海上等", "日本語対応", "West LA"],
    keywords: ["病院", "クリニック", "医療", "内科", "保険", "キャッシュレス", "旅行保険", "日本語"],
    source: "New Sunrise Clinic公式 / ビビナビLA（2025年確認）",
  },
  {
    id: "osato-clinic",
    category: "medical",
    area: "LA",
    name: "大里メディカルクリニック（Osato Medical Clinic）",
    description:
      "トーランスの日本語完全対応クリニック。2001年創業。内科・消化器・婦人科健診・予防接種・健康診断・風邪症状に対応。予約から診察・検査まで全て日本語。\n【旅行保険キャッシュレス対応済み】AIG・損保ジャパン・東京海上日動・三井住友海上に対応。受診前に保険会社へ連絡し「大里メディカルクリニック受診予定」と伝える。保険証券（ポリシーナンバー）を持参。処方薬代は自己負担の場合あり。",
    url: "https://www.osatoclinic.com/",
    phone: "(310) 534-8200",
    address: "2860 Sepulveda Blvd, Torrance, CA 90505",
    hours: "月〜金 9:00〜12:00 / 14:00〜17:00（完全予約制）",
    features: ["全て日本語対応", "キャッシュレス対応確認済み", "内科・婦人科", "完全予約制", "トーランス"],
    keywords: ["病院", "クリニック", "医療", "医者", "診察", "内科", "体調", "薬", "トーランス", "保険", "キャッシュレス"],
    source: "ビビナビLA タウンガイド / 公式サイト（2025年確認）",
  },
  {
    id: "suzuki-clinic",
    category: "medical",
    area: "LA",
    name: "鈴木クリニック（The Suzuki Clinic）",
    description:
      "トーランスの日本人女性医師による内科クリニック。受付から診察まで全て日本語OK。\n【旅行保険】キャッシュレス対応は未確認。受診前に(310)326-5661へ直接確認するか、加入保険会社の24時間ダイヤルに「鈴木クリニック受診可能か」を問い合わせると確実。",
    url: "https://www.suzukiclinic.org/jpn/",
    phone: "(310) 326-5661",
    address: "2325 Torrance Blvd, Torrance, CA 90501",
    features: ["日本人女性医師", "日本語対応", "内科", "トーランス"],
    keywords: ["病院", "クリニック", "医療", "内科", "日本語", "女性医師", "保険"],
    source: "公式サイト（2025年確認）",
  },

  // ── 救急・アージェントケア ──────────────────────────────
  {
    id: "er-urgent-care-guide",
    category: "urgent_care",
    area: "LA",
    name: "救急・ER・Urgent Care 使い分けガイド",
    description:
      "【911（救急車）】命に関わる緊急時のみ。救急車は$1,000〜$3,000以上かかる。旅行保険があれば対象になるが、移動可能なら自分でERかUrgent Careへ行く方が安い場合も。\n\n【ER（緊急救命室）】24時間対応・命の危険がある場合。待ち時間が数時間になることも。費用は非常に高額（数百〜数千ドル）。保険なしだと破産レベルになるので旅行保険必須。\n\n【Urgent Care（アージェントケア）】ERほど緊急でない症状向け（発熱・捻挫・軽いケガ・風邪など）。予約不要・当日対応。費用はERより大幅に安い（$100〜$300程度）。まずここを使うのがおすすめ。\n\n【判断基準】胸の痛み・意識不明・大量出血→911。発熱・嘔吐・軽いケガ→Urgent Care。",
    features: ["911の使い方", "ER説明", "Urgent Care説明", "費用目安"],
    keywords: ["救急", "救急車", "911", "ER", "緊急", "アージェントケア", "urgent care", "病院", "ケガ", "体調", "熱", "発熱"],
    source: "在LA日系コミュニティ情報・旅行保険ガイド（2025年）",
  },
  {
    id: "citymd-urgent-care",
    category: "urgent_care",
    area: "LA",
    name: "CityMD Urgent Care（アージェントケアチェーン）",
    description:
      "LA周辺に複数店舗あるUrgent Careチェーン。予約不要・当日受診可。発熱・風邪・軽いケガ・感染症など対応。英語のみだが通訳サービス電話あり。費用は$150〜$300程度。ERの代わりに使えて待ち時間も比較的短い。",
    url: "https://www.citymd.com/",
    features: ["予約不要", "当日受診", "LA複数店舗", "ER代替"],
    keywords: ["urgent care", "アージェントケア", "救急", "病院", "発熱", "ケガ", "風邪", "予約なし"],
    source: "CityMD公式（2025年確認）",
  },
  {
    id: "torrance-memorial",
    category: "urgent_care",
    area: "LA",
    name: "Torrance Memorial Medical Center（大病院ER）",
    description:
      "トーランスの総合病院。24時間ER対応。日系コミュニティに近く、日本語通訳サービスあり（要事前確認）。旅行保険のキャッシュレス対応病院として認められやすい大病院。命の危険がある場合はここへ。",
    url: "https://www.torrancememorial.org/",
    phone: "(310) 325-9110",
    address: "3330 Lomita Blvd, Torrance, CA 90505",
    features: ["24時間ER", "日本語通訳あり", "大病院", "キャッシュレス対象になりやすい"],
    keywords: ["救急", "ER", "緊急", "病院", "大病院", "トーランス", "入院", "手術"],
    source: "Torrance Memorial公式（2025年確認）",
  },

  // OC・アナハイム アージェントケア・ER
  {
    id: "concentra-oc",
    category: "urgent_care",
    area: "OC",
    name: "Concentra Urgent Care（OC・アナハイム）",
    description:
      "アーバイン・アナハイム・コスタメサ等OCに複数拠点のアージェントケアチェーン。予約不要・当日受診可。発熱・軽いケガ・風邪など対応。費用$150〜$250程度。",
    url: "https://www.concentra.com/",
    address: "アナハイム例: 1641 W La Palma Ave, Anaheim（要確認）",
    features: ["予約不要", "当日受診", "OC複数拠点", "アナハイム近く"],
    keywords: ["urgent care", "アージェントケア", "救急", "病院", "発熱", "ケガ", "アナハイム", "OC", "アーバイン"],
    source: "Concentra公式（2025年確認）",
  },
  {
    id: "anaheim-global-medical",
    category: "urgent_care",
    area: "Anaheim",
    name: "Anaheim Global Medical Center（ER）",
    description:
      "ディズニーランドから車で約10分の24時間ER対応病院。アナハイム滞在中の緊急時に使える最寄り病院のひとつ。",
    url: "https://anaheimglobalmedical.com/",
    phone: "要確認",
    address: "1025 S Anaheim Blvd, Anaheim, CA 92805",
    features: ["24時間ER", "ディズニー近く", "アナハイム"],
    keywords: ["救急", "ER", "緊急", "病院", "アナハイム", "ディズニー", "ディズニーランド"],
    source: "公式サイト（2025年確認）",
  },
  {
    id: "hoag-hospital-oc",
    category: "urgent_care",
    area: "OC",
    name: "Hoag Hospital ニューポートビーチ（大病院ER）",
    description:
      "OCを代表する大規模病院。ニューポートビーチ本院・アーバイン分院あり。24時間ER対応。旅行保険のキャッシュレス申請も通りやすい大病院。重症時はここへ。",
    url: "https://www.hoag.org/",
    phone: "(949) 764-4624",
    address: "1 Hoag Dr, Newport Beach, CA 92663",
    features: ["24時間ER", "OC最大規模", "キャッシュレス対象になりやすい", "アーバイン分院あり"],
    keywords: ["救急", "ER", "緊急", "病院", "大病院", "OC", "アーバイン", "ニューポート", "入院"],
    source: "Hoag Hospital公式（2025年確認）",
  },
  {
    id: "choc-anaheim",
    category: "urgent_care",
    area: "OC",
    name: "Children's Hospital of Orange County（CHOC）子供専門",
    description:
      "OCの小児専門病院。24時間ER対応。子連れ旅行中に子供が急病・ケガをした場合はここへ。",
    url: "https://www.choc.org/",
    phone: "(714) 997-3000",
    address: "1201 W La Veta Ave, Orange, CA 92868",
    features: ["小児専門", "24時間ER", "子連れ対応"],
    keywords: ["救急", "ER", "子供", "小児", "病院", "OC", "アナハイム", "子連れ", "家族"],
    source: "CHOC公式（2025年確認）",
  },

  // サンディエゴ アージェントケア・ER
  {
    id: "scripps-urgent-care-sd",
    category: "urgent_care",
    area: "SanDiego",
    name: "Scripps Urgent Care（サンディエゴ）",
    description:
      "サンディエゴ最大級の医療グループScrippsのアージェントケア。ミッションバレー・ラホヤ・チュラビスタ等複数拠点。予約不要・当日受診可。発熱・軽傷・風邪など対応。",
    url: "https://www.scripps.org/services/urgent-care/",
    features: ["SD複数拠点", "予約不要", "ミッションバレー", "ラホヤ", "チュラビスタ"],
    keywords: ["urgent care", "アージェントケア", "救急", "病院", "サンディエゴ", "SD", "発熱", "ケガ"],
    source: "Scripps公式（2025年確認）",
  },
  {
    id: "sharp-urgent-care-sd",
    category: "urgent_care",
    area: "SanDiego",
    name: "Sharp Urgent Care（サンディエゴ）",
    description:
      "Scrippsと並ぶサンディエゴの主要医療グループSharpのアージェントケア。市内複数拠点。チュラビスタにも対応。",
    url: "https://www.sharp.com/urgent-care/",
    features: ["SD複数拠点", "チュラビスタ対応"],
    keywords: ["urgent care", "アージェントケア", "救急", "病院", "サンディエゴ", "SD", "チュラビスタ"],
    source: "Sharp公式（2025年確認）",
  },
  {
    id: "scripps-mercy-er-sd",
    category: "urgent_care",
    area: "SanDiego",
    name: "Scripps Mercy Hospital（サンディエゴ・ダウンタウンER）",
    description:
      "サンディエゴダウンタウン近くの総合病院ER。24時間対応。旅行保険のキャッシュレス申請も通りやすい大病院。ガスランプ・バルボア公園付近の観光中に急病になった場合に最寄り。",
    url: "https://www.scripps.org/locations/hospitals--scripps-mercy-hospital-san-diego",
    address: "4077 5th Ave, San Diego, CA 92103（Hillcrest）",
    features: ["24時間ER", "ダウンタウン近く", "大病院"],
    keywords: ["救急", "ER", "緊急", "病院", "サンディエゴ", "SD", "ダウンタウン", "入院"],
    source: "Scripps公式（2025年確認）",
  },
  {
    id: "rady-childrens-sd",
    category: "urgent_care",
    area: "SanDiego",
    name: "Rady Children's Hospital（サンディエゴ・子供専門）",
    description:
      "サンディエゴの小児専門病院。24時間ER対応。子連れ旅行中に子供が急病・ケガをした場合はここへ。",
    url: "https://www.rchsd.org/",
    phone: "(858) 576-1700",
    address: "3020 Children's Way, San Diego, CA 92123",
    features: ["小児専門", "24時間ER", "子連れ対応"],
    keywords: ["救急", "ER", "子供", "小児", "病院", "サンディエゴ", "SD", "子連れ", "家族"],
    source: "Rady Children's公式（2025年確認）",
  },

  // ── 旅行保険 ──────────────────────────────
  {
    id: "travel-insurance-guide",
    category: "insurance",
    area: "SoCal",
    name: "旅行保険 緊急時の使い方ガイド",
    description:
      "【緊急時の手順】①まず保険会社の24時間緊急連絡先に電話（英語・日本語対応）→②指示に従い病院へ→③領収書・診断書（英語）を必ずもらう→④帰国後に請求書類を提出。\n\n【キャッシュレス診療】保険会社が病院に直接払う方式。大病院（Cedars-Sinai・UCLA等）は対応していることが多い。日系の小クリニックは立替払いになる場合が多い。\n\n【立替払い】自分で払って帰国後に請求。どの病院でも使えるが、高額になるので上限を事前確認。\n\n【重要】病院に行く前に必ず保険会社へ連絡。無断で受診すると保険が下りないことがある。",
    features: ["緊急時手順", "キャッシュレス説明", "立替払い説明", "必要書類"],
    keywords: ["保険", "旅行保険", "キャッシュレス", "立替払い", "医療費", "病院", "請求", "補償"],
    source: "各社旅行保険約款・在米日系情報（2025年）",
  },
  {
    id: "sompo-emergency",
    category: "insurance",
    area: "SoCal",
    name: "損保ジャパン 海外緊急連絡先",
    description:
      "損保ジャパンの旅行保険加入者向け24時間緊急サービス。\n📞 アメリカから（フリーダイヤル）: 1-800-233-2203\n病院案内・キャッシュレス手配・通訳手配も依頼可能。大里メディカルクリニック等と提携済み。",
    phone: "1-800-233-2203（アメリカから・24時間・無料）",
    features: ["24時間日本語対応", "病院案内", "キャッシュレス手配", "通訳手配"],
    keywords: ["保険", "旅行保険", "損保ジャパン", "緊急", "連絡先", "医療費", "キャッシュレス"],
    source: "損保ジャパン公式（2025年確認）",
  },
  {
    id: "tokiomarine-emergency",
    category: "insurance",
    area: "SoCal",
    name: "東京海上日動 海外緊急連絡先",
    description:
      "東京海上日動の旅行保険加入者向け24時間緊急サービス。\n📞 コレクトコール（無料）: 03-6758-2460\n📱 「MARINE PASSPORT」アプリの無料通話機能も使えて便利。病院案内・キャッシュレス手配・通訳手配・医療費立替も依頼可能。",
    phone: "03-6758-2460（コレクトコール・24時間）",
    features: ["24時間日本語対応", "アプリ無料通話あり", "キャッシュレス手配", "医療費立替"],
    keywords: ["保険", "旅行保険", "東京海上", "日動", "緊急", "連絡先", "医療費", "キャッシュレス"],
    source: "東京海上日動公式（2025年確認）",
  },
  {
    id: "aig-emergency",
    category: "insurance",
    area: "SoCal",
    name: "AIG損保 海外緊急連絡先",
    description:
      "AIG損保の旅行保険加入者向け24時間緊急サービス。\n📞 海外から日本へ: +81-3-5619-2741\n📞 日本国内フリー: 0120-04-1799\nキャッシュレス手配・病院案内・通訳手配可能。ニューサンライズクリニック等と提携済み。",
    phone: "+81-3-5619-2741（海外から・24時間）",
    features: ["24時間日本語対応", "キャッシュレス手配", "通訳手配"],
    keywords: ["保険", "旅行保険", "AIG", "緊急", "連絡先", "医療費", "キャッシュレス"],
    source: "AIG損保公式（2025年確認）",
  },
  {
    id: "au-sonpo-emergency",
    category: "insurance",
    area: "SoCal",
    name: "au損保 海外緊急連絡先",
    description:
      "au損保の旅行保険加入者向け24時間緊急サービス。\n📞 コレクトコール: +81-3-6365-8885\n保険証券に記載のワールドフリーフォンも利用可。",
    phone: "+81-3-6365-8885（コレクトコール・24時間）",
    features: ["24時間日本語対応", "コレクトコール可"],
    keywords: ["保険", "旅行保険", "au損保", "緊急", "連絡先", "医療費", "キャッシュレス"],
    source: "au損保公式（2025年確認）",
  },

  // ── 観光スポット実用情報 ──────────────────────────────
  {
    id: "disneyland-guide",
    category: "transport",
    area: "Anaheim",
    name: "ディズニーランド・リゾート 実用ガイド",
    description:
      "住所: 1313 Disneyland Dr, Anaheim, CA 92802\n\n【チケット】公式アプリ or ウェブで事前購入必須。当日窓口は割高＆売切れリスクあり。\n【ライトニングレーン】有料の時間指定パス。人気アトラクションは朝イチで取得を。\n【日本語】公式アプリ・ガイドマップは日本語対応。日本語キャストは少数だが在籍。\n【アクセス】LAXから車で約45分。アナハイム・リゾート・トランジット（ART）バスが周辺ホテルと直結。\n【食事】パーク内も選択肢多数だがお高め（$15〜$30）。事前予約できるレストランもある。",
    url: "https://disneyland.disney.go.com/",
    address: "1313 Disneyland Dr, Anaheim, CA 92802",
    features: ["日本語アプリ", "事前チケット必須", "LAXから45分", "アナハイム"],
    keywords: ["ディズニー", "ディズニーランド", "Disney", "アナハイム", "テーマパーク", "アトラクション"],
    source: "Disney公式（2025〜2026年確認）",
  },
  {
    id: "sandiego-zoo-guide",
    category: "transport",
    area: "SanDiego",
    name: "サンディエゴ動物園 実用ガイド",
    description:
      "住所: 2920 Zoo Dr, San Diego, CA 92101（バルボア公園内）\n\n世界最大級の動物園。パンダ・コアラ・キリンなど約650種。\n【チケット】公式サイト事前購入推奨（$65〜）。サファリパークとのセット券もお得。\n【日本語】日本語ガイドマップあり（配布数限定）。案内は英語主体。\n【アクセス】ダウンタウンから車で約10分。駐車場あり（無料）。\n【滞在時間】動物園＋サファリパークで丸1日かかる。どちらかに絞るのが現実的。",
    url: "https://zoo.sandiegozoo.org/",
    address: "2920 Zoo Dr, San Diego, CA 92101",
    features: ["世界最大級", "日本語マップあり", "駐車場無料", "バルボア公園"],
    keywords: ["動物園", "サンディエゴ", "SD", "Zoo", "パンダ", "コアラ", "観光", "家族", "子連れ"],
    source: "San Diego Zoo公式（2025年確認）",
  },
  {
    id: "legoland-guide",
    category: "transport",
    area: "SanDiego",
    name: "LEGOLAND California 実用ガイド",
    description:
      "住所: 1 Legoland Dr, Carlsbad, CA 92008（サンディエゴから車40分）\n\n子連れに人気のテーマパーク。2〜12歳向けのアトラクション多数。\n【チケット】公式サイト事前購入推奨（$90〜）。水族館・ウォーターパークのコンボ券もあり。\n【日本語】案内は英語のみ。入場ゲートでマップをもらう。\n【アクセス】サンディエゴから車で約40分北上。",
    url: "https://www.legoland.com/california/",
    address: "1 Legoland Dr, Carlsbad, CA 92008",
    features: ["子供向け", "カールスバッド", "水族館コンボあり"],
    keywords: ["レゴランド", "LEGOLAND", "子供", "子連れ", "家族", "サンディエゴ", "カールスバッド", "テーマパーク"],
    source: "LEGOLAND公式（2025年確認）",
  },

  // ── 法律 ──────────────────────────────
  {
    id: "kimura-london-white",
    category: "legal",
    area: "LA",
    name: "Kimura London & White LLP（キムラ ロンドン＆ホワイト）",
    description:
      "交通事故・人身事故・企業法務・不動産・雇用法・民事訴訟・エステートプランに対応。日本の相続・年金書類も取り扱い。日本語での相談可。",
    url: "https://japanesespeakingattorney.com/",
    features: ["交通事故", "企業法務", "日本相続対応", "民事訴訟"],
    keywords: ["弁護士", "法律", "事故", "交通事故", "裁判", "相続", "法的"],
    source: "ビビナビLA / ライトハウスLA（2025年確認）",
  },
  {
    id: "mao-law",
    category: "legal",
    area: "LA",
    name: "まお法律事務所（Mao Law Offices）",
    description:
      "移民・離婚・自己破産・労働法・民事・刑事など幅広く日本語対応。LA以外の州や日本在住者のケースも対応。日本語直通あり。",
    url: "https://www.maolawoffices.com/",
    phone: "(626) 272-3142（日本語直通）",
    features: ["移民ビザ", "離婚", "労働法", "刑事", "幅広く対応"],
    keywords: ["弁護士", "法律", "移民", "ビザ", "離婚", "労働", "刑事", "法的"],
    source: "公式サイト（2025年確認）",
  },

  // ── 緊急 ──────────────────────────────
  {
    id: "japanese-consulate-la",
    category: "emergency",
    area: "SoCal",
    name: "在ロサンゼルス日本国総領事館",
    description:
      "緊急時24時間対応。パスポート紛失・事故・逮捕・病気など何があっても日本語で相談できる。医療機関リスト・弁護士情報の案内もある。",
    url: "https://www.la.us.emb-japan.go.jp/itprtop_ja/index.html",
    phone: "(213) 617-6700（緊急時24時間）",
    address: "350 S Grand Ave, Suite 1700, Los Angeles, CA 90071",
    hours: "窓口: 平日9:30〜12:00 / 13:00〜16:30（緊急は24時間）",
    features: ["24時間緊急対応", "パスポート紛失", "事故・逮捕", "医療機関案内"],
    keywords: ["緊急", "パスポート", "紛失", "盗難", "事故", "逮捕", "救急", "病院", "領事館", "大使館"],
    source: "総領事館公式（2025年確認）",
  },
  {
    id: "lafla-legal-aid",
    category: "legal",
    area: "LA",
    name: "LAFLA 日本語無料法律相談",
    description:
      "Legal Aid Foundation of LAが提供する日本語での無料法律相談窓口。費用を払えない方向け。",
    url: "https://lafla.org/get-help/get-legal-help-japanese/",
    features: ["無料", "日本語", "法律相談", "低所得者向け"],
    keywords: ["弁護士", "法律", "無料", "相談"],
    source: "LAFLA公式（2025年確認）",
  },
];

// ─────────────────────────────────────────────
// エリア検出（ユーザーメッセージから推定）
// ─────────────────────────────────────────────

const AREA_KEYWORDS: Record<Area, string[]> = {
  LA:        ["LA", "ロサンゼルス", "ハリウッド", "サンタモニカ", "トーランス", "ガーデナ", "ダウンタウン", "ベニス", "マリナデルレイ", "LAX"],
  OC:        ["OC", "オレンジカウンティ", "アーバイン", "コスタメサ", "ニューポート", "ハンティントン", "ガーデングローブ", "フラートン", "ブレア", "Brea"],
  Anaheim:   ["アナハイム", "ディズニーランド", "ディズニー", "Disney", "anaheim", "ナッツベリー", "エンジェルス"],
  SanDiego:  ["サンディエゴ", "San Diego", "SD", "ラホヤ", "コロナド", "バルボア", "ガスランプ", "チュラビスタ", "動物園"],
  SoCal:     ["南カリフォルニア", "SoCal", "カリフォルニア"],
};

export function detectArea(message: string): Area[] {
  const detected: Area[] = [];
  for (const [area, kws] of Object.entries(AREA_KEYWORDS) as [Area, string[]][]) {
    if (kws.some((kw) => message.includes(kw))) {
      detected.push(area);
    }
  }
  // アナハイムはOCの一部なのでOCも追加
  if (detected.includes("Anaheim") && !detected.includes("OC")) detected.push("OC");
  return detected;
}

// ─────────────────────────────────────────────
// キーワードマッチング検索
// ─────────────────────────────────────────────

/**
 * ユーザーのメッセージに関連するビジネス情報を返す
 * エリアが検出された場合はそのエリアを優先する（SoCalは全エリア対象）
 * @param message ユーザーメッセージ
 * @param maxResults 最大件数（デフォルト3）
 */
export function searchKnowledge(message: string, maxResults = 3): Business[] {
  const detectedAreas = detectArea(message);

  const scored = KNOWLEDGE_BASE.map((biz) => {
    const keywordScore = biz.keywords.reduce((acc, kw) => {
      return acc + (message.includes(kw) ? 1 : 0);
    }, 0);

    // エリアボーナス：ユーザーが言及したエリアに一致 or SoCalは全エリアに適用
    let areaBonus = 0;
    if (detectedAreas.length > 0) {
      if (biz.area === "SoCal") areaBonus = 1;
      else if (detectedAreas.includes(biz.area)) areaBonus = 2;
    }

    return { biz, score: keywordScore + areaBonus };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((x) => x.biz);
}

/**
 * カテゴリ別に絞り込む
 */
export function searchByCategory(categories: Category[], maxResults = 5): Business[] {
  return KNOWLEDGE_BASE.filter((b) => categories.includes(b.category)).slice(0, maxResults);
}
