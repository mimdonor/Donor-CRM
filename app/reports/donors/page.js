"use client"
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PaginatedTable from "@/components/customComponents/PaginatedTable";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { MoreHorizontal, Eye, Edit, Trash2, X } from "lucide-react";
import { useRouter } from 'next/navigation';
import { usePermissions } from "@/context/PermissionsProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MultiSelect } from "@/components/ui/multi-select";

const Page = () => {
    const [donors, setDonors] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { permissions, user } = usePermissions();
    const reportsPermissions = permissions?.reportsModule || {};  
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        donorName: '',
        donorTypes: [],
        donorSources: [],
        donorZones: [],
        representatives: [],
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
        {header: 'Donor Name', 
        accessorKey: 'donor_name',
        cell: ({ row }) => {
            const donor = row.original;
            return donor.donor_type === 'Institution' ? donor.institution_name : donor.donor_name;
          }
    },
        {header: 'Phone', accessorKey: 'phone'},
        {header: 'Donor Type', accessorKey: 'donor_type'},
        {header: 'Category', accessorKey: 'category'},
        {header: 'Last Donation Date', accessorKey: 'last_donation_date'},
        {header: 'Donor Source', accessorKey: 'donor_source'},
        {header: 'Donor Zone', accessorKey: 'donor_zone'},
        {header: 'Representative', accessorKey: 'representative'},
    ];

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('donors')
                .select('*')  // Remove count and range
                .order('last_donation_date', { ascending: false });

            // Apply filters
            if (filters.startDate) {
                query = query.gte('last_donation_date', filters.startDate.toISOString());
            }
            if (filters.endDate) {
                query = query.lte('last_donation_date', filters.endDate.toISOString());
            }
            if (filters.donorName) {
                query = query.ilike('donor_name', `%${filters.donorName}%`);
            }
            if (filters.donorTypes.length > 0) {
                query = query.in('donor_type', filters.donorTypes);
            }
            if (filters.donorSources.length > 0) {
                query = query.in('donor_source', filters.donorSources);
            }
            if (filters.donorZones.length > 0) {
                query = query.in('donor_zone', filters.donorZones);
            }
            if (filters.representatives.length > 0) {
                query = query.in('representative', filters.representatives);
            }
            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            const { data, error } = await query;

            if (error) throw error;

            setDonors(data);
            setTotalCount(data.length);
        } catch (error) {
            console.error('Error fetching donors:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExport = async () => {
        // ... (similar to donations export function)
    };

    const resetFilters = () => {
        setFilters({
            startDate: null,
            endDate: null,
            donorName: '',
            donorTypes: [],
            donorSources: [],
            donorZones: [],
            representatives: [],
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

    if (reportsPermissions.allowAccess && !reportsPermissions.onlyView) {
        return (
          <div className="flex justify-center items-center h-full">
            <h2 className="text-2xl font-bold text-black">You don't have view access to this module</h2>
          </div>
        );
      }

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
                            <div className="w-[200px]">
                                <MultiSelect
                                    options={dropdownOptions.donorTypes.map(type => ({
                                        value: type.name,
                                        label: type.name
                                    }))}
                                    selected={filters.donorTypes}
                                    onChange={(selected) => setFilters(prev => ({ ...prev, donorTypes: selected }))}
                                    placeholder="Donor Types"
                                />
                            </div>
                            <div className="w-[200px]">
                                <MultiSelect
                                    options={dropdownOptions.donorSources.map(source => ({
                                        value: source.name,
                                        label: source.name
                                    }))}
                                    selected={filters.donorSources}
                                    onChange={(selected) => setFilters(prev => ({ ...prev, donorSources: selected }))}
                                    placeholder="Donor Sources"
                                />
                            </div>
                            <div className="space-y-2 w-[200px]">
                                <MultiSelect
                                    options={dropdownOptions.donorZones.map(zone => ({
                                        value: zone.name,
                                        label: zone.name
                                    }))}
                                    selected={filters.donorZones}
                                    onChange={(selected) => setFilters(prev => ({ ...prev, donorZones: selected }))}
                                    placeholder="Select Zones"
                                />
                            </div>
                            <div className="space-y-2 w-[200px]">
                                <MultiSelect
                                    options={dropdownOptions.representatives.map(rep => ({
                                        value: rep.name,
                                        label: rep.name
                                    }))}
                                    selected={filters.representatives}
                                    onChange={(selected) => setFilters(prev => ({ ...prev, representatives: selected }))}
                                    placeholder="Select Representatives"
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
                        data={donors}
                        isLoading={isLoading}
                        searchText="Search donors..."
                        searchColumn="donor_name"
                        isPagination={true}  // This will show all rows but still allow sorting and filtering
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default Page;
