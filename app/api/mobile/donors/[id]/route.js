import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(req, { params }) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  const { id } = params;
  const { data: donor, error } = await supabase.from("donors").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 404 });

  // Fetch donation history for this donor
  const { data: donations } = await supabase
    .from("donations")
    .select("*")
    .eq("donor_id", donor.donor_number)
    .order("date", { ascending: false });

  return NextResponse.json({ success: true, data: { ...donor, donations: donations ?? [] } }, { headers: corsHeaders() });
}

export async function PUT(req, { params }) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  const { id } = params;
  const body = await req.json();
  const { data, error } = await supabase.from("donors").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data, message: "Donor updated successfully" }, { headers: corsHeaders() });
}

export async function DELETE(req, { params }) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  const { id } = params;
  const { error } = await supabase.from("donors").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: null, message: "Donor deleted" }, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
