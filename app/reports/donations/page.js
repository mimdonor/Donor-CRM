"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PaginatedTable from "@/components/customComponents/PaginatedTable";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { MoreHorizontal, Eye, Edit, Trash2, Printer, X } from "lucide-react";
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
  const [donations, setDonations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [bankOptions, setBankOptions] = useState([]);
  const [purposeOptions, setPurposeOptions] = useState([]); // Add state for purpose options
  const [organizationOptions, setOrganizationOptions] = useState([]); // Add state for organization options

  // Add this function to fetch bank names
  const fetchBankNames = async () => {
    try {
      const { data, error } = await supabase
        .from("bank_details")
        .select("bank_name")
        .order("bank_name");

      if (error) throw error;

      // Transform data for MultiSelect
      const options = data.map((bank) => ({
        value: bank.bank_name,
        label: bank.bank_name,
      }));
      setBankOptions(options);
    } catch (error) {
      console.error("Error fetching bank names:", error);
    }
  };

  // Add this function to fetch purpose options
  const fetchPurposeOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("purposes_dropdown")
        .select("*")
        .eq("status", true);

      if (error) throw error;

      // Transform data for MultiSelect
      const options = data.map((purpose) => ({
        value: purpose.name,
        label: purpose.name,
      }));
      setPurposeOptions(options);
    } catch (error) {
      console.error("Error fetching purpose options:", error);
    }
  };

  const fetchOrganizationOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("organization_settings")
        .select("id, name");

      if (error) throw error;

      // Transform data for MultiSelect
      const options = data.map((org) => ({
        value: org.name,
        label: org.name,
      }));
      setOrganizationOptions(options);
    } catch (error) {
      console.error("Error fetching organization options:", error);
    }
  };

  // Add useEffect to fetch bank, purpose, and organization options
  useEffect(() => {
    fetchBankNames();
    fetchPurposeOptions(); // Fetch purposes dynamically
    fetchOrganizationOptions(); // Fetch organizations dynamically
  }, []);

  // Modify the filters state
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    donorName: "",
    paymentTypes: [],
    bankNames: [],
    purposes: [], // Dynamically populated purposes array
    organizations: [],
  });

  const paymentTypeOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Online", label: "Online" },
    { value: "Cheque", label: "Cheque" },
    { value: "GPay", label: "GPay" },
  ];

  const { permissions, user } = usePermissions();
  const reportsPermissions = permissions?.reportsModule || {};

  const router = useRouter();

  const handleView = useCallback(
    (donation) => {
      router.push(`/donations/viewDonation/${donation.id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (donation) => {
      router.push(`/donations/editDonation/${donation.id}`);
    },
    [router]
  );

  const handlePrint = useCallback(
    (donation) => {
      router.push(`/donations/print/${donation.id}`);
    },
    [router]
  );

  const handleDeleteClick = useCallback((donation) => {
    // Implement delete functionality here
    console.log("Delete clicked for donation:", donation);
  }, []);

  const columns = [
    { header: "Donor ID", accessorKey: "donor_id" },
    {
      header: "Donor Name",
      accessorKey: "donor_name",
    },
    { header: "Date", accessorKey: "date" },
    { header: "Payment Type", accessorKey: "payment_type" },
    { header: "Amount", accessorKey: "amount" },
    { header: "Bank Name", accessorKey: "bank_name" },
    {header: "Organization", accessorKey: "organization"},
    {header: "Purpose", accessorKey: "purpose"},
    { header: "Receipt No", accessorKey: "receipt_no" },
    { header: "Transaction Number", accessorKey: "transaction_number" },
    { header: "Cheque Number", accessorKey: "cheque_number" },
    {header: "Remarks", accessorKey: "remarks"},
  ];

  // helper to normalize selected values into string array
  const normalizeSelected = (selected) =>
    Array.isArray(selected)
      ? selected.map((s) => (typeof s === "string" ? s : s?.value)).filter(Boolean)
      : [];

  const fetchData = async ({ pageIndex, pageSize }) => {
    setIsLoading(true);
    const startRange = pageIndex * pageSize;
    const endRange = startRange + pageSize - 1;

    try {
      let query = supabase
        .from("donations")
        .select("*", { count: "exact" })
        .range(startRange, endRange)
        .order("created_at", { ascending: false }); // order by created_at

      // Apply filters
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }
      if (filters.donorName) {
        query = query.ilike("donor_name", `%${filters.donorName}%`);
      }

      // Normalize filter values to arrays of strings before passing to supabase
      const paymentTypeValues = normalizeSelected(filters.paymentTypes);
      const bankNameValues = normalizeSelected(filters.bankNames);
      const purposeValues = normalizeSelected(filters.purposes);
      const organizationValues = normalizeSelected(filters.organizations);

      if (paymentTypeValues.length > 0) {
        query = query.in("payment_type", paymentTypeValues);
      }
      if (bankNameValues.length > 0) {
        query = query.in("bank_name", bankNameValues);
      }
      if (purposeValues.length > 0) {
        // purpose column is an array in DB so use overlaps
        query = query.overlaps("purpose", purposeValues);
      }
      if (organizationValues.length > 0) {
        query = query.in("organization", organizationValues);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setDonations(data);
      setTotalCount(count);
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ pageIndex: 0, pageSize: 10 });
  }, [filters]);

  const handleExport = async () => {
    try {
      let query = supabase.from("donations").select("*").order("created_at", { ascending: false });

      // Apply filters
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }
      if (filters.donorName) {
        query = query.ilike("donor_name", `%${filters.donorName}%`);
      }

      const paymentTypeValues = normalizeSelected(filters.paymentTypes);
      const bankNameValues = normalizeSelected(filters.bankNames);
      const purposeValues = normalizeSelected(filters.purposes);
      const organizationValues = normalizeSelected(filters.organizations);

      if (paymentTypeValues.length > 0) {
        query = query.in("payment_type", paymentTypeValues);
      }
      if (bankNameValues.length > 0) {
        query = query.in("bank_name", bankNameValues);
      }
      if (purposeValues.length > 0) {
        // For export use overlaps as purpose is an array
        query = query.overlaps("purpose", purposeValues);
      }
      if (organizationValues.length > 0) {
        query = query.in("organization", organizationValues);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log("No data to export");
        return;
      }

      // Determine visible headers from the rendered table
      const ths = Array.from(document.querySelectorAll("table thead tr th"));
      const visibleThs = ths.filter((th) => th.offsetParent !== null && th.textContent.trim() !== "");

      // Map header label -> accessorKey from the columns definition
      const headerToKey = {};
      columns.forEach((c) => {
        if (c.header && c.accessorKey) headerToKey[c.header] = c.accessorKey;
      });

      // Use only headers that exist in our columns mapping and are visible
      let selectedHeaders = visibleThs
        .map((th) => th.textContent.trim())
        .filter((h) => headerToKey[h]);

      // Fallback to exporting all defined columns if none detected
      if (selectedHeaders.length === 0) {
        selectedHeaders = Object.keys(headerToKey);
      }

      // Build CSV rows, escaping quotes and enclosing fields in double quotes
      const csvRows = [];
      csvRows.push(selectedHeaders.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));

      data.forEach((row) => {
        const vals = selectedHeaders.map((h) => {
          const key = headerToKey[h];
          let val = key ? row[key] : "";
          if (val === null || val === undefined) val = "";
          if (typeof val === "object") val = JSON.stringify(val);
          val = String(val);
          return `"${val.replace(/"/g, '""')}"`;
        });
        csvRows.push(vals.join(","));
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "filtered_donations_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      donorName: "",
      paymentTypes: [],
      bankNames: [],
      purposes: [], // Reset purposes
      organizations: [], // Reset organizations
    });
  };

  const [dateError, setDateError] = useState("");

  const handleDateChange = (type, date) => {
    setDateError("");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
      setDateError(`${type} date cannot be in the future`);
      return;
    }

    if (type === "start" && filters.endDate && date > filters.endDate) {
      setDateError("Start date cannot be after end date");
      return;
    }

    if (type === "end" && filters.startDate && date < filters.startDate) {
      setDateError("End date cannot be before start date");
      return;
    }

    setFilters((prev) => ({ ...prev, [type === "start" ? "startDate" : "endDate"]: date }));
  };

  if (reportsPermissions.allowAccess && !reportsPermissions.onlyView) {
    return (
      <div className="flex justify-center items-center h-full">
        <h2 className="text-2xl font-bold text-black">You don't have view access to this module</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4 m-4 text-gray-900 dark:text-gray-100">
      <h2 className="text-3xl font-bold">Donations Report</h2>
      <Card className="mt-4">
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span>From:</span>
                <DatePicker
                  placeholder="Start Date"
                  value={filters.startDate}
                  onChange={(date) => handleDateChange("start", date)}
                  maxDate={filters.endDate || new Date()}
                />
              </div>
              <div className="flex items-center gap-2">
                <span>To:</span>
                <DatePicker
                  placeholder="End Date"
                  value={filters.endDate}
                  onChange={(date) => handleDateChange("end", date)}
                  minDate={filters.startDate}
                  maxDate={new Date()}
                />
              </div>
            </div>
            {dateError && <p className="text-red-500">{dateError}</p>}
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="Donor Name"
                value={filters.donorName}
                onChange={(e) => setFilters((prev) => ({ ...prev, donorName: e.target.value }))}
                className="w-[200px]"
              />
              <div className="w-[200px]">
                <MultiSelect
                  options={bankOptions}
                  selected={normalizeSelected(filters.bankNames)}
                  onChange={(selected) =>
                    setFilters((prev) => ({ ...prev, bankNames: normalizeSelected(selected) }))
                  }
                  placeholder="Select Banks"
                />
              </div>
              <div className="w-[200px]">
                <MultiSelect
                  options={purposeOptions} // Add MultiSelect for purposes
                  selected={normalizeSelected(filters.purposes)}
                  onChange={(selected) =>
                    setFilters((prev) => ({ ...prev, purposes: normalizeSelected(selected) }))
                  }
                  placeholder="Select Purposes"
                />
              </div>
              <div className="w-[200px]">
                <MultiSelect
                  options={organizationOptions} // Add MultiSelect for organizations
                  selected={normalizeSelected(filters.organizations)}
                  onChange={(selected) => setFilters((prev) => ({ ...prev, organizations: normalizeSelected(selected) }))}
                  placeholder="Select Organizations"
                />
              </div>
              <div className="w-[200px]">
                <MultiSelect
                  options={paymentTypeOptions}
                  selected={normalizeSelected(filters.paymentTypes)}
                  onChange={(selected) =>
                    setFilters((prev) => ({ ...prev, paymentTypes: normalizeSelected(selected) }))
                  }
                  placeholder="Payment Types"
                />
              </div>
              <Button variant="outline" onClick={resetFilters}>
                <X className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </div>

          <PaginatedTable
            columns={columns}
            data={donations}
            fetchData={fetchData}
            totalCount={totalCount}
            isLoading={isLoading}
            searchText="Search donations..."
            searchColumn="donor_name"
            isExportButton={true}
            isColumnButton={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;