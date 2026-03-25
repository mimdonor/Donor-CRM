-- ============================================================
--  Migration: Add payment gateway columns to donations table
--  Run this in your Supabase SQL Editor (or via CLI migration)
-- ============================================================

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS payment_gateway_provider TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_id               TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_order_id         TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_qr_id            TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status           TEXT    DEFAULT NULL;

-- Optional: index for fast QR-id lookups (used by webhook handler)
CREATE INDEX IF NOT EXISTS donations_payment_qr_id_idx
  ON donations (payment_qr_id)
  WHERE payment_qr_id IS NOT NULL;

-- Optional: index for fast payment-id lookups
CREATE INDEX IF NOT EXISTS donations_payment_id_idx
  ON donations (payment_id)
  WHERE payment_id IS NOT NULL;

-- ============================================================
--  Column reference
--  payment_gateway_provider : 'razorpay' | NULL
--  payment_id               : Razorpay pay_XXXX  (set after QR scan)
--  payment_order_id         : Razorpay order_XXXX (set for order-based flow)
--  payment_qr_id            : Razorpay qr_XXXX   (set when QR created)
--  payment_status           : 'pending' | 'paid' | 'failed' | NULL
-- ============================================================
