import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(req) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, role")
    .eq("email", auth.user.email)
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 404 });

  // Fetch role permissions
  const { data: roleData } = await supabase
    .from("roles")
    .select("permissions")
    .eq("role_name", user.role)
    .single();

  return NextResponse.json({
    success: true,
    data: {
      ...user,
      permissions: roleData?.permissions ?? {},
    },
  }, { headers: corsHeaders() });
}

export async function PUT(req) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  const body = await req.json();
  const { name } = body;

  const { data, error } = await supabase
    .from("users")
    .update({ name })
    .eq("email", auth.user.email)
    .select("id, name, email, role")
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data, message: "Profile updated" }, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
