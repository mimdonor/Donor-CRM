/**
 * Razorpay Service
 * Wraps Razorpay REST API calls (no SDK dependency — uses fetch).
 * Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.
 */

const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

const RZP_KEY_ID     = process.env.RAZORPAY_KEY_ID     ?? "rzp_test_PLACEHOLDER";
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET  ?? "PLACEHOLDER_SECRET";

/** Base64 auth header for Razorpay Basic Auth */
const authHeader = () =>
  "Basic " + Buffer.from(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`).toString("base64");

/**
 * Create a Razorpay QR Code (Dynamic — UPI).
 * @param {object} opts
 * @param {number}  opts.amount      Amount in paise (e.g., 50000 = ₹500)
 * @param {string}  opts.description Short description shown to payer
 * @param {string}  opts.donorName   Name of the donor (for reference)
 * @param {string}  opts.donorId     Donor number / ID for traceability
 * @param {number}  opts.closeBy     Unix timestamp when QR should expire (default: 15 min)
 * @returns {Promise<object>} Razorpay QR Code object
 */
export async function createRazorpayQR({ amount, description, donorName, donorId, closeBy }) {
  const expiresAt = closeBy ?? Math.floor(Date.now() / 1000) + 15 * 60; // 15 min default

  const body = {
    type: "upi_qr",
    name: `Donation - ${donorName}`,
    usage: "single_use",
    fixed_amount: true,
    payment_amount: amount, // in paise
    description: description ?? "Donation Payment",
    close_by: expiresAt,
    notes: {
      donor_id:   donorId,
      donor_name: donorName,
    },
  };

  const res = await fetch(`${RAZORPAY_BASE_URL}/payments/qr_codes`, {
    method: "POST",
    headers: {
      Authorization:  authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description ?? "Failed to create Razorpay QR");
  }
  return data; // { id, image_url, payments_count_received, status, ... }
}

/**
 * Fetch a Razorpay QR Code by its ID (for polling payment status).
 * @param {string} qrId  The qr_code ID (e.g., "qr_XXXXXXXXXXXXX")
 * @returns {Promise<object>} QR Code details including payments_count_received
 */
export async function getRazorpayQR(qrId) {
  const res = await fetch(`${RAZORPAY_BASE_URL}/payments/qr_codes/${qrId}`, {
    headers: { Authorization: authHeader() },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description ?? "Failed to fetch Razorpay QR");
  }
  return data;
}

/**
 * Fetch payments for a specific QR Code.
 * @param {string} qrId
 * @returns {Promise<object[]>} List of payment objects
 */
export async function getQRPayments(qrId) {
  const res = await fetch(
    `${RAZORPAY_BASE_URL}/payments/qr_codes/${qrId}/payments`,
    { headers: { Authorization: authHeader() } }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description ?? "Failed to fetch QR payments");
  }
  return data?.items ?? [];
}

/**
 * Fetch a single payment by payment ID.
 * @param {string} paymentId  e.g. "pay_XXXXXXXXXXXXX"
 * @returns {Promise<object>} Payment object
 */
export async function getPaymentById(paymentId) {
  const res = await fetch(`${RAZORPAY_BASE_URL}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description ?? "Failed to fetch payment");
  }
  return data;
}

/**
 * Validate Razorpay webhook signature.
 * @param {string} body      Raw request body string
 * @param {string} signature X-Razorpay-Signature header value
 * @returns {boolean}
 */
export function validateWebhookSignature(body, signature) {
  const crypto = require("crypto");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "PLACEHOLDER_WEBHOOK_SECRET";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export const RAZORPAY_KEY_ID_PUBLIC = RZP_KEY_ID;
