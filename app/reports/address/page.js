"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PaginatedTable from "@/components/customComponents/PaginatedTable";
import { DatePicker } from "@/components/ui/date-picker";
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
        donorType: "",
        donorSource: "",
        donorZone: "",
        representative: "",
    });

    const router = useRouter();

    const handleView = useCallback((donor) => {
        router.push(`/donors/viewDonor/${donor.id}`);
    }, [router]);

    const handleEdit = useCallback((donor) => {
        router.push(`/donors/editDonor/${donor.id}`);
    }, [router]);

    const handlePrint = useCallback((donor) => {
        router.push(`/donors/print/${donor.id}`);
    }, [router]);

    const handleDeleteClick = useCallback((donor) => {
        // Implement delete functionality here
        console.log('Delete clicked for donor:', donor);
    }, []);

    const columns = [
        { header: "Donor Number", accessorKey: "donor_number" },
        {
            header: "Name",
            accessorKey: "donor_name",
            cell: ({ row }) => `${row.original.donor_name}`,
        },
        { header: "City", accessorKey: "city" },
        { header: "State", accessorKey: "state" },
        { header: "Donor Type", accessorKey: "donor_type" },
        { header: "Donor Source", accessorKey: "donor_source" },
        { header: "Donor Zone", accessorKey: "donor_zone" },
        { header: "Representative", accessorKey: "representative" },
    ];

    const fetchData = async ({ pageIndex, pageSize }) => {
        setIsLoading(true);
        const startRange = pageIndex * pageSize;
        const endRange = startRange + pageSize - 1;

        try {
            let query = supabase
                .from("donors")
                .select("*", { count: "exact" })
                .range(startRange, endRange)
                .order("donor_number", { ascending: true });

            // Apply filters
            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate.toISOString());
            }
            if (filters.endDate) {
                query = query.lte('created_at', filters.endDate.toISOString());
            }
            if (filters.donorName) {
                query = query.or(
                    `first_name.ilike.%${filters.donorName}%,last_name.ilike.%${filters.donorName}%`
                );
            }
            if (filters.city) {
                query = query.ilike("city", `%${filters.city}%`);
            }
            if (filters.state) {
                query = query.ilike("state", `%${filters.state}%`);
            }
            if (filters.donorType) {
                query = query.eq("donor_type", filters.donorType);
            }
            if (filters.donorSource) {
                query = query.eq("donor_source", filters.donorSource);
            }
            if (filters.donorZone) {
                query = query.eq("donor_zone", filters.donorZone);
            }
            if (filters.representative) {
                query = query.eq("representative", filters.representative);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            setDonors(data);
            setTotalCount(count);
        } catch (error) {
            console.error("Error fetching donors:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData({ pageIndex: 0, pageSize: 10 });
    }, [filters]);

    const resetFilters = () => {
        setFilters({
            startDate: null,
            endDate: null,
            donorName: "",
            city: "",
            state: "",
            donorType: "",
            donorSource: "",
            donorZone: "",
            representative: "",
        });
    };

    const handleExport = async () => {
        try {
            let query = supabase
                .from('donors')
                .select('*')
                .order('donor_number', { ascending: true });

            // Apply filters
            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate.toISOString());
            }
            if (filters.endDate) {
                query = query.lte('created_at', filters.endDate.toISOString());
            }
            if (filters.donorName) {
                query = query.or(
                    `first_name.ilike.%${filters.donorName}%,last_name.ilike.%${filters.donorName}%`
                );
            }
            if (filters.city) {
                query = query.ilike("city", `%${filters.city}%`);
            }
            if (filters.state) {
                query = query.ilike("state", `%${filters.state}%`);
            }
            if (filters.donorType) {
                query = query.eq("donor_type", filters.donorType);
            }
            if (filters.donorSource) {
                query = query.eq("donor_source", filters.donorSource);
            }
            if (filters.donorZone) {
                query = query.eq("donor_zone", filters.donorZone);
            }
            if (filters.representative) {
                query = query.eq("representative", filters.representative);
            }
        

            const { data, error } = await query;

            if (error) throw error;

            if (data.length === 0) {
                console.log('No data to export');
                return;
            }

            // Convert data to CSV
            const csvContent = "data:text/csv;charset=utf-8," 
                + Object.keys(data[0]).join(",") + "\n"
                + data.map(row => Object.values(row).join(",")).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "filtered_donors_export.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    const handlePrintAddresses = () => {
        router.push("/reports/address/print");
    };

    const [dropdownOptions, setDropdownOptions] = useState({
        donorTypes: [
            { id: 1, name: 'Individual' },
            { id: 2, name: 'Institution' }
        ],
        donorSources: [],
        donorZones: [],
        representatives: [],
        categories: [],
    });

    const fetchDropdownOptions = async () => {
        try {
            const [
                { data: donorSources },
                { data: donorZones },
                { data: representatives },
            ] = await Promise.all([
                supabase.from('donorsource_dropdown').select('*'),
                supabase.from('donorzone_dropdown').select('*'),
                supabase.from('representatives_dropdown').select('*'),
              
            ]);

            setDropdownOptions({
                donorTypes: [
                    { id: 1, name: 'Individual' },
                    { id: 2, name: 'Institution' }
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

    return (
        <div className="space-y-4 m-4 text-gray-900 dark:text-gray-100">
            <h2 className="text-3xl font-bold">Address Report</h2>
            <Card className="mt-4">
                <CardContent className="space-y-4 pt-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <span>From:</span>
                                <DatePicker
                                    placeholder="Start Date"
                                    value={filters.startDate}
                                    onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span>To:</span>
                                <DatePicker
                                    placeholder="End Date"
                                    value={filters.endDate}
                                    onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Input
                                placeholder="Donor Name"
                                value={filters.donorName}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        donorName: e.target.value,
                                    }))
                                }
                                className="w-[200px]"
                            />
                            <Input
                                placeholder="City"
                                value={filters.city}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        city: e.target.value,
                                    }))
                                }
                                className="w-[200px]"
                            />
                            <Input
                                placeholder="State"
                                value={filters.state}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        state: e.target.value,
                                    }))
                                }
                                className="w-[200px]"
                            />
                            <Select
                                value={filters.donorType}
                                onValueChange={(value) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        donorType: value === "all" ? "" : value,
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Donor Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {dropdownOptions.donorTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.name}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.donorSource}
                                onValueChange={(value) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        donorSource: value === "all" ? "" : value,
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Donor Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {dropdownOptions.donorSources.map((source) => (
                                        <SelectItem key={source.id} value={source.name}>
                                            {source.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.donorZone}
                                onValueChange={(value) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        donorZone: value === "all" ? "" : value,
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Donor Zone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {dropdownOptions.donorZones.map((zone) => (
                                        <SelectItem key={zone.id} value={zone.name}>
                                            {zone.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.representative}
                                onValueChange={(value) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        representative: value === "all" ? "" : value,
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Representative" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {dropdownOptions.representatives.map((rep) => (
                                        <SelectItem key={rep.id} value={rep.name}>
                                            {rep.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={resetFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Reset Filters
                            </Button>
                        </div>
                    </div>

                    <PaginatedTable
                        columns={columns}
                        data={donors}
                        fetchData={fetchData}
                        totalCount={totalCount}
                        isLoading={isLoading}
                        searchText="Search donors..."
                        searchColumn="first_name"
                    />

                    <div className="flex gap-4">
                        <Button className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]" onClick={handlePrintAddresses}>Print Addresses</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Page;
