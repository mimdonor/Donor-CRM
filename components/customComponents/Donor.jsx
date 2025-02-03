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
import { usePermissions } from "@/context/PermissionsProvider";


export default function Donor() {
  const router = useRouter();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const { permissions, user } = usePermissions();
  const donorPermissions = permissions?.donorModule || {};
  const [visibleColumns, setVisibleColumns] = useState({
    donor_number: true,
    donor_name: true,
    phone: true,
    donor_source: true,
    institution_name: true,
    representative: true,
    donor_zone: true,
    donor_type: true,
  });

  useEffect(() => {
    fetchDonors();
  }, [activeTab]); // Refetch when tab changes

  const handleView = useCallback((donor) => {
    router.push(`/donors/view/${donor.id}`);
  }, [router]);

  const handleEdit = useCallback((donor) => {
    router.push(`/donors/editDonor/${donor.id}`);
  }, [router]);

  const handleDisableClick = useCallback((donor) => {
    setDonorToDelete(donor);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDisableConfirm = useCallback(async () => {
    if (donorToDelete) {
      try {
        if (activeTab === 'active') {
          // Insert donor into deleted_donors table
          const { error: insertError } = await supabase
            .from('deleted_donors')
            .insert(donorToDelete);

          if (insertError) throw insertError;

          // Delete donor from donors table
          const { error: deleteError } = await supabase
            .from('donors')
            .delete()
            .eq('id', donorToDelete.id);

          if (deleteError) throw deleteError;
        } else {
          // Insert donor back into donors table
          const { error: insertError } = await supabase
            .from('donors')
            .insert(donorToDelete);

          if (insertError) throw insertError;

          // Delete donor from deleted_donors table
          const { error: deleteError } = await supabase
            .from('deleted_donors')
            .delete()
            .eq('id', donorToDelete.id);

          if (deleteError) throw deleteError;
        }

        fetchDonors(); // Refresh the list
        setIsDeleteDialogOpen(false);
        setDonorToDelete(null);
      } catch (error) {
        console.error("Error moving donor:", error);
      }
    }
  }, [donorToDelete, activeTab]);

  const handleDisableCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDonorToDelete(null);
  }, []);

  const handleImportSuccess = useCallback(() => {
    fetchDonors();
    setIsImportModalOpen(false);
  }, []);

  const handlePrint = useCallback((donor) => {
    router.push(`/donors/print/${donor.id}`);
  }, [router]);

  const allColumns = [
    { 
      header: "Donor ID", 
      accessorKey: "donor_number" 
    },
    { 
      header: "Donor Name", 
      accessorKey: "donor_name",
      cell: ({ row }) => {
        const donor = row.original;
        return donor.donor_type === 'Institution' ? donor.contact_person : donor.donor_name;
      }
    },
    {header: "Donor Type", accessorKey: "donor_type"},
    {header: "Institution Name", accessorKey: "institution_name"},
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
              {
                donorPermissions.canEdit &&
                (
                <DropdownMenuItem onClick={() => handleEdit(donor)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              )}
              {
                donorPermissions.canPrint &&
                (
              <DropdownMenuItem onClick={() => handlePrint(donor)}>
                <Printer className="mr-2 h-4 w-4" />
                <span>Print</span>
              </DropdownMenuItem>
                )}
                
              {activeTab === 'active' && donorPermissions.canDelete && (
                
                <DropdownMenuItem onClick={() => handleDisableClick(donor)}>
                  <Ban className="mr-2 h-4 w-4" />
                  <span>Disable Donor</span>
                </DropdownMenuItem>
              )}
              {activeTab === 'inactive' && donorPermissions.canDelete && (

                <DropdownMenuItem onClick={() => handleDisableClick(donor)}>
                  <Ban className="mr-2 h-4 w-4" />
                  <span>Enable Donor</span>
                </DropdownMenuItem>
              )}
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
      const tableName = activeTab === 'inactive' ? 'deleted_donors' : 'donors';
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

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

  if (donorPermissions.allowAccess && !donorPermissions.canAdd && !donorPermissions.canEdit && !donorPermissions.onlyView && !donorPermissions.canDelete && !donorPermissions.canPrint) {
    return (
      <div className="flex justify-center items-center h-full">
        <h2 className="text-2xl font-bold">You don't have view access to this module</h2>
      </div>
    );
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
            {donorPermissions.canAdd && (
              <Button 
                className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]" 
                onClick={() => setIsImportModalOpen(true)}
              >
                Import Donor
              </Button>
            )}
            {permissions && donorPermissions.canAdd && (
              <Link href="/donors/addDonor">
                <Button className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]">
                  Add Donor
                </Button>
              </Link>
            )}
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
                isExportButton={donorPermissions.canAdd || donorPermissions.canEdit}
                searchText="Search donors..."
                searchColumn="donor_name"
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
                isExportButton={donorPermissions.canAdd || donorPermissions.canEdit}
                searchText="Search donors..."
                searchColumn="donor_name"
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
            <DialogTitle className="text-black">
              Confirm {activeTab === 'active' ? 'Disable' : 'Enable'}
            </DialogTitle>
            <DialogDescription className="text-black">
              Are you sure you want to {activeTab === 'active' ? 'disable' : 'enable'} donor {donorToDelete?.donor_name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="text-black" variant="outline" onClick={handleDisableCancel}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisableConfirm}>
              {activeTab === 'active' ? 'Disable' : 'Enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}