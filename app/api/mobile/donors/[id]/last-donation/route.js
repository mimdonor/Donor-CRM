import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

/**
 * GET /api/mobile/donors/[id]/last-donation
 * Returns the last donated amount for a given donor (by DB row id).
 * Uses donor_number (not DB id) to query donations table, consistent
 * with the existing pattern in donors/[id]/route.js.
 */
export async function GET(req, { params }) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok)
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: 401 }
    );

  const { id } = params;

  // First resolve donor_number from the donor's DB id
  const { data: donor, error: donorError } = await supabase
    .from("donors")
    .select("donor_number, donor_name, institution_name, category")
    .eq("id", id)
    .single();

  if (donorError || !donor)
    return NextResponse.json(
      { success: false, message: "Donor not found" },
      { status: 404, headers: corsHeaders() }
    );

  // Fetch the most recent donation for this donor
  const { data: lastDonation, error: donationError } = await supabase
    .from("donations")
    .select("amount, date, payment_type, purpose, receipt_no")
    .eq("donor_id", donor.donor_number)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (donationError)
    return NextResponse.json(
      { success: false, message: donationError.message },
      { status: 500, headers: corsHeaders() }
    );

  return NextResponse.json(
    {
      success: true,
      data: {
        donor_number:    donor.donor_number,
        donor_name:      donor.donor_name || donor.institution_name,
        category:        donor.category,
        is_regular:      donor.category === "Regular",
        last_donation:   lastDonation ?? null,
        // Convenience: surface the amount directly (null if no prior donation)
        last_amount:     lastDonation?.amount ?? null,
      },
    },
    { headers: corsHeaders() }
  );
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
