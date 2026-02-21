import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // ── Fetch raw data (same as web Dashboard.jsx) ──────────────────────────
        const { data: donations, error: donationsError } = await supabase
            .from("donations")
            .select("amount, date, purpose, donor_id");

        const { data: donors, error: donorsError } = await supabase
            .from("donors")
            .select("id, donor_name, category, created_at");

        if (donationsError || donorsError) {
            throw donationsError || donorsError;
        }

        // ── Stat Calculations (mirroring web Dashboard.jsx exactly) ─────────────

        // 1. Total donations (all time)
        const totalDonations = donations.reduce((sum, d) => sum + (d.amount ?? 0), 0);

        // 2. Donations in the last month
        const lastMonthDonations = donations
            .filter((d) => new Date(d.date) >= oneMonthAgo)
            .reduce((sum, d) => sum + (d.amount ?? 0), 0);

        // 3. Total donors
        const totalDonors = donors.length;

        // 4. New donors in the last month
        const newDonors = donors.filter(
            (d) => new Date(d.created_at) >= oneMonthAgo
        ).length;

        // 5. Inactive regular donors (Regular category, no donation this calendar month)
        const regularDonors = donors.filter((d) => d.category === "Regular");

        const donatedThisMonth = new Set(
            donations
                .filter((d) => {
                    const dt = new Date(d.date);
                    return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
                })
                .map((d) => d.donor_id)
        );

        const inactiveRegularDonors = regularDonors.filter(
            (d) => !donatedThisMonth.has(d.id)
        );

        // ── Monthly Trend Data (for charts) ─────────────────────────────────────
        const monthlyAggregated = donations.reduce((acc, donation) => {
            const month = new Date(donation.date).toLocaleString("default", { month: "short" });
            if (!acc[month]) {
                acc[month] = { month, donations: 0, newDonors: 0, purposes: {} };
            }
            acc[month].donations += donation.amount ?? 0;
            acc[month].purposes[donation.purpose] =
                (acc[month].purposes[donation.purpose] || 0) + (donation.amount ?? 0);
            return acc;
        }, {});

        donors.forEach((donor) => {
            const month = new Date(donor.created_at).toLocaleString("default", { month: "short" });
            if (monthlyAggregated[month]) {
                monthlyAggregated[month].newDonors += 1;
            } else {
                monthlyAggregated[month] = { month, donations: 0, newDonors: 1, purposes: {} };
            }
        });

        const monthlyData = Object.values(monthlyAggregated).sort(
            (a, b) => new Date(a.month + " 1, 2024") - new Date(b.month + " 1, 2024")
        );

        // ── Aggregate Top Purposes (from all monthly purpose breakdowns) ──────────
        const purposeTotals = {};
        Object.values(monthlyAggregated).forEach((m) => {
            Object.entries(m.purposes ?? {}).forEach(([purpose, amount]) => {
                // Normalize purpose keys: trim, collapse compound keys to first purpose
                const key = purpose.trim().split(',')[0].trim();
                purposeTotals[key] = (purposeTotals[key] ?? 0) + amount;
            });
        });
        const topPurposes = Object.entries(purposeTotals)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 6);

        // ── Peak Month ───────────────────────────────────────────────────────────
        const peakMonth = Object.values(monthlyAggregated).reduce(
            (best, m) => (m.donations > (best?.donations ?? 0) ? m : best),
            null
        );

        // ── Average Monthly Donation (active months only) ────────────────────────
        const activeMonths = Object.values(monthlyAggregated).filter((m) => m.donations > 0);
        const avgMonthlyDonation = activeMonths.length
            ? Math.round(activeMonths.reduce((s, m) => s + m.donations, 0) / activeMonths.length)
            : 0;

        // ── Response ─────────────────────────────────────────────────────────────
        return NextResponse.json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: {
                totalDonations,
                lastMonthDonations,
                totalDonors,
                newDonors,
                inactiveRegularDonors: inactiveRegularDonors.length,
                inactiveRegularDonorList: inactiveRegularDonors.map((d) => ({
                    id: d.id,
                    donor_name: d.donor_name,
                })),
                monthlyData,
                topPurposes,
                peakMonth: peakMonth ? { month: peakMonth.month, amount: peakMonth.donations } : null,
                avgMonthlyDonation,
            },
        });
    } catch (error) {
        console.error("[Mobile Dashboard API] Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch dashboard data", error: error.message },
            { status: 500 }
        );
    }
}
