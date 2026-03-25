import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateWebhookSignature } from "@/lib/razorpay";

/**
 * POST /api/mobile/razorpay/webhook
 * Razorpay will POST events here when payments complete.
 *
 * Configure this URL in your Razorpay Dashboard → Webhooks:
 *   https://your-domain.com/api/mobile/razorpay/webhook
 *
 * Active events to subscribe:
 *   - qr_code.credited
 *   - payment.captured
 *
 * Set RAZORPAY_WEBHOOK_SECRET in your .env to validate signatures.
 */
export async function POST(req) {
  // Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  // Validate webhook signature (skip validation if secret is placeholder)
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (webhookSecret && webhookSecret !== "PLACEHOLDER_WEBHOOK_SECRET") {
    const isValid = validateWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("[razorpay/webhook] Invalid signature");
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 });
    }
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event;
  console.log("[razorpay/webhook] Received event:", eventType);

  // ── Handle qr_code.credited ─────────────────────────────────────────────────
  if (eventType === "qr_code.credited") {
    const qrPayment = event.payload?.qr_code?.entity ?? {};
    const payment   = event.payload?.payment?.entity  ?? {};

    const qrId     = qrPayment.id;
    const paymentId = payment.id;
    const amount    = payment.amount ? payment.amount / 100 : null; // paise → ₹

    if (!qrId || !paymentId) {
      return NextResponse.json({ success: true, message: "Missing data, ignored" });
    }

    // Update the donation record that has this qr_id (if it already exists as pending)
    const { data: existing } = await supabase
      .from("donations")
      .select("id, payment_status")
      .eq("payment_qr_id", qrId)
      .maybeSingle();

    if (existing && existing.payment_status === "pending") {
      await supabase
        .from("donations")
        .update({
          payment_id:     paymentId,
          payment_status: "paid",
          transaction_number: paymentId,
          amount:             amount ?? existing.amount,
        })
        .eq("id", existing.id);

      console.log(`[razorpay/webhook] Updated donation ${existing.id} to paid`);
    } else if (!existing) {
      // Donation not yet created (race condition — mobile will create it via /status POST)
      console.log(`[razorpay/webhook] No pending donation for QR ${qrId} — will be created by app`);
    }
  }

  // ── Handle payment.captured ─────────────────────────────────────────────────
  if (eventType === "payment.captured") {
    const payment = event.payload?.payment?.entity ?? {};
    const paymentId = payment.id;
    const notes     = payment.notes ?? {};

    // If donor_id is in notes, we can try to update/insert
    if (paymentId && notes.donor_id) {
      const { data: existing } = await supabase
        .from("donations")
        .select("id, payment_status")
        .eq("payment_id", paymentId)
        .maybeSingle();

      if (existing && existing.payment_status !== "paid") {
        await supabase
          .from("donations")
          .update({ payment_status: "paid" })
          .eq("id", existing.id);
      }
    }
  }

  return NextResponse.json({ success: true, received: true });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
