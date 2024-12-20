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
import { Checkbox } from "@/components/ui/checkbox";
import ImportExcelModal from './ImportExcelModal';

export default function Representatives() {
  const router = useRouter();
  const [representatives, setRepresentatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [representativeToDelete, setRepresentativeToDelete] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [visibleColumns, setVisibleColumns] = useState({
    representative_name: true,
    representative_number: true,
    phone: true,
    door_no: true,
    street_name: true,
    area_name: true,
    landmark: true,
    city: true,
    state: true,
    country: true,
    pincode: true,
    representative_type: true,
  });

  useEffect(() => {
    fetchRepresentatives();
  }, [activeTab]);

  const handleView = useCallback((representative) => {
    router.push(`/representative/view/${representative.id}`);
  }, [router]);

  const handleEdit = useCallback((representative) => {
    router.push(`/representative/editRepresentative/${representative.id}`);
  }, [router]);

  const handleDisableClick = useCallback((representative) => {
    setRepresentativeToDelete(representative);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDisableConfirm = useCallback(async () => {
    if (representativeToDelete) {
      try {
        const { error } = await supabase
          .from('representatives')
          .update({ 
            isDisabled: !representativeToDelete.isDisabled
          })
          .eq('id', representativeToDelete.id);

        if (error) throw error;

        fetchRepresentatives();
        setIsDeleteDialogOpen(false);
        setRepresentativeToDelete(null);
      } catch (error) {
        console.error("Error updating representative status:", error);
      }
    }
  }, [representativeToDelete]);

  const handleDisableCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setRepresentativeToDelete(null);
  }, []);

  const handleImportSuccess = useCallback(() => {
    fetchRepresentatives();
    setIsImportModalOpen(false);
  }, []);

  const handlePrint = useCallback((representative) => {
    router.push(`/representative/print/${representative.id}`);
  }, [router]);

  const allColumns = [
    { header: "Representative Name", accessorKey: "representative_name" },
    { header: "Representative ID", accessorKey: "representative_number" },
    { header: "Mobile Number", accessorKey: "phone" },
    { header: "Door No", accessorKey: "door_no" },
    { header: "Street Name", accessorKey: "street_name" },
    { header: "Area Name", accessorKey: "area_name" },
    { header: "Landmark", accessorKey: "landmark" },
    { header: "City", accessorKey: "city" },
    { header: "State", accessorKey: "state" },
    { header: "Country", accessorKey: "country" },
    { header: "Pincode", accessorKey: "pincode" },
    { header: "Representative Type", accessorKey: "representative_type" },
  ];

  const columns = [
    ...allColumns.filter(col => visibleColumns[col.accessorKey]),
    {
      id: "actions",
      cell: ({ row }) => {
        const representative = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(representative)}>
                <Eye className="mr-2 h-4 w-4" />
                <span>View</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(representative)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrint(representative)}>
                <Printer className="mr-2 h-4 w-4" />
                <span>Print</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDisableClick(representative)}>
                <Ban className="mr-2 h-4 w-4" />
                <span>{representative.isDisabled ? 'Enable Representative' : 'Disable Representative'}</span>
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

  async function fetchRepresentatives() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('representatives')
        .select('*')
        .eq('isDisabled', activeTab === 'inactive');

      if (error) {
        throw error;
      }

      const transformedData = data.map(representative => ({
        ...representative,
        representative_name: `${representative.representative_name}`,
      }));

      setRepresentatives(transformedData);
    } catch (error) {
      console.error('Error fetching representatives:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Representatives List</h2>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="active">Active Representatives</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Representatives</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button 
              className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]" 
              onClick={() => setIsImportModalOpen(true)}
            >
              Import Representative
            </Button>
            <Link href="/representative/addRepresentative">
              <Button className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]">
                Add Representative
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
                data={representatives}
                isColumnButton={false}
                searchText="Search representatives..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive">
          <Card>
            <CardContent>
              <PaginatedTable
                columns={columns}
                data={representatives}
                isColumnButton={false}
                searchText="Search representatives..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        tableName="representatives"
      />
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black">Confirm {representativeToDelete?.isDisabled ? 'Enable' : 'Disable'}</DialogTitle>
            <DialogDescription className="text-black">
              Are you sure you want to {representativeToDelete?.isDisabled ? 'enable' : 'disable'} representative {representativeToDelete?.representative_name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="text-black" variant="outline" onClick={handleDisableCancel}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisableConfirm}>
              {representativeToDelete?.isDisabled ? 'Enable' : 'Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
