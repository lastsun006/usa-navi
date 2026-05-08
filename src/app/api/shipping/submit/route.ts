// shipping_bookings
// CREATE TABLE shipping_bookings (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   full_name TEXT NOT NULL,
//   line_display_name TEXT,
//   email TEXT NOT NULL,
//   phone TEXT NOT NULL,
//   area TEXT NOT NULL,
//   pickup_type TEXT NOT NULL,
//   pickup_date TEXT NOT NULL,
//   pickup_time TEXT NOT NULL,
//   hotel_name TEXT NOT NULL,
//   hotel_address TEXT NOT NULL,
//   room_number TEXT,
//   checkout_date TEXT NOT NULL,
//   item_count INTEGER NOT NULL,
//   box_count INTEGER NOT NULL DEFAULT 1,
//   photo_urls JSONB DEFAULT '[]',
//   purchase_amount TEXT,
//   has_food BOOLEAN DEFAULT FALSE,
//   has_liquid BOOLEAN DEFAULT FALSE,
//   has_fragile BOOLEAN DEFAULT FALSE,
//   has_large BOOLEAN DEFAULT FALSE,
//   item_notes TEXT,
//   dest_zip TEXT NOT NULL,
//   dest_address TEXT NOT NULL,
//   recipient_name TEXT NOT NULL,
//   recipient_phone TEXT NOT NULL,
//   address_type TEXT NOT NULL,
//   agreed_terms BOOLEAN NOT NULL,
//   estimated_price TEXT,
//   status TEXT DEFAULT 'pending',
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function pushLineMessage(userId: string, message: string) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text: message }],
    }),
  });
  if (!res.ok) {
    console.error("LINE push error:", res.status, await res.text());
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 画像アップロード
    const photoFiles = formData.getAll("photos") as File[];
    const photoUrls: string[] = [];

    try {
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        if (!file || file.size === 0) continue;

        const ext = file.name.split(".").pop() ?? "jpg";
        const fileName = `${Date.now()}_${i}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
          .from("shipping-photos")
          .upload(fileName, buffer, {
            contentType: file.type || "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("shipping-photos")
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          photoUrls.push(urlData.publicUrl);
        }
      }
    } catch (storageErr) {
      console.error("Storage error (continuing without photos):", storageErr);
    }

    // フォームデータ取得
    const fullName = formData.get("full_name") as string;
    const lineDisplayName = formData.get("line_display_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const area = formData.get("area") as string;
    const pickupType = formData.get("pickup_type") as string;
    const pickupDate = formData.get("pickup_date") as string;
    const pickupTime = formData.get("pickup_time") as string;
    const hotelName = formData.get("hotel_name") as string;
    const hotelAddress = formData.get("hotel_address") as string;
    const roomNumber = formData.get("room_number") as string;
    const checkoutDate = formData.get("checkout_date") as string;
    const itemCount = parseInt(formData.get("item_count") as string, 10);
    const boxCount = parseInt(formData.get("box_count") as string, 10) || 1;
    const purchaseAmount = formData.get("purchase_amount") as string;
    const hasFood = formData.get("has_food") === "yes";
    const hasLiquid = formData.get("has_liquid") === "yes";
    const hasFragile = formData.get("has_fragile") === "yes";
    const hasLarge = formData.get("has_large") === "yes";
    const itemNotes = formData.get("item_notes") as string;
    const destZip = formData.get("dest_zip") as string;
    const destAddress = formData.get("dest_address") as string;
    const recipientName = formData.get("recipient_name") as string;
    const recipientPhone = formData.get("recipient_phone") as string;
    const addressType = formData.get("address_type") as string;
    const agreedTerms = formData.get("agreed_terms") === "true";
    const estimatedPrice = formData.get("estimated_price") as string;
    const lineUserId = formData.get("line_user_id") as string;

    // LINE admin通知（最初に送る）
    const adminUserId = process.env.LINE_ADMIN_USER_ID;
    if (adminUserId) {
      const notification = `📦 新規発送代行申し込み

👤 ${fullName}（LINE: ${lineDisplayName || "未記入"}）
📧 ${email}
📞 ${phone}

📍 エリア：${area} / ${pickupType}
📅 集荷日：${pickupDate} ${pickupTime}
🏨 ホテル：${hotelName} ${roomNumber ? `（${roomNumber}号室）` : ""}
　住所：${hotelAddress}
　チェックアウト：${checkoutDate}

📦 商品：${itemCount}点 / ${boxCount}箱
💰 購入金額：${purchaseAmount || "未記入"}
食品:${hasFood ? "あり" : "なし"} 液体:${hasLiquid ? "あり" : "なし"} 壊れ物:${hasFragile ? "あり" : "なし"} 大型:${hasLarge ? "あり" : "なし"}
${itemNotes ? `備考：${itemNotes}` : ""}

📮 日本の送り先（${addressType}）
〒${destZip} ${destAddress}
受取人：${recipientName}
TEL：${recipientPhone}

💵 概算：$${estimatedPrice || "要見積もり"} + 国際送料`;

      await pushLineMessage(adminUserId, notification);
    } else {
      console.error("LINE_ADMIN_USER_ID is not set");
    }

    // ユーザーへLINE確認通知
    if (lineUserId) {
      const userNotification = [
        "📦 発送代行のお申し込みを受け付けました！",
        "",
        `集荷日：${pickupDate}（${pickupTime}）`,
        `ホテル：${hotelName}`,
        `商品：${itemCount}点 / ${boxCount}箱`,
        `概算料金：$${estimatedPrice || "要見積もり"}（国際送料別）`,
        "",
        "スタッフより24時間以内にご連絡します😊",
        "ご不明な点はいつでもLINEでどうぞ！",
      ].join("\n");
      await pushLineMessage(lineUserId, userNotification);
    }

    // DBインサート
    const { error: insertError } = await supabase.from("shipping_bookings").insert({
      full_name: fullName,
      line_display_name: lineDisplayName || null,
      email,
      phone,
      area,
      pickup_type: pickupType,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      hotel_name: hotelName,
      hotel_address: hotelAddress,
      room_number: roomNumber || null,
      checkout_date: checkoutDate,
      item_count: itemCount,
      box_count: boxCount,
      photo_urls: photoUrls,
      purchase_amount: purchaseAmount || null,
      has_food: hasFood,
      has_liquid: hasLiquid,
      has_fragile: hasFragile,
      has_large: hasLarge,
      item_notes: itemNotes || null,
      dest_zip: destZip,
      dest_address: destAddress,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      address_type: addressType,
      agreed_terms: agreedTerms,
      estimated_price: estimatedPrice || null,
      status: "pending",
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("submit error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
