"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import AreaChart from "./AreaChart";
import BarChart from "./BarChart";

const Dashboard = () => {
  const [totalDonations, setTotalDonations] = useState(0);
  const [lastMonthDonations, setLastMonthDonations] = useState(0);
  const [newDonors, setNewDonors] = useState(0);
  const [totalDonors, setTotalDonors] = useState(0);
  const [inactiveRegularDonors, setInactiveRegularDonors] = useState(0);
  const [inactiveRegularDonorList, setInactiveRegularDonorList] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Fetch donations
    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select("amount, date, purpose, donor_id");

    // Fetch donors
    const { data: donors, error: donorsError } = await supabase.from("donors").select("*");

    if (!donationsError && !donorsError) {
      // Total donations
      const total = donations.reduce((sum, donation) => sum + donation.amount, 0);
      setTotalDonations(total);

      // Last month donations
      const lastMonthTotal = donations
        .filter((donation) => new Date(donation.date) >= oneMonthAgo)
        .reduce((sum, donation) => sum + donation.amount, 0);
      setLastMonthDonations(lastMonthTotal);

      // Donor stats
      const newDonorsCount = donors.filter(
        (donor) => new Date(donor.created_at) >= oneMonthAgo
      ).length;
      setNewDonors(newDonorsCount);
      setTotalDonors(donors.length);

      // Inactive regular donors (didn't donate this month)
      const regularDonors = donors.filter((d) => d.category === "Regular");
      const regularDonorIds = regularDonors.map((d) => d.id);

      const donatedThisMonth = new Set(
        donations
          .filter((d) => {
            const donationDate = new Date(d.date);
            return (
              donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear
            );
          })
          .map((d) => d.donor_id)
      );

      const inactiveRegulars = regularDonors.filter((donor) => !donatedThisMonth.has(donor.id));

      setInactiveRegularDonors(inactiveRegulars.length);
      setInactiveRegularDonorList(inactiveRegulars);
    }

    // Chart data
    const { data: monthlyDonations, error: monthlyDonationsError } = await supabase
      .from("donations")
      .select("amount, date, purpose");

    const { data: monthlyDonors, error: monthlyDonorsError } = await supabase
      .from("donors")
      .select("created_at");

    if (!monthlyDonationsError && !monthlyDonorsError) {
      const monthlyAggregated = monthlyDonations.reduce((acc, donation) => {
        const month = new Date(donation.date).toLocaleString("default", { month: "short" });
        acc[month] = acc[month] || { month, donations: 0, newDonors: 0, purposes: {} };
        acc[month].donations += donation.amount;
        acc[month].purposes[donation.purpose] =
          (acc[month].purposes[donation.purpose] || 0) + donation.amount;
        return acc;
      }, {});

      monthlyDonors.forEach((donor) => {
        const month = new Date(donor.created_at).toLocaleString("default", { month: "short" });
        if (monthlyAggregated[month]) {
          monthlyAggregated[month].newDonors += 1;
        } else {
          monthlyAggregated[month] = { month, donations: 0, newDonors: 1, purposes: {} };
        }
      });

      const sortedData = Object.values(monthlyAggregated).sort(
        (a, b) => new Date(a.month + " 1, 2024") - new Date(b.month + " 1, 2024")
      );

      setMonthlyData(sortedData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="bg-blue-100 dark:bg-blue-900">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-100">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
              ₹{totalDonations.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-100 dark:bg-green-900">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-100">Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-300">
              ₹{lastMonthDonations.toFixed(2)}
            </p>
            <p className="text-xs text-green-700 dark:text-green-200">in the last month</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-100 dark:bg-purple-900">
          <CardHeader>
            <CardTitle className="text-purple-800 dark:text-purple-100">Total Donors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">{totalDonors}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-100 dark:bg-orange-900">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-100">New Donors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-300">+{newDonors}</p>
            <p className="text-xs text-orange-700 dark:text-orange-200">in the last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="w-full overflow-x-auto">
          <AreaChart
            data={monthlyData}
            title="Monthly Donations and New Donors"
            description="Showing total donations and new donors for each month"
            dataKeys={[
              { key: "donations", label: "Donations", color: "#6C665F" },
              { key: "newDonors", label: "New Donors", color: "#A67B5B" },
            ]}
            xAxisKey="month"
          />
        </div>
        <div className="w-full overflow-x-auto">
          <BarChart
            data={monthlyData}
            title="Donations by Purpose"
            description="Monthly distribution of donations across different purposes"
          />
        </div>
      </div>

      {inactiveRegularDonorList.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2 text-red-700 dark:text-red-300">
            Regular Donors Who Didn't Donate This Month
          </h2>
          <div className="overflow-x-auto rounded-md shadow-sm border dark:border-gray-700">
            <table className="min-w-full text-sm text-left bg-white dark:bg-gray-900">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-4 py-2 border-b dark:border-gray-700">#</th>
                  <th className="px-4 py-2 border-b dark:border-gray-700">Donor ID</th>
                  <th className="px-4 py-2 border-b dark:border-gray-700">Donor Name</th>
                </tr>
              </thead>
              <tbody>
                {inactiveRegularDonorList.map((donor, index) => (
                  <tr key={donor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 border-b dark:border-gray-700">{index + 1}</td>
                    <td className="px-4 py-2 border-b dark:border-gray-700">{donor.id}</td>
                    <td className="px-4 py-2 border-b dark:border-gray-700">{donor.donor_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
