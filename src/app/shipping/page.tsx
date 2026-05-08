"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ── 定数 ──────────────────────────────────────────────────────────────────────
const TIME_SLOTS = ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00"] as const;
type TimeSlot = (typeof TIME_SLOTS)[number];

const PRICE = {
  "OC-指定日": 99,
  "LA-指定日": 120,
  "OC-日時指定": 149,
  "LA-日時指定": 180,
};

// 集荷可能曜日（0=日,1=月,...6=土）
const ALLOWED_DAYS: Record<string, number[]> = {
  "OC-指定日": [1, 3, 5], // 月水金
  "LA-指定日": [2, 4],    // 火木
};
const DAY_LABEL: Record<string, string> = {
  "OC-指定日": "月・水・金のみ",
  "LA-指定日": "火・木のみ",
};

// ── 料金計算 ──────────────────────────────────────────────────────────────────
function calcPrice(area: string, type: string, boxes: number, items: number, hasLarge: boolean) {
  const key = `${area}-${type === "指定日集荷" ? "指定日" : "日時指定"}` as keyof typeof PRICE;
  const base = PRICE[key];
  if (!base) return null;
  const extra = Math.max(0, boxes - 1) * 39 + (items >= 20 ? 20 : 0);
  return { base, extra, total: base + extra, hasLarge };
}

// ── 最短集荷可能日（LA時間で前日20時まで）──────────────────────────────────
function getMinPickupDate(): string {
  // LA時間（UTC-7 PDT / UTC-8 PST）を簡易計算
  const now = new Date();
  const laOffset = -7 * 60; // PDT（夏時間）
  const laMs = now.getTime() + (now.getTimezoneOffset() + laOffset) * 60000;
  const laDate = new Date(laMs);
  const laHour = laDate.getHours();
  // 20時以降は翌々日から、20時前は翌日から
  const addDays = laHour >= 20 ? 2 : 1;
  const min = new Date(laMs + addDays * 86400000);
  return min.toISOString().split("T")[0];
}

// ── 曜日チェック ──────────────────────────────────────────────────────────────
function checkDay(dateStr: string, area: string, type: string): boolean {
  if (!dateStr || type !== "指定日集荷") return true;
  const key = `${area}-指定日`;
  const allowed = ALLOWED_DAYS[key];
  if (!allowed) return true;
  const day = new Date(dateStr + "T12:00:00").getDay();
  return allowed.includes(day);
}

