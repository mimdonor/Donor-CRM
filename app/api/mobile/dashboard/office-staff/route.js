import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

        // Fetch all donations
        const { data: donations, error: donationsError } = await supabase
            .from("donations")
            .select("amount, date, user_id, donor_name, purpose");

        if (donationsError) throw donationsError;

        // Today's total
        const todayTotal = donations
            .filter((d) => new Date(d.date) >= startOfToday)
            .reduce((sum, d) => sum + (d.amount ?? 0), 0);

        // Yesterday's total
        const yesterdayTotal = donations
            .filter((d) => new Date(d.date) >= startOfYesterday && new Date(d.date) < startOfToday)
            .reduce((sum, d) => sum + (d.amount ?? 0), 0);

        const organizationGrowth = yesterdayTotal ? (todayTotal - yesterdayTotal) / yesterdayTotal : 0;

        // Pending queues (Mocked counts)
        const pendingReceipts = 10;
        const pendingInvoices = 3;

        // Collections by Staff
        const staffTotals = donations.reduce((acc, d) => {
            const userId = d.user_id || 'Unknown';
            acc[userId] = (acc[userId] || 0) + (d.amount || 0);
            return acc;
        }, {});

        const collectionsByStaff = Object.entries(staffTotals)
            .map(([staffId, amount], idx) => ({
                staffId,
                staffName: `Staff ${idx + 1}`, // Should fetch from users table
                amount,
                percentage: Math.round((amount / todayTotal) * 100) || 0
            }))
            .sort((a, b) => b.amount - a.amount).slice(0, 5);

        // Recent Donations
        const recentDonations = donations
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10).map(d => ({
                date: d.date,
                staffName: `Staff`,
                amount: d.amount,
                purpose: d.purpose
            }));

        return NextResponse.json({
            success: true,
            data: {
                organizationTotal: todayTotal, // Wait, PRD says organizationTotal is today? Yes "Sum of donations today"
                organizationGrowth,
                pendingReceipts,
                pendingInvoices,
                collectionsByStaff,
                recentDonations
            }
        });
    } catch (error) {
        console.error("[Office Staff Dashboard API] Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch dashboard data", error: error.message },
            { status: 500 }
        );
    }
}
