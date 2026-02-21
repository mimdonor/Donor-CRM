import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(req) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20");
  const search = searchParams.get("search") ?? "";
  const paymentType = searchParams.get("paymentType") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const from = (page - 1) * pageSize;

  let query = supabase.from("donations").select("*", { count: "exact" });

  if (search) query = query.or(`donor_name.ilike.%${search}%,donor_id.ilike.%${search}%`);
  if (paymentType) query = query.eq("payment_type", paymentType);
  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo) query = query.lte("date", dateTo);

  const { data, error, count } = await query
    .order("date", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data, total: count, page, pageSize }, { headers: corsHeaders() });
}

export async function POST(req) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  const body = await req.json();

  // Auto-increment receipt number
  const { data: lastDonation } = await supabase
    .from("donations")
    .select("receipt_no")
    .order("receipt_no", { ascending: false })
    .limit(1)
    .single();

  const receipt_no = (lastDonation?.receipt_no ?? 0) + 1;

  const { data, error } = await supabase
    .from("donations")
    .insert({ ...body, receipt_no })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data, message: "Donation recorded successfully" }, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
