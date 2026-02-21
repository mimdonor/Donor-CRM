import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(req) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  const [purposes, sources, zones, representatives, salutations, organizations, banks] = await Promise.all([
    supabase.from("purposes_dropdown").select("*"),
    supabase.from("donorsource_dropdown").select("*"),
    supabase.from("donorzone_dropdown").select("*"),
    supabase.from("representatives_dropdown").select("*"),
    supabase.from("salutation_dropdown").select("*"),
    supabase.from("organization_settings").select("*"),
    supabase.from("bank_details").select("*"),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      purposes: purposes.data ?? [],
      sources: sources.data ?? [],
      zones: zones.data ?? [],
      representatives: representatives.data ?? [],
      salutations: salutations.data ?? [],
      organizations: organizations.data ?? [],
      banks: banks.data ?? [],
    },
  }, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
