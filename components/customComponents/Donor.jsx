"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import PaginatedTable from './PaginatedTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Eye, Edit, Ban, Printer } from "lucide-react";
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ImportExcelModal from './ImportExcelModal';
import { Checkbox } from "@/components/ui/checkbox";

export default function Donor() {
  const router = useRouter();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [visibleColumns, setVisibleColumns] = useState({
    donor_number: true,
    donor_name: true,
    phone: true,
    donor_source: true,
    representative: true,
    donor_zone: true,
    donor_type: true
  });

  useEffect(() => {
    fetchDonors();
  }, [activeTab]); // Refetch when tab changes

  const handleView = useCallback((donor) => {
    router.push(`/donor/view/${donor.id}`);
  }, [router]);

  const handleEdit = useCallback((donor) => {
    router.push(`/donor/editDonor/${donor.id}`);
  }, [router]);

  const handleDisableClick = useCallback((donor) => {
    setDonorToDelete(donor);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDisableConfirm = useCallback(async () => {
    if (donorToDelete) {
      try {
        const { error } = await supabase
          .from('donors')
          .update({ isDisabled: !donorToDelete.isDisabled })
          .eq('id', donorToDelete.id);

        if (error) throw error;

        fetchDonors(); // Refresh the list
        setIsDeleteDialogOpen(false);
        setDonorToDelete(null);
      } catch (error) {
        console.error("Error updating donor status:", error);
      }
    }
  }, [donorToDelete]);

  const handleDisableCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDonorToDelete(null);
  }, []);

  const handleImportSuccess = useCallback(() => {
    fetchDonors();
    setIsImportModalOpen(false);
  }, []);

  const handlePrint = useCallback((donor) => {
    router.push(`/donor/print/${donor.id}`);
  }, [router]);

  const allColumns = [
    { header: "Donor ID", accessorKey: "donor_number" },
    { header: "Donor Name", accessorKey: "donor_name" },
    { header: "Mobile Number", accessorKey: "phone" },
    { header: "Street Name", accessorKey: "street_name" },
    { header: "Area Name", accessorKey: "area_name" },
    { header: "Landmark", accessorKey: "landmark" },
    { header: "City / District", accessorKey: "city" },
    { header: "State", accessorKey: "state" },
    { header: "Country", accessorKey: "country" },
    { header: "Pincode", accessorKey: "pincode" },
    { header: "Donor Source", accessorKey: "donor_source" },
    { header: "In charge / Representative", accessorKey: "representative" },
    { header: "Donor Zone", accessorKey: "donor_zone" },
    { header: "Donor Type", accessorKey: "donor_type" },
    { header: "Pan Number", accessorKey: "pan_number" },
  ];

  const columns = [
    ...allColumns.filter(col => visibleColumns[col.accessorKey]),
    {
      id: "actions",
      cell: ({ row }) => {
        const donor = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(donor)}>
                <Eye className="mr-2 h-4 w-4" />
                <span>View</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(donor)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrint(donor)}>
                <Printer className="mr-2 h-4 w-4" />
                <span>Print</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDisableClick(donor)}>
                <Ban className="mr-2 h-4 w-4" />
                <span>{donor.isDisabled ? 'Enable Donor' : 'Disable Donor'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const ColumnToggle = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Columns</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {allColumns.map((column) => (
          <DropdownMenuItem key={column.accessorKey}>
            <Checkbox
              checked={visibleColumns[column.accessorKey]}
              onCheckedChange={(checked) => 
                setVisibleColumns(prev => ({ ...prev, [column.accessorKey]: checked }))
              }
            />
            <span className="ml-2">{column.header}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  async function fetchDonors() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .eq('isDisabled', activeTab === 'inactive');

      if (error) {
        throw error;
      }

      const transformedData = data.map(donor => ({
        ...donor,
        donor_name: `${donor.donor_name}`,
      }));

      setDonors(transformedData);
    } catch (error) {
      console.error('Error fetching donors:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Donors List</h2>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="active">Active Donors</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Donors</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button 
              className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]" 
              onClick={() => setIsImportModalOpen(true)}
            >
              Import Donor
            </Button>
            <Link href="/donor/addDonor">
              <Button className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]">
                Add Donor
              </Button>
            </Link>
            <ColumnToggle />
          </div>
        </div>

        <TabsContent value="active">
          <Card>
            <CardContent>
              <PaginatedTable
                columns={columns}
                data={donors}
                isColumnButton={false}
                searchText="Search donors..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive">
          <Card>
            <CardContent>
              <PaginatedTable
                columns={columns}
                data={donors}
                isColumnButton={false}
                searchText="Search donors..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        tableName="donors"
      />
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black">Confirm {donorToDelete?.isDisabled ? 'Enable' : 'Disable'}</DialogTitle>
            <DialogDescription className="text-black">
              Are you sure you want to {donorToDelete?.isDisabled ? 'enable' : 'disable'} donor {donorToDelete?.donor_name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="text-black" variant="outline" onClick={handleDisableCancel}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisableConfirm}>
              {donorToDelete?.isDisabled ? 'Enable' : 'Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}