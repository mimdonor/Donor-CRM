import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";
import { createRazorpayQR } from "@/lib/razorpay";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

/**
 * POST /api/mobile/razorpay/qr
 * Creates a Razorpay Dynamic UPI QR Code for a donation.
 *
 * Body:
 *   { donor_id, donor_name, amount, description?, close_by? }
 *
 * Returns:
 *   { qr_id, image_url, amount, expires_at }
 */
export async function POST(req) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok)
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: 401 }
    );

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const { donor_id, donor_name, amount, description, close_by } = body;

  if (!donor_id || !donor_name || !amount) {
    return NextResponse.json(
      { success: false, message: "donor_id, donor_name and amount are required" },
      { status: 422, headers: corsHeaders() }
    );
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return NextResponse.json(
      { success: false, message: "amount must be a positive number" },
      { status: 422, headers: corsHeaders() }
    );
  }

  try {
    const qr = await createRazorpayQR({
      amount:      Math.round(amountNum * 100), // convert ₹ to paise
      description: description ?? `Donation from ${donor_name}`,
      donorName:   donor_name,
      donorId:     donor_id,
      closeBy:     close_by,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          qr_id:      qr.id,
          image_url:  qr.image_url,
          amount:     amountNum,
          status:     qr.status,
          expires_at: qr.close_by,
        },
      },
      { headers: corsHeaders() }
    );
  } catch (err) {
    console.error("[razorpay/qr] Error creating QR:", err);
    return NextResponse.json(
      { success: false, message: err.message ?? "Failed to create QR code" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
