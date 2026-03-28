import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
    try {
        const userId = params.userId;
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 3, 1); // April 1st (Financial year start)

        // Mocked representative data
        // Represents donor portfolio
        const totalDonors = 45;
        const commitmentTotal = 1500000;
        const collectedAgainstCommitment = 850000;
        const fulfillmentPercentage = collectedAgainstCommitment / commitmentTotal;
        const overdueDonors = 5;

        // Use real donations to populate specific donors
        const { data: donations, error: donationsError } = await supabase
            .from("donations")
            .select("amount, date, donor_id, donor_name");

        if (donationsError) throw donationsError;

        const myDonorsMap = donations.reduce((acc, d) => {
            if (!acc[d.donor_id]) {
                acc[d.donor_id] = { id: d.donor_id, name: d.donor_name, lastAmount: 0, total: 0, lastDate: d.date, daysSince: 0 };
            }
            acc[d.donor_id].total += d.amount || 0;
            if (new Date(d.date) > new Date(acc[d.donor_id].lastDate)) {
                acc[d.donor_id].lastDate = d.date;
                acc[d.donor_id].lastAmount = d.amount;
            } else if (!acc[d.donor_id].lastAmount) {
                acc[d.donor_id].lastAmount = d.amount;
            }
            return acc;
        }, {});

        const myDonors = Object.values(myDonorsMap).map((d) => {
            const daysSince = Math.floor((now - new Date(d.lastDate)) / (1000 * 60 * 60 * 24));
            return {
                id: d.id,
                name: d.name,
                avatar: "",
                lastAmount: d.lastAmount,
                lastDate: d.lastDate,
                daysSince,
                commitment: d.total * 2, // Mocked commitment
                fulfillmentPercentage: 0.5
            };
        }).slice(0, 10); // limited

        // Fulfillment by Month
        const performanceVsTarget = [
            { month: "Apr", percentage: 0.1 },
            { month: "May", percentage: 0.2 },
            { month: "Jun", percentage: 0.35 },
            { month: "Jul", percentage: 0.45 },
            { month: "Aug", percentage: 0.567 },
        ]; // Mocked

        return NextResponse.json({
            success: true,
            data: {
                totalDonors,
                commitmentTotal,
                collectedAgainstCommitment,
                fulfillmentPercentage,
                overdueDonors,
                myDonors,
                performanceVsTarget
            }
        });
    } catch (error) {
        console.error("[Representative Dashboard API] Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch dashboard data", error: error.message },
            { status: 500 }
        );
    }
}
