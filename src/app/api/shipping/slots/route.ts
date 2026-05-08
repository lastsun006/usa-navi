import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TIME_SLOTS = ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");
  const date = searchParams.get("date");

  if (!area || !date) {
    return NextResponse.json({ error: "area and date are required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("shipping_bookings")
      .select("pickup_time")
      .eq("area", area)
      .eq("pickup_date", date)
      .in("status", ["confirmed", "pending"]);

    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const slot of TIME_SLOTS) {
      counts[slot] = 0;
    }

    for (const row of data ?? []) {
      if (row.pickup_time in counts) {
        counts[row.pickup_time]++;
      }
    }

    return NextResponse.json(counts);
  } catch (err) {
    console.error("slots error:", err);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}
