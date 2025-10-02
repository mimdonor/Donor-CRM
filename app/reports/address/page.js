"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PaginatedTable from "@/components/customComponents/PaginatedTable";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { X, MoreHorizontal, Eye, Edit, Trash2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/context/PermissionsProvider";
import { MultiSelect } from "@/components/ui/multi-select";

const Page = () => {
  const [donors, setDonors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    donorName: "",
    city: "",
    state: "",
    donorTypes: [], // Changed to array
    donorSources: [], // Changed to array
    donorZones: [], // Changed to array
    representatives: [], // Changed to array
  });

  const [dateError, setDateError] = useState("");

  const { permissions, user } = usePermissions();
  const reportsPermissions = permissions?.reportsModule || {};
  const donorPermissions = permissions?.donorModule || {};

  const router = useRouter();

  const handleView = useCallback(
    (donor) => {
      router.push(`/donors/viewDonor/${donor.id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (donor) => {
      router.push(`/donors/editDonor/${donor.id}`);
    },
    [router]
  );

  const handlePrint = useCallback(
    (donor) => {
      router.push(`/donors/print/${donor.id}`);
    },
    [router]
  );

  const handleDeleteClick = useCallback((donor) => {
    // Implement delete functionality here
    console.log("Delete clicked for donor:", donor);
  }, []);

  const columns = [
    { header: "Donor ID", accessorKey: "donor_number" },
    {
      header: "Donor Name",
      accessorKey: "donor_name",
      cell: ({ row }) => {
        const donor = row.original;
        return donor.donor_type === "Institution" ? donor.institution_name : donor.donor_name;
      },
    },
    {
      header: "Street Name",
      accessorKey: "street_name",
    },
    {
      header: "Area Name",
      accessorKey: "area_name",
    },
    {
      header: "Landmark",
      accessorKey: "landmark",
    },
    {
      header: "City",
      accessorKey: "city",
    },
    {
      header: "State",
      accessorKey: "state",
    },
    {
      header: "Country",
      accessorKey: "country",
    },
    { header: "Donor Source", accessorKey: "donor_source" },
    { header: "Representative", accessorKey: "representative" },
    { header: "Donor Zone", accessorKey: "donor_zone" },
    { header: "Donor Type", accessorKey: "donor_type" },
    { header: "Category", accessorKey: "category" },
    {
      header: "Donor Zone State",
      accessorKey: "donor_zone_state",
    },
    {
      header: "Donor Zone District",
      accessorKey: "donor_zone_district",
    },
    {
      header: "Contact Person",
      accessorKey: "contact_person",
    },
    {
      header: "Purposes",
      accessorKey: "purposes",
    },
    {
      header: "Commitment",
      accessorKey: "commitment",
    },
    { header: "Phone", accessorKey: "phone" },
    { header: "Last Donation Date", accessorKey: "last_donation_date" },
    {
      header: "Pan Number",
      accessorKey: "pan_number",
    },

  ];

  // normalize selected values (accepts array of objects or strings)
  const normalizeSelected = (selected) =>
    Array.isArray(selected)
      ? selected.map((s) => (typeof s === "string" ? s : s?.value)).filter(Boolean)
      : [];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("donors").select("*");

      // apply created_at date filters from the date pickers
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }

      // Modified filters for arrays
      // donor name search (match donor_name or institution_name)
      if (filters.donorName) {
        query = query.or(
          `donor_name.ilike.%${filters.donorName}%,institution_name.ilike.%${filters.donorName}%`
        );
      }

      // city / state filters (trim inputs to avoid accidental whitespace mismatches)
      const cityVal = filters.city?.toString().trim();
      const stateVal = filters.state?.toString().trim();
      if (cityVal) {
        query = query.ilike("city", `%${cityVal}%`);
      }
      if (stateVal) {
        query = query.ilike("state", `%${stateVal}%`);
      }

      const donorTypesVals = normalizeSelected(filters.donorTypes);
      const donorSourcesVals = normalizeSelected(filters.donorSources);
      const donorZonesVals = normalizeSelected(filters.donorZones);
      const representativesVals = normalizeSelected(filters.representatives);

      if (donorTypesVals.length > 0) {
        query = query.in("donor_type", donorTypesVals);
      }
      if (donorSourcesVals.length > 0) {
        query = query.in("donor_source", donorSourcesVals);
      }
      if (donorZonesVals.length > 0) {
        query = query.in("donor_zone", donorZonesVals);
      }
      if (representativesVals.length > 0) {
        query = query.in("representative", representativesVals);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log("Fetched data:", data); // Add this debug log

      const transformedData = data.map((donor) => ({
        ...donor,
        display_name:
          donor.donor_type === "Institution" ? donor.institution_name : donor.donor_name,
      }));

      setDonors(transformedData);
      setTotalCount(transformedData.length);
    } catch (error) {
      console.error("Error fetching donors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      donorName: "",
      city: "",
      state: "",
      donorTypes: [], // Changed to array
      donorSources: [], // Changed to array
      donorZones: [], // Changed to array
      representatives: [], // Changed to array
    });
  };

  const handleExport = async () => {
    try {
      let query = supabase.from("donors").select("*").order("donor_number", { ascending: true });

      // Apply filters
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }
      if (filters.donorName) {
        query = query.or(
          `donor_name.ilike.%${filters.donorName}%,institution_name.ilike.%${filters.donorName}%`
        );
      }
      if (filters.city) {
        query = query.ilike("city", `%${filters.city}%`);
      }
      if (filters.state) {
        query = query.ilike("state", `%${filters.state}%`);
      }

      const donorTypesVals = normalizeSelected(filters.donorTypes);
      const donorSourcesVals = normalizeSelected(filters.donorSources);
      const donorZonesVals = normalizeSelected(filters.donorZones);
      const representativesVals = normalizeSelected(filters.representatives);

      if (donorTypesVals.length > 0) {
        query = query.in("donor_type", donorTypesVals);
      }
      if (donorSourcesVals.length > 0) {
        query = query.in("donor_source", donorSourcesVals);
      }
      if (donorZonesVals.length > 0) {
        query = query.in("donor_zone", donorZonesVals);
      }
      if (representativesVals.length > 0) {
        query = query.in("representative", representativesVals);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data.length === 0) {
        console.log("No data to export");
        return;
      }

      // Convert data to CSV
      const csvContent =
        "data:text/csv;charset=utf-8," +
        Object.keys(data[0]).join(",") +
        "\n" +
        data.map((row) => Object.values(row).join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "filtered_donors_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const handlePrintAddresses = () => {
    // Create URLSearchParams object with non-empty filters
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (value instanceof Date) {
          searchParams.append(key, value.toISOString());
        } else {
          searchParams.append(key, value);
        }
      }
    });

    router.push(`/reports/address/print?${searchParams.toString()}`);
  };

  const [dropdownOptions, setDropdownOptions] = useState({
    donorTypes: [
      { id: 1, name: "Individual" },
      { id: 2, name: "Institution" },
    ],
    donorSources: [],
    donorZones: [],
    representatives: [],
    categories: [],
  });

  const fetchDropdownOptions = async () => {
    try {
      const [{ data: donorSources }, { data: donorZones }, { data: representatives }] =
        await Promise.all([
          supabase.from("donorsource_dropdown").select("*"),
          supabase.from("donorzone_dropdown").select("*"),
          supabase.from("representatives_dropdown").select("*"),
        ]);

      setDropdownOptions({
        donorTypes: [
          { id: 1, name: "Individual" },
          { id: 2, name: "Institution" },
        ],
        donorSources: donorSources || [],
        donorZones: donorZones || [],
        representatives: representatives || [],
      });
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
    }
  };

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  if (reportsPermissions.allowAccess && !reportsPermissions.onlyView) {
    return (
      <div className="flex justify-center items-center h-full">
        <h2 className="text-2xl text-black font-bold">You don't have view access to this module</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4 m-4 text-gray-900 dark:text-gray-100">
      <h2 className="text-3xl font-bold">Address Report</h2>
      <Card className="mt-4">
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2 w-[200px]">
                <Label>Name </Label>
                <Input
                  placeholder="Search donor name"
                  value={filters.donorName}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      donorName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 w-[200px]">
                <Label>City</Label>
                <Input
                  placeholder="Search city"
                  value={filters.city}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 w-[200px]">
                <Label>State</Label>
                <Input
                  placeholder="Search state"
                  value={filters.state}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 w-[200px]">
                <Label>Donor Types</Label>
                <MultiSelect
                  options={dropdownOptions.donorTypes.map((type) => ({
                    value: type.name,
                    label: type.name,
                  }))}
                  selected={normalizeSelected(filters.donorTypes)}
                  onChange={(selected) =>
                    setFilters((prev) => ({ ...prev, donorTypes: normalizeSelected(selected) }))
                  }
                  placeholder="Donor Types"
                />
              </div>
              <div className="space-y-2 w-[200px]">
                <Label>Donor Sources</Label>
                <MultiSelect
                  options={dropdownOptions.donorSources.map((source) => ({
                    value: source.name,
                    label: source.name,
                  }))}
                  selected={normalizeSelected(filters.donorSources)}
                  onChange={(selected) =>
                    setFilters((prev) => ({ ...prev, donorSources: normalizeSelected(selected) }))
                  }
                  placeholder="Select Donor Sources"
                />
              </div>
              <div className="space-y-2 w-[200px]">
                <Label>Donor Zones</Label>
                <MultiSelect
                  options={dropdownOptions.donorZones.map((zone) => ({
                    value: zone.name,
                    label: zone.name,
                  }))}
                  selected={normalizeSelected(filters.donorZones)}
                  onChange={(selected) =>
                    setFilters((prev) => ({ ...prev, donorZones: normalizeSelected(selected) }))
                  }
                  placeholder="Select Donor Zones"
                />
              </div>
              <div className="space-y-2 w-[200px]">
                <Label>Representatives</Label>
                <MultiSelect
                  options={dropdownOptions.representatives.map((rep) => ({
                    value: rep.name,
                    label: rep.name,
                  }))}
                  selected={normalizeSelected(filters.representatives)}
                  onChange={(selected) =>
                    setFilters((prev) => ({ ...prev, representatives: normalizeSelected(selected) }))
                  }
                  placeholder="Select Representatives"
                />
              </div>
              <div className="w-[180px]">
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  <X className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>

          <PaginatedTable
            columns={columns}
            data={donors}
            isColumnButton={true}
            isExportButton={donorPermissions.canAdd || donorPermissions.canEdit}
            searchText="Search donors..."
            searchColumn="donor_name"
            isPagination={true} // This will show all rows but still allow sorting and filtering
          />
          {reportsPermissions.canPrint && (
            <div className="flex gap-4">
              <Button
                className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]"
                onClick={handlePrintAddresses}
              >
                Print Addresses
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
