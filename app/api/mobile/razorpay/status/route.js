import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";
import { getRazorpayQR, getQRPayments } from "@/lib/razorpay";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

/**
 * GET /api/mobile/razorpay/status?qr_id=qr_XXXX
 * Poll this endpoint to check if a QR payment has been received.
 *
 * Returns:
 *   { paid: bool, payment_id?, amount?, method? }
 */
export async function GET(req) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok)
    return NextResponse.json(
      { success: false, message: auth.error },
      { status: 401 }
    );

  const { searchParams } = new URL(req.url);
  const qrId = searchParams.get("qr_id");

  if (!qrId) {
    return NextResponse.json(
      { success: false, message: "qr_id query param is required" },
      { status: 422, headers: corsHeaders() }
    );
  }

  try {
    // Fetch QR details
    const qr = await getRazorpayQR(qrId);

    if (qr.payments_count_received > 0) {
      // Fetch actual payment details
      const payments = await getQRPayments(qrId);
      const latestPayment = payments[0] ?? {};

      return NextResponse.json(
        {
          success: true,
          data: {
            paid:       true,
            payment_id: latestPayment.id   ?? null,
            amount:     latestPayment.amount ? latestPayment.amount / 100 : null, // paise → ₹
            method:     latestPayment.method ?? null,
            vpa:        latestPayment.vpa   ?? null,
            status:     latestPayment.status ?? "captured",
          },
        },
        { headers: corsHeaders() }
      );
    }

    // QR closed / expired and still no payment
    if (qr.status === "closed") {
      return NextResponse.json(
        { success: true, data: { paid: false, expired: true } },
        { headers: corsHeaders() }
      );
    }

    // Still waiting
    return NextResponse.json(
      { success: true, data: { paid: false, expired: false } },
      { headers: corsHeaders() }
    );
  } catch (err) {
    console.error("[razorpay/status] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message ?? "Failed to check payment status" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * POST /api/mobile/razorpay/status
 * Confirm payment and save the donation record to the DB.
 *
 * Body:
 *   { qr_id, payment_id, donor_id, donor_name, date, amount,
 *     payment_type, purpose, transaction_number?, cheque_number? }
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

  const {
    qr_id,
    payment_id,
    donor_id,
    donor_name,
    date,
    amount,
    payment_type,
    purpose,
    transaction_number,
    cheque_number,
  } = body;

  // --- Auto-increment receipt number ---
  const { data: lastDonation } = await supabase
    .from("donations")
    .select("receipt_no")
    .order("receipt_no", { ascending: false })
    .limit(1)
    .single();

  const receipt_no = (lastDonation?.receipt_no ?? 0) + 1;

  const { data, error } = await supabase
    .from("donations")
    .insert({
      donor_id,
      donor_name,
      date,
      amount,
      payment_type,
      purpose,
      receipt_no,
      transaction_number: transaction_number ?? payment_id ?? null,
      cheque_number:      cheque_number ?? null,
      // Payment gateway columns
      payment_gateway_provider: "razorpay",
      payment_id:               payment_id   ?? null,
      payment_qr_id:            qr_id        ?? null,
      payment_order_id:         null,        // QR flow doesn't use order_id
      payment_status:           payment_id ? "paid" : "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[razorpay/status POST] DB error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    { success: true, data, message: "Donation recorded successfully" },
    { headers: corsHeaders() }
  );
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
