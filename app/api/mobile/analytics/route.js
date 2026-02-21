import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyMobileToken } from "@/lib/mobileAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(req) {
  const auth = await verifyMobileToken(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const prevYear = year - 1;

  const { data: donations } = await supabase.from("donations").select("amount, date, purpose, donor_id");
  const { data: donors } = await supabase.from("donors").select("id, created_at");

  const thisYearDonations = donations?.filter(d => new Date(d.date).getFullYear() === year) ?? [];
  const prevYearDonations = donations?.filter(d => new Date(d.date).getFullYear() === prevYear) ?? [];

  const totalRevenue = thisYearDonations.reduce((s, d) => s + (d.amount ?? 0), 0);
  const prevRevenue = prevYearDonations.reduce((s, d) => s + (d.amount ?? 0), 0);
  const revenueGrowth = prevRevenue > 0 ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : null;

  const thisYearDonors = donors?.filter(d => new Date(d.created_at).getFullYear() === year).length ?? 0;
  const totalDonors = donors?.length ?? 0;

  // Monthly breakdown
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyTotals = months.map((month, i) => {
    const current = thisYearDonations.filter(d => new Date(d.date).getMonth() === i);
    const previous = prevYearDonations.filter(d => new Date(d.date).getMonth() === i);
    const currentTotal = current.reduce((s, d) => s + (d.amount ?? 0), 0);
    const prevTotal = previous.reduce((s, d) => s + (d.amount ?? 0), 0);
    const change = prevTotal > 0 ? (((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1) : null;
    return { month, amount: currentTotal, count: current.length, prevAmount: prevTotal, change };
  });

  // Donations by purpose
  const purposeMap = {};
  thisYearDonations.forEach(d => {
    const purposes = Array.isArray(d.purpose) ? d.purpose : [d.purpose];
    purposes.forEach(p => {
      if (p) purposeMap[p] = (purposeMap[p] ?? 0) + (d.amount ?? 0);
    });
  });
  const byPurpose = Object.entries(purposeMap).map(([name, amount]) => ({
    name,
    amount,
    percentage: totalRevenue > 0 ? ((Number(amount) / totalRevenue) * 100).toFixed(1) : 0,
  })).sort((a, b) => Number(b.amount) - Number(a.amount));

  return NextResponse.json({
    success: true,
    data: {
      year,
      totalRevenue,
      prevRevenue,
      revenueGrowth,
      totalDonors,
      newDonorsThisYear: thisYearDonors,
      monthlyTotals,
      byPurpose,
    },
  }, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Version, X-Platform",
  };
}
