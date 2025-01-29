'use client'
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { MoreHorizontal, Eye, Edit, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissions } from "@/context/PermissionsProvider";

const Staffs = () => {
  const router = useRouter();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const { permissions, user } = usePermissions();
  const staffPermissions = permissions?.staffModule || {};
  const [visibleColumns, setVisibleColumns] = useState({
    staff_id: true,
    staff_name: true,
    email: true,
    role: true,
    designation: true,
    mobile_number: true,
  });

  useEffect(() => {
    fetchStaffs();
  }, []); // Fetch staffs on component mount

  const handleView = useCallback((staff) => {
    router.push(`/settings/staffs/view/${staff.staff_id}`);
  }, [router]);

  const handleEdit = useCallback((staff) => {
    router.push(`/settings/staffs/editStaff/${staff.staff_id}`);
  }, [router]);

  const handlePrint = useCallback((staff) => {
    router.push(`/settings/staffs/print/${staff.staff_id}`);
  }, [router]);

  const allColumns = [
    { header: "Staff ID", accessorKey: "staff_id" },
    { header: "Staff Name", accessorKey: "staff_name" },
    { header: "Email", accessorKey: "email" },
    { header: "Role", accessorKey: "role" },
    { header: "Designation", accessorKey: "designation" },
    { header: "Mobile Number", accessorKey: "mobile_number" },
  ];

  const columns = [
    ...allColumns.filter(col => visibleColumns[col.accessorKey]),
    {
      id: "actions",
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(staff)}>
                <Eye className="mr-2 h-4 w-4" />
                <span>View</span>
              </DropdownMenuItem>
              {/* {
                staffPermissions.canEdit &&
                ( */}
                <DropdownMenuItem onClick={() => handleEdit(staff)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              {/* )} */}
              {/* {
                staffPermissions.canPrint &&
                ( */}
              <DropdownMenuItem onClick={() => handlePrint(staff)}>
                <Printer className="mr-2 h-4 w-4" />
                <span>Print</span>
              </DropdownMenuItem>
                {/* )} */}
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

  async function fetchStaffs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staffs')
        .select('*');

      if (error) {
        throw error;
      }

      setStaffs(data);
    } catch (error) {
      console.error('Error fetching staffs:', error);
    } finally {
      setLoading(false);
    }
  }

  if (staffPermissions.allowAccess && !staffPermissions.canAdd && !staffPermissions.canEdit && !staffPermissions.onlyView && !staffPermissions.canDelete && !staffPermissions.canPrint) {
    return (
      <div className="flex justify-center items-center h-full">
        <h2 className="text-2xl font-bold">You don't have view access to this module</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">Staffs List</h2>
        <Link href="/settings/staffs/addStaff">
                <Button className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]">
                  Add Staff
                </Button>
        </Link>
      </div>

      <Card>
        <CardContent>
          <PaginatedTable
            columns={columns}
            data={staffs}
            isColumnButton={false}
            isExportButton={staffPermissions.canAdd || staffPermissions.canEdit}
            searchText="Search staffs..."
          />
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black">
              Confirm Delete
            </DialogTitle>
            <DialogDescription className="text-black">
              Are you sure you want to delete staff {staffToDelete?.staff_name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="text-black" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {/* handle delete confirm */}}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Staffs;