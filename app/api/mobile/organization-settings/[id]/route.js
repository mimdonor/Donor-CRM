import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}


export async function GET(req, { params }) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
  const { data, error } = await supabase.from("organization_settings").select("*").eq("id", params.id).single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  return NextResponse.json({ success: true, data }, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}