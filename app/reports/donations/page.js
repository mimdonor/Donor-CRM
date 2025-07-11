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
import { MoreHorizontal, Eye, Edit, Trash2, Printer, X } from "lucide-react";
import { useRouter } from 'next/navigation';
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

    // Add this function to fetch bank names
    const fetchBankNames = async () => {
        try {
            const { data, error } = await supabase
                .from('bank_details')
                .select('bank_name')
                .order('bank_name');

            if (error) throw error;

            // Transform data for MultiSelect
            const options = data.map(bank => ({
                value: bank.bank_name,
                label: bank.bank_name
            }));
            setBankOptions(options);
        } catch (error) {
            console.error('Error fetching bank names:', error);
        }
    };

    // Add useEffect to fetch bank names
    useEffect(() => {
        fetchBankNames();
    }, []);

    // Modify the filters state
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        donorName: '',
        paymentTypes: [],
        bankNames: [], // Change from bankName to bankNames array
    });

    const paymentTypeOptions = [
        { value: 'Cash', label: 'Cash' },
        { value: 'Online', label: 'Online' },
        { value: 'Cheque', label: 'Cheque' },
        { value: 'GPay', label: 'GPay' },
    ];

    const { permissions, user } = usePermissions();
    const reportsPermissions = permissions?.reportsModule || {};

    const router = useRouter();

    const handleView = useCallback((donation) => {
        router.push(`/donations/viewDonation/${donation.id}`);
    }, [router]);

    const handleEdit = useCallback((donation) => {
        router.push(`/donations/editDonation/${donation.id}`);
    }, [router]);

    const handlePrint = useCallback((donation) => {
        router.push(`/donations/print/${donation.id}`);
    }, [router]);

    const handleDeleteClick = useCallback((donation) => {
        // Implement delete functionality here
        console.log('Delete clicked for donation:', donation);
    }, []);

    const columns = [
        {header: 'Donor ID', accessorKey: 'donor_id'},
        {
            header: 'Donor Name',
            accessorKey: 'donor_name',
            
        },
        {header: 'Date', accessorKey: 'date'},
        {header: 'Payment Type', accessorKey: 'payment_type'},
        {header: 'Amount', accessorKey: 'amount'},
        {header: 'Bank Name', accessorKey: 'bank_name'},
        {header: 'Receipt No', accessorKey: 'receipt_no'},
        {header: 'Transaction Number', accessorKey: 'transaction_number'},
        {header: 'Cheque Number', accessorKey: 'cheque_number'},
    ];

    const fetchData = async ({ pageIndex, pageSize }) => {
        setIsLoading(true);
        const startRange = pageIndex * pageSize;
        const endRange = startRange + pageSize - 1;

        try {
            let query = supabase
                .from('donations')
                .select('*', { count: 'exact' })
                .range(startRange, endRange)
                .order('date', { ascending: false });

            // Apply filters
            if (filters.startDate) {
                query = query.gte('date', filters.startDate.toISOString());
            }
            if (filters.endDate) {
                query = query.lte('date', filters.endDate.toISOString());
            }
            if (filters.donorName) {
                query = query.ilike('donor_name', `%${filters.donorName}%`);
            }
            if (filters.paymentTypes.length > 0) {
                query = query.in('payment_type', filters.paymentTypes);
            }
            // Update bank name filter to use IN operator
            if (filters.bankNames.length > 0) {
                query = query.in('bank_name', filters.bankNames);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            setDonations(data);
            setTotalCount(count);
        } catch (error) {
            console.error('Error fetching donations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData({ pageIndex: 0, pageSize: 10 });
    }, [filters]);

    const handleExport = async () => {
        try {
            let query = supabase
                .from('donations')
                .select('*')
                .order('date', { ascending: false });

            // Apply filters
            if (filters.startDate) {
                query = query.gte('date', filters.startDate.toISOString());
            }
            if (filters.endDate) {
                query = query.lte('date', filters.endDate.toISOString());
            }
            if (filters.donorName) {
                query = query.ilike('donor_name', `%${filters.donorName}%`);
            }
            if (filters.paymentTypes.length > 0) {
                query = query.in('payment_type', filters.paymentTypes);
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
            link.setAttribute("download", "filtered_donations_export.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    const resetFilters = () => {
        setFilters({
            startDate: null,
            endDate: null,
            donorName: '',
            paymentTypes: [],
            bankNames: [], // Update this line
        });
    };

    const [dateError, setDateError] = useState('');

    const handleDateChange = (type, date) => {
        setDateError('');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date > today) {
            setDateError(`${type} date cannot be in the future`);
            return;
        }

        if (type === 'start' && filters.endDate && date > filters.endDate) {
            setDateError('Start date cannot be after end date');
            return;
        }

        if (type === 'end' && filters.startDate && date < filters.startDate) {
            setDateError('End date cannot be before start date');
            return;
        }

        setFilters(prev => ({ ...prev, [type === 'start' ? 'startDate' : 'endDate']: date }));
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
                                    options={bankOptions}
                                    selected={filters.bankNames}
                                    onChange={(selected) => setFilters(prev => ({ ...prev, bankNames: selected }))}
                                    placeholder="Select Banks"
                                />
                            </div>
                            <div className="w-[200px]">
                                <MultiSelect
                                    options={paymentTypeOptions}
                                    selected={filters.paymentTypes}
                                    onChange={(selected) => setFilters(prev => ({ ...prev, paymentTypes: selected }))}
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

                        // isColumnButton={true}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default Page;
