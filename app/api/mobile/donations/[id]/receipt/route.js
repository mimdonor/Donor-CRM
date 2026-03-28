import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(req, { params }) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  try {
    const { id } = params;

    // 1. Fetch donation
    const { data: donationData, error: donationError } = await supabase
      .from('donations')
      .select('*')
      .eq('id', id)
      .single();

    if (donationError) throw donationError;
    if (!donationData) return NextResponse.json({ success: false, message: 'Donation not found' }, { status: 404 });

    // 2. Fetch donor
    const { data: donorData, error: donorError } = await supabase
      .from('donors')
      .select('*')
      .eq('donor_number', donationData.donor_id)
      .single();

    if (donorError) throw donorError;

    // 3. Fetch organization settings
    let orgData = null;
    if (donationData.organization) {
      const { data, error: orgError } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('name', donationData.organization)
        .single();
      
      if (!orgError && data) {
        orgData = data;
      }
    }

    // 4. Fetch receipt message
    const { data: receiptMsgData, error: receiptError } = await supabase
      .from('receipt_message')
      .select('message')
      .single();

    const receiptMessage = receiptMsgData ? receiptMsgData.message : '';

    return NextResponse.json({
      success: true,
      data: {
        donation: donationData,
        donor: donorData,
        organization: orgData,
        receiptMessage,
      }
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[Donation Receipt API] Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500, headers: corsHeaders() });
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
