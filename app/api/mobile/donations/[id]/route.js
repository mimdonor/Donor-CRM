import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(req, { params }) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
  const { data, error } = await supabase.from("donations").select("*").eq("id", params.id).single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  return NextResponse.json({ success: true, data }, { headers: corsHeaders() });
}

export async function PUT(req, { params }) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
  const body = await req.json();
  const { data, error } = await supabase.from("donations").update(body).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data, message: "Donation updated" }, { headers: corsHeaders() });
}

export async function DELETE(req, { params }) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
  const { error } = await supabase.from("donations").delete().eq("id", params.id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: null, message: "Donation deleted" }, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
