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
  const category = searchParams.get("category") ?? "";
  const from = (page - 1) * pageSize;

  let query = supabase.from("donors").select("*", { count: "exact" });

  if (search) {
    query = query.or(`donor_name.ilike.%${search}%,donor_number.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data, total: count, page, pageSize }, { headers: corsHeaders() });
}

export async function POST(req) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase.from("donors").insert(body).select().single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data, message: "Donor created successfully" }, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