// ── YesNoボタン ───────────────────────────────────────────────────────────────
function YesNo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {["yes", "no"].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
            value === v
              ? v === "yes"
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-slate-600 border-slate-600 text-white"
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
          }`}
        >
          {v === "yes" ? "✓ あり" : "✕ なし"}
        </button>
      ))}
    </div>
  );
}

// ── 確認画面 ──────────────────────────────────────────────────────────────────
function Done({ pickupDate, pickupTime, hotelName, itemCount, boxCount }: {
  pickupDate: string; pickupTime: string; hotelName: string; itemCount: string; boxCount: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center space-y-5">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-slate-800">お申し込みありがとうございます</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left space-y-1">
          <p className="text-sm font-semibold text-blue-700">📱 スタッフよりご連絡します</p>
          <p className="text-xs text-blue-600">ご入力のメールアドレス宛に、24時間以内に発送可否と料金をご案内します。</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm">
          {[
            ["集荷希望日", pickupDate],
            ["集荷時間", pickupTime],
            ["ホテル名", hotelName],
            ["商品点数", `${itemCount} 点`],
            ["箱数予定", `${boxCount || "1"} 箱`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-slate-400">{label}</span>
              <span className="font-medium text-slate-700">{val}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-left text-amber-700 bg-amber-50 rounded-xl p-3 space-y-1">
          <p>※ 国際送料は集荷・梱包後に実費でご案内します</p>
          <p>※ 発送できない商品がある場合は別途ご連絡します</p>
        </div>

        <Link href="/" className="block text-sm text-blue-500 underline">
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
export default function ShippingPage() {
  const searchParams = useSearchParams();
  const lineUserId = searchParams.get("uid") ?? "";

  // お客様情報
  const [fullName, setFullName] = useState("");
  const [lineDisplayName, setLineDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // 集荷
  const [area, setArea] = useState("");
  const [pickupType, setPickupType] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  // ホテル
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [checkoutDate, setCheckoutDate] = useState("");
  // 商品
  const [itemCount, setItemCount] = useState("");
  const [boxCount, setBoxCount] = useState("1");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [hasFood, setHasFood] = useState("");
  const [hasLiquid, setHasLiquid] = useState("");
  const [hasFragile, setHasFragile] = useState("");
  const [hasLarge, setHasLarge] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  // 送り先
  const [destZip, setDestZip] = useState("");
  const [destAddress, setDestAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressType, setAddressType] = useState("");
  // その他
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [dayWarning, setDayWarning] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // 満枠チェック
  const fetchSlots = useCallback(async () => {
    if (!area || !pickupDate) return;
    try {
      const res = await fetch(`/api/shipping/slots?area=${area}&date=${pickupDate}`);
      if (res.ok) setSlotCounts(await res.json());
    } catch { /* ignore */ }
  }, [area, pickupDate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // 曜日警告
  useEffect(() => {
    if (!pickupDate || !area || pickupType !== "指定日集荷") { setDayWarning(""); return; }
    const key = `${area}-指定日`;
    if (!checkDay(pickupDate, area, pickupType)) {
      setDayWarning(`⚠️ この曜日は集荷できません（${DAY_LABEL[key] || ""}）`);
    } else {
      setDayWarning("");
    }
  }, [pickupDate, area, pickupType]);

  // 料金計算
  const price = area && pickupType
    ? calcPrice(area, pickupType, parseInt(boxCount) || 1, parseInt(itemCount) || 0, hasLarge === "yes")
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedTerms) { setErrorMsg("注意事項への同意が必要です"); return; }
    if (!photos || photos.length === 0) { setErrorMsg("商品写真を1枚以上アップロードしてください"); return; }
    if (dayWarning) { setErrorMsg("集荷日の曜日をご確認ください"); return; }
    if (!hasFood || !hasLiquid || !hasFragile || !hasLarge) { setErrorMsg("商品情報の「あり/なし」をすべて選択してください"); return; }

    setStatus("submitting");
    setErrorMsg("");
    try {
      const fd = new FormData();
      const fields: Record<string, string> = {
        full_name: fullName, line_display_name: lineDisplayName, email, phone,
        area, pickup_type: pickupType, pickup_date: pickupDate, pickup_time: pickupTime,
        hotel_name: hotelName, hotel_address: hotelAddress, room_number: roomNumber, checkout_date: checkoutDate,
        item_count: itemCount, box_count: boxCount, purchase_amount: purchaseAmount,
        has_food: hasFood, has_liquid: hasLiquid, has_fragile: hasFragile, has_large: hasLarge,
        item_notes: itemNotes, dest_zip: destZip, dest_address: destAddress,
        recipient_name: recipientName, recipient_phone: recipientPhone, address_type: addressType,
        agreed_terms: "true",
        estimated_price: price ? String(price.total) : "要見積もり",
        line_user_id: lineUserId,
      };
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
      for (let i = 0; i < photos.length; i++) fd.append("photos", photos[i]);

      const res = await fetch("/api/shipping/submit", { method: "POST", body: fd });
      const json = await res.json();
      if (json.ok) { setStatus("done"); }
      else { setStatus("error"); setErrorMsg(json.error ?? "送信に失敗しました"); }
    } catch {
      setStatus("error");
      setErrorMsg("通信エラーが発生しました。再度お試しください");
    }
  }

  if (status === "done") {
    return <Done pickupDate={pickupDate} pickupTime={pickupTime} hotelName={hotelName} itemCount={itemCount} boxCount={boxCount} />;
  }

  // ── スタイル定数
  const inp = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";
  const lbl = "block text-sm font-semibold text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

        {/* ヘッダー */}
        <div>
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 mb-3 inline-block">← 戻る</Link>
          <h1 className="text-2xl font-bold mb-1">🇺🇸 → 🇯🇵 発送代行 申し込み</h1>
          <p className="text-sm text-slate-500">ホテルで集荷して日本へ発送します</p>
        </div>

        {/* サービス概要カード */}
        <div className="bg-blue-600 text-white rounded-2xl p-5 space-y-3">
          <p className="font-bold text-base">📦 サービスの流れ</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/20 rounded-xl p-2">
              <div className="text-xl mb-1">🏨</div>
              <div>①ホテルで集荷</div>
            </div>
            <div className="bg-white/20 rounded-xl p-2">
              <div className="text-xl mb-1">📦</div>
              <div>②梱包・発送</div>
            </div>
            <div className="bg-white/20 rounded-xl p-2">
              <div className="text-xl mb-1">🏠</div>
              <div>③日本に届く</div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-xs space-y-1">
            <p>・OC 指定日集荷（月・水・金）：$99〜</p>
            <p>・LA 指定日集荷（火・木）：$120〜</p>
            <p>・日時指定：OC $149〜 / LA $180〜</p>
            <p className="text-white/70">※国際送料は梱包後に実費でご案内</p>
          </div>
        </div>

        {/* 料金バッジ（選択後に表示） */}
        {price && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">現在の概算料金</p>
              <p className="text-2xl font-bold text-green-700">${price.total}</p>
              {price.hasLarge && <p className="text-xs text-orange-500">+ 大型商品 要見積もり</p>}
              {price.extra > 0 && <p className="text-xs text-slate-400">（追加料金 +${price.extra} 含む）</p>}
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>+ 国際送料</p>
              <p>（実費）</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── ① お客様情報 ── */}
          <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">1</span>
              お客様情報
            </h2>
            <div>
              <label className={lbl}>お名前（漢字）<span className="text-red-400">*</span></label>
              <input required className={inp} placeholder="山田 太郎" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>LINE表示名</label>
              <input className={inp} placeholder="Taro" value={lineDisplayName} onChange={e => setLineDisplayName(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>メールアドレス<span className="text-red-400">*</span></label>
              <input required type="email" className={inp} placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>電話番号（日本）<span className="text-red-400">*</span></label>
              <input required type="tel" className={inp} placeholder="090-0000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          {/* ── ② 集荷エリア・タイプ ── */}
          <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">2</span>
              集荷エリアと日程
            </h2>

            {/* エリア選択 */}
            <div>
              <label className={lbl}>集荷エリア<span className="text-red-400">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {[["OC", "オレンジカウンティ"], ["LA", "ロサンゼルス"], ["その他", "その他"]].map(([val, desc]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setArea(val); setPickupDate(""); setPickupTime(""); }}
                    className={`border rounded-xl p-3 text-center transition-all ${
                      area === val ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    <div className="font-bold text-sm">{val}</div>
                    <div className="text-xs opacity-70">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 集荷タイプ */}
            <div>
              <label className={lbl}>集荷タイプ<span className="text-red-400">*</span></label>
              <div className="space-y-2">
                {[
                  { val: "指定日集荷", desc: area ? `${area === "OC" ? "月・水・金" : area === "LA" ? "火・木" : "要相談"}のみ集荷可` : "OC: 月水金 / LA: 火木", price: area === "OC" ? "$99" : area === "LA" ? "$120" : "" },
                  { val: "日時指定集荷", desc: "曜日の制限なし（別途料金）", price: area === "OC" ? "$149〜" : area === "LA" ? "$180〜" : "" },
                ].map(({ val, desc, price: p }) => (
                  <label
                    key={val}
                    className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-all ${
                      pickupType === val ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pickup_type"
                      required
                      value={val}
                      checked={pickupType === val}
                      onChange={() => { setPickupType(val); setPickupDate(""); setPickupTime(""); }}
                      className="shrink-0"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{val}</div>
                      <div className="text-xs text-slate-400">{desc}</div>
                    </div>
                    {p && <span className="text-sm font-bold text-blue-600">{p}</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* 集荷日 */}
            <div>
              <label className={lbl}>
                希望集荷日<span className="text-red-400">*</span>
                {area && pickupType === "指定日集荷" && (
                  <span className="text-xs text-blue-500 font-normal ml-2">{DAY_LABEL[`${area}-指定日`] || ""}</span>
                )}
              </label>
              <input
                type="date"
                required
                min={getMinPickupDate()}
                className={inp + (dayWarning ? " border-red-400 bg-red-50" : "")}
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">※ 前日20時（LA時間）までにお申し込みください</p>
              {dayWarning && <p className="mt-1.5 text-xs text-red-500 font-medium">{dayWarning}</p>}
            </div>

            {/* 時間枠 */}
            <div>
              <label className={lbl}>希望時間帯<span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const cnt = slotCounts[slot] ?? 0;
                  const full = cnt >= 2;
                  return (
                    <label
                      key={slot}
                      className={`relative border rounded-xl p-3 text-center cursor-pointer transition-all ${
                        full
                          ? "bg-slate-100 border-slate-200 cursor-not-allowed"
                          : pickupTime === slot
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pickup_time"
                        required
                        value={slot}
                        disabled={full}
                        checked={pickupTime === slot}
                        onChange={() => !full && setPickupTime(slot)}
                        className="sr-only"
                      />
                      <div className={`text-sm font-medium ${full ? "text-slate-400" : pickupTime === slot ? "text-white" : "text-slate-700"}`}>{slot}</div>
                      {full
                        ? <div className="text-xs text-red-400 font-medium mt-0.5">満枠</div>
                        : <div className={`text-xs mt-0.5 ${pickupTime === slot ? "text-white/70" : "text-slate-400"}`}>残り{2 - cnt}枠</div>
                      }
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">各枠 最大2件まで</p>
            </div>
          </div>

          {/* ── ③ ホテル情報 ── */}
          <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">3</span>
              集荷先情報
            </h2>
            <div>
              <label className={lbl}>ホテル名<span className="text-red-400">*</span></label>
              <input required className={inp} placeholder="Hilton Anaheim（友人宅の場合は「なし」）" value={hotelName} onChange={e => setHotelName(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">ホテル以外（友人宅など）の場合は「なし」と入力してください</p>
            </div>
            <div>
              <label className={lbl}>ホテル住所<span className="text-red-400">*</span></label>
              <input required className={inp} placeholder="777 Convention Way, Anaheim, CA" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>部屋番号（任意）</label>
                <input className={inp} placeholder="1234" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>チェックアウト日<span className="text-red-400">*</span></label>
                <input required type="date" className={inp} value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── ④ 商品情報 ── */}
          <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">4</span>
              商品情報
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>商品点数<span className="text-red-400">*</span></label>
                <input required type="number" min={1} className={inp} placeholder="10" value={itemCount} onChange={e => setItemCount(e.target.value)} />
                {parseInt(itemCount) >= 20 && (
                  <p className="text-xs text-orange-500 mt-1">20点以上 +$20</p>
                )}
              </div>
              <div>
                <label className={lbl}>箱数予定<span className="text-red-400">*</span></label>
                <input required type="number" min={1} className={inp} value={boxCount} onChange={e => setBoxCount(e.target.value)} />
                {parseInt(boxCount) >= 2 && (
                  <p className="text-xs text-orange-500 mt-1">+${(parseInt(boxCount) - 1) * 39}（追加箱）</p>
                )}
              </div>
            </div>

            <div>
              <label className={lbl}>
                商品写真<span className="text-red-400">*</span>
                <span className="text-slate-400 font-normal text-xs ml-1">（複数枚OK）</span>
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                <input
                  type="file"
                  required
                  multiple
                  accept="image/*"
                  className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:text-sm file:font-medium"
                  onChange={e => setPhotos(e.target.files)}
                />
                {photos && photos.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">✓ {photos.length}枚選択済み</p>
                )}
                <p className="text-xs text-slate-400 mt-2">全商品が写るよう撮影してください</p>
              </div>
            </div>

            <div>
              <label className={lbl}>おおよその購入金額</label>
              <input className={inp} placeholder="例：$300" value={purchaseAmount} onChange={e => setPurchaseAmount(e.target.value)} />
            </div>

            {/* あり/なし セクション */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">商品内容の確認<span className="text-red-400">*</span></p>
              {[
                { label: "🍫 食品", state: hasFood, set: setHasFood },
                { label: "💧 液体", state: hasLiquid, set: setHasLiquid },
                { label: "🪟 壊れ物", state: hasFragile, set: setHasFragile },
                { label: "📦 大型商品", state: hasLarge, set: setHasLarge },
              ].map(({ label, state, set }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm w-24 shrink-0">{label}</span>
                  <YesNo value={state} onChange={set} />
                </div>
              ))}
              {hasLarge === "yes" && (
                <p className="text-xs text-orange-500 bg-orange-50 rounded-lg p-2">
                  ⚠️ 大型商品は別途お見積もりとなります
                </p>
              )}
            </div>

            <div>
              <label className={lbl}>備考（任意）</label>
              <textarea
                rows={3}
                className={inp + " resize-none"}
                placeholder="ブランド品・精密機器など特記事項があれば"
                value={itemNotes}
                onChange={e => setItemNotes(e.target.value)}
              />
            </div>
          </div>

          {/* ── ⑤ 日本の送り先 ── */}
          <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">5</span>
              日本の送り先
            </h2>
            <div className="grid grid-cols-3 gap-2 mb-1">
              {["自宅", "会社", "その他"].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAddressType(t)}
                  className={`border rounded-xl py-2.5 text-sm font-medium transition-all ${
                    addressType === t ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div>
              <label className={lbl}>郵便番号<span className="text-red-400">*</span></label>
              <input required className={inp} placeholder="123-4567" value={destZip} onChange={e => setDestZip(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>住所<span className="text-red-400">*</span></label>
              <input required className={inp} placeholder="東京都渋谷区〇〇1-1-1" value={destAddress} onChange={e => setDestAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>受取人名<span className="text-red-400">*</span></label>
                <input required className={inp} placeholder="山田 太郎" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>受取人電話番号<span className="text-red-400">*</span></label>
                <input required type="tel" className={inp} placeholder="090-0000-0000" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── 注意事項・同意 ── */}
          <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-700">⚠️ 注意事項</h2>
            <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
              <p>・国際送料・関税・消費税・通関上の追加費用はお客様負担です</p>
              <p>・発送できない商品があります。商品確認後に発送可否をご案内します</p>
              <p>・商品点数が20点以上の場合、追加作業料が発生する場合があります</p>
              <p>・追加箱が必要な場合、1箱につき+$39となります</p>
              <p>・配送中の遅延、破損、紛失、税関での開封・差し止めについては配送会社・税関の判断となります</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer bg-slate-50 rounded-xl p-3">
              <input
                type="checkbox"
                required
                checked={agreedTerms}
                onChange={e => setAgreedTerms(e.target.checked)}
                className="mt-0.5 shrink-0 w-5 h-5 rounded accent-blue-600"
              />
              <span className="text-sm font-medium text-slate-700">
                上記の注意事項を確認し、同意します<span className="text-red-400">*</span>
              </span>
            </label>
          </div>

          {/* エラー */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* 料金サマリー（送信前） */}
          {price && (
            <div className="bg-slate-800 text-white rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">概算合計（国際送料別）</p>
                <p className="text-3xl font-bold">${price.total}</p>
                {price.hasLarge && <p className="text-xs text-orange-300">+ 大型品 要見積もり</p>}
              </div>
              <div className="text-xs text-slate-400 text-right">
                <p>国際送料は</p>
                <p>梱包後に案内</p>
              </div>
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl py-5 text-lg font-bold shadow-md transition-all disabled:opacity-50"
          >
            {status === "submitting" ? "送信中..." : "申し込む →"}
          </button>
          <p className="text-center text-xs text-slate-400 pb-6">
            送信後、スタッフより確認のご連絡をいたします
          </p>
        </form>
      </div>
    </div>
  );
}
