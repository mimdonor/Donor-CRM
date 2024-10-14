"use client"
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PaginatedTable from "@/components/customComponents/PaginatedTable";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { MoreHorizontal, Eye, Edit, Trash2, X } from "lucide-react";
import { useRouter } from 'next/navigation';
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
        donorName: '',
        donorType: '',
        donorSource: '',
        donorZone: '',
        representative: '',
        category: '',
    });
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
    const [dateError, setDateError] = useState('');

    const router = useRouter();

    const handleView = useCallback((donor) => {
        router.push(`/donors/viewDonor/${donor.id}`);
    }, [router]);

    const handleEdit = useCallback((donor) => {
        router.push(`/donors/editDonor/${donor.id}`);
    }, [router]);

    const handleDeleteClick = useCallback((donor) => {
        // Implement delete functionality here
        console.log('Delete clicked for donor:', donor);
    }, []);

    const columns = [
        {header: 'Donor ID', accessorKey: 'id'},
        {header: 'Donor Number', accessorKey: 'donor_number'},
        {header: 'Donor Name', accessorFn: (row) => `${row.first_name} ${row.last_name}`},
        {header: 'Phone', accessorKey: 'phone'},
        {header: 'Donor Type', accessorKey: 'donor_type'},
        {header: 'Category', accessorKey: 'category'},
        {header: 'Last Donation Date', accessorKey: 'last_donation_date'},
        {header: 'Donor Source', accessorKey: 'donor_source'},
        {header: 'Donor Zone', accessorKey: 'donor_zone'},
        {header: 'Representative', accessorKey: 'representative'},
    ];

    const fetchData = useCallback(async ({ pageIndex, pageSize }) => {
        setIsLoading(true);
        const startRange = pageIndex * pageSize;
        const endRange = startRange + pageSize - 1;

        try {
            let query = supabase
                .from('donors')
                .select('*', { count: 'exact' })
                .range(startRange, endRange)
                .order('last_donation_date', { ascending: false });

            // Apply filters
            if (filters.startDate) {
                query = query.gte('last_donation_date', filters.startDate.toISOString());
            }
            if (filters.endDate) {
                query = query.lte('last_donation_date', filters.endDate.toISOString());
            }
            if (filters.donorName) {
                query = query.or(
                    `first_name.ilike.%${filters.donorName}%,last_name.ilike.%${filters.donorName}%`
                );
            }
            if (filters.donorType) {
                query = query.eq('donor_type', filters.donorType);
            }
            if (filters.donorSource) {
                query = query.eq('donor_source', filters.donorSource);
            }
            if (filters.donorZone) {
                query = query.eq('donor_zone', filters.donorZone);
            }
            if (filters.representative) {
                query = query.eq('representative', filters.representative);
            }
            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            setDonors(data);
            setTotalCount(count);
        } catch (error) {
            console.error('Error fetching donors:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData({ pageIndex: 0, pageSize: 10 });
    }, [fetchData]);

    const handleExport = async () => {
        // ... (similar to donations export function)
    };

    const resetFilters = () => {
        setFilters({
            startDate: null,
            endDate: null,
            donorName: '',
            donorType: '',
            donorSource: '',
            donorZone: '',
            representative: '',
            category: '',
        });
    };

    const handleDateChange = (type, date) => {
        setDateError('');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date > today) {
            setDateError(`${type} date cannot be in the future`);
            return;
        }

        if (type === 'start') {
            if (filters.endDate && date > filters.endDate) {
                setDateError('Start date cannot be after end date');
                return;
            }
            setFilters(prev => ({ ...prev, startDate: date }));
        } else if (type === 'end') {
            if (filters.startDate && date < filters.startDate) {
                setDateError('End date cannot be before start date');
                return;
            }
            setFilters(prev => ({ ...prev, endDate: date }));
        }
    };

    return (
        <div className="space-y-4 m-4 text-gray-900 dark:text-gray-100">
            <h2 className="text-3xl font-bold">Donors Report</h2>
            <Card className="mt-4">
                <CardContent className="space-y-4 pt-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <span>From:</span>
                                <DatePicker
                                    placeholder="Start Date"
                                    value={filters.startDate}
                                    onChange={(date) => handleDateChange('start', date)}
                                    maxDate={filters.endDate || new Date()}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span>To:</span>
                                <DatePicker
                                    placeholder="End Date"
                                    value={filters.endDate}
                                    onChange={(date) => handleDateChange('end', date)}
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
                                onChange={(e) => setFilters(prev => ({ ...prev, donorName: e.target.value }))}
                                className="w-[200px]"
                            />
                            <Select 
                                value={filters.donorType} 
                                onValueChange={(value) => setFilters(prev => ({ ...prev, donorType: value === 'All' ? '' : value }))}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Donor Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    {dropdownOptions.donorTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* ... (other Select components for donorSource, donorZone, representative, category) ... */}
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
                        searchColumn="name"
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default Page;
