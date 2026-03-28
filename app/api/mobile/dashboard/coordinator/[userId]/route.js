import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
    try {
        const userId = params.userId;

        // Fetch donations (Mocked scoped to jurisdiction)
        const { data: donations, error: donationsError } = await supabase
            .from("donations")
            .select("amount, date, user_id");

        if (donationsError) throw donationsError;

        // Fetch staff in jurisdiction
        const { data: staff, error: staffError } = await supabase
            .from("users")
            .select("id, name");

        // Staff mock data
        const teamSize = 12;
        const jurisdictionTotal = donations.reduce((sum, d) => sum + (d.amount ?? 0), 0);
        
        // Mock team ranking
        const teamRanking = { rank: 2, total: 5, up: true };
        
        // Top Performers
        const collectionsByStaffMap = donations.reduce((acc, d) => {
            const id = d.user_id || 'Unknown';
            acc[id] = (acc[id] || 0) + (d.amount || 0);
            return acc;
        }, {});

        const collectionsByStaff = Object.entries(collectionsByStaffMap)
            .map(([staffId, amount]) => {
                const staffMember = staff?.find(s => String(s.id) === String(staffId));
                return {
                    staffId,
                    staffName: staffMember ? staffMember.name : 'Unknown Staff',
                    amount,
                    percentage: jurisdictionTotal ? Math.round((amount / jurisdictionTotal) * 100) : 0
                };
            })
            .sort((a, b) => b.amount - a.amount);
            
        const topPerformers = collectionsByStaff.slice(0, 3);
        
        // Monthly trend (Jurisdiction)
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

        // Collections by District
        const collectionsByDistrict = [
            { district: "Ernakulam", amount: 800000, percentage: 32 },
            { district: "Kottayam", amount: 600000, percentage: 24 },
            { district: "Idukki", amount: 500000, percentage: 20 },
            { district: "Other", amount: 600000, percentage: 24 },
        ]; // Mocked since no district data is in donations

        return NextResponse.json({
            success: true,
            data: {
                jurisdictionName: "Kerala Zone",
                jurisdictionTotal,
                teamSize,
                teamRanking,
                topPerformers,
                collectionsByStaff,
                monthlyTrend,
                collectionsByDistrict
            }
        });
    } catch (error) {
        console.error("[Coordinator Dashboard API] Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch dashboard data", error: error.message },
            { status: 500 }
        );
    }
}
