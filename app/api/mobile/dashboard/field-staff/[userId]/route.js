import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
    try {
        const userId = params.userId;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Fetch user donations
        const { data: donations, error: donationsError } = await supabase
            .from("donations")
            .select("amount, date, purpose, donor_id")
            .eq("user_id", userId);

        if (donationsError) throw donationsError;

        // Personal total
        const personalTotal = donations.reduce((sum, d) => sum + (d.amount ?? 0), 0);

        // Target progress (Mocked for now)
        const targetAmount = 300000;
        const targetProgress = Math.min(personalTotal / targetAmount, 1);
        const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();

        // Month over month growth
        const thisMonthTotal = donations
            .filter((d) => new Date(d.date) >= startOfMonth)
            .reduce((sum, d) => sum + (d.amount ?? 0), 0);

        const lastMonthTotal = donations
            .filter((d) => new Date(d.date) >= startOfLastMonth && new Date(d.date) < startOfMonth)
            .reduce((sum, d) => sum + (d.amount ?? 0), 0);
            
        const monthOverMonthGrowth = lastMonthTotal ? (thisMonthTotal - lastMonthTotal) / lastMonthTotal : 0;

        // Peer ranking (Mocked)
        const peerRanking = { rank: 3, total: 12, role: "Field Staff", trend: "up", leaderboardPoints: personalTotal, maxPoints: 1000000 };

        // Fetch top donors for this user
        const donorIds = [...new Set(donations.map((d) => d.donor_id))];
        const { data: donors, error: donorsError } = await supabase
            .from("donors")
            .select("id, donor_number, donor_name, institution_name")
            .in("donor_number", donorIds.map(String));

        if (donorsError) throw donorsError;

        const donorTotals = donations.reduce((acc, d) => {
            acc[d.donor_id] = (acc[d.donor_id] || 0) + (d.amount || 0);
            return acc;
        }, {});

        const topDonorsList = Object.entries(donorTotals)
            .map(([donorId, total]) => {
                const donor = donors.find(d => d.donor_number === donorId || String(d.id) === donorId) || { donor_name: 'Unknown', institution_name: '' };
                const lastDonationDate = donations.filter(d => d.donor_id === donorId || String(d.donor_id) === donorId).sort((a,b) => new Date(b.date) - new Date(a.date))[0]?.date;
                const daysSince = lastDonationDate ? Math.floor((now - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24)) : 0;
                return {
                    id: donorId,
                    name: donor.donor_name || donor.institution_name,
                    lastAmount: donations.filter(d => d.donor_id === donorId || String(d.donor_id) === donorId).sort((a,b) => new Date(b.date) - new Date(a.date))[0]?.amount || 0,
                    lastDate: lastDonationDate,
                    daysSince,
                    total
                };
            })
            .sort((a, b) => b.total - a.total).slice(0, 5);

        // Donations by Purpose
        const purposeTotals = donations.reduce((acc, d) => {
            const purpose = d.purpose?.trim().split(',')[0].trim() || 'Other';
            acc[purpose] = (acc[purpose] || 0) + (d.amount || 0);
            return acc;
        }, {});

        const donationsByPurpose = Object.entries(purposeTotals)
            .map(([purpose, amount], idx) => ({
                purpose, amount, percentage: Math.round((amount / personalTotal) * 100), color: ['#42A5F5', '#26C6DA', '#FFCA28', '#F06292', '#66BB6A', '#AB47BC'][idx % 6]
            }))
            .sort((a, b) => b.amount - a.amount);

        // Monthly Trend
        const monthlyAggregated = donations.reduce((acc, d) => {
            const date = new Date(d.date);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[monthStr] = (acc[monthStr] || 0) + (d.amount || 0);
            return acc;
        }, {});

        const monthlyTrend = Object.entries(monthlyAggregated)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12);

        return NextResponse.json({
            success: true,
            data: {
                personalTotal,
                targetAmount,
                targetProgress,
                daysRemaining,
                monthOverMonthGrowth,
                peerRanking,
                topDonors: topDonorsList,
                donationsByPurpose,
                monthlyTrend
            }
        });
    } catch (error) {
        console.error("[Field Staff Dashboard API] Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch dashboard data", error: error.message },
            { status: 500 }
        );
    }
}
