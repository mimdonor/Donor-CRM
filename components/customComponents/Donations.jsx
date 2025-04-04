"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PaginatedTable from "@/components/customComponents/PaginatedTable";
import { MoreHorizontal, Eye, Edit, Trash2, Printer, Upload } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ImportExcelModal from './ImportExcelModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/context/PermissionsProvider";
import { Textarea } from "@/components/ui/textarea";
import toast from 'react-hot-toast';
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

// Custom toolbar handlers
const customBoldHandler = function() {
  const range = this.quill.getSelection();
  if (range) {
    this.quill.format('bold', !this.quill.getFormat(range).bold);
  }
};

// Custom toolbar configuration
const modules = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean'],
      [{ 'align': [] }]
    ],
    handlers: {
      bold: customBoldHandler
    }
  }
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'link', 'align'
];

const Donations = () => {
  const router = useRouter();
  const [donations, setDonations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [donors, setDonors] = useState([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const { permissions, user } = usePermissions();
  const donationsPermissions = permissions?.donationsModule || {};
  const [isReceiptMessageModalOpen, setIsReceiptMessageModalOpen] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState('');
  const [isMessageSubmitting, setIsMessageSubmitting] = useState(false);
  const [messageId, setMessageId] = useState(null);

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
    setDonationToDelete(donation);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (donationToDelete) {
      try {
        const { error } = await supabase
          .from('donations')
          .delete()
          .eq('id', donationToDelete.id);

        if (error) throw error;

        setDonations(prevDonations => prevDonations.filter(d => d.id !== donationToDelete.id));
        setIsDeleteDialogOpen(false);
        setDonationToDelete(null);
      } catch (error) {
        console.error("Error deleting donation:", error);
      }
    }
  }, [donationToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDonationToDelete(null);
  }, []);

  const handleImportSuccess = useCallback(() => {
    fetchData({ pageIndex: 0, pageSize: 10 });
    setIsImportModalOpen(false);
  }, []);

  const fetchDonors = async () => {
    try {
      const { data, error } = await supabase
        .from('donors')
        .select('id, donor_name')
        .order('donor_name');

      if (error) throw error;
      setDonors(data);
    } catch (error) {
      console.error('Error fetching donors:', error);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handlePrintReceipt = () => {
    setIsPrintModalOpen(true);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePrintConfirm = async () => {
    if (!selectedDonor || !selectedFile) {
      alert('Please select a donor and upload a PDF file');
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('donorId', selectedDonor);
      
      const response = await fetch('/api/send-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send receipt');
      }

      const data = await response.json();
      setIsPrintModalOpen(false);
      setSelectedDonor(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending receipt:', error);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchReceiptMessage();
  }, []);

  const fetchReceiptMessage = async () => {
    try {
      const { data, error } = await supabase
        .from('receipt_message')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setReceiptMessage(data.message);
        setMessageId(data.id);
      }
    } catch (error) {
      console.error('Error fetching receipt message:', error);
    }
  };

  const handleAddReceiptMessage = async () => {
    setIsMessageSubmitting(true);
    try {
      let result;
      if (messageId) {
        result = await supabase
          .from('receipt_message')
          .update({ message: receiptMessage })
          .eq('id', messageId);
      } else {
        result = await supabase
          .from('receipt_message')
          .insert([{ message: receiptMessage }])
          .select();
      }

      if (result.error) throw result.error;

      toast.success(messageId ? 'Receipt message updated successfully' : 'Receipt message added successfully');
      setIsReceiptMessageModalOpen(false);
      
      if (!messageId && result.data?.[0]?.id) {
        setMessageId(result.data[0].id);
      }
    } catch (error) {
      console.error('Error saving receipt message:', error);
      toast.error('Failed to save receipt message');
    } finally {
      setIsMessageSubmitting(false);
    }
  };

  const columns = [
    {header: 'Donor ID', accessorKey: 'donor_id'},
    {header: 'Donor Name', accessorKey: 'donor_name'},
    {header: 'Date', accessorKey: 'date'},
    {header: 'Payment Type', accessorKey: 'payment_type'},
    {header: 'Amount', accessorKey: 'amount'},
    {header: 'Receipt No', accessorKey: 'receipt_no'},
    {header: 'Transaction Number', accessorKey: 'transaction_number'},
    {header: 'Cheque Number', accessorKey: 'cheque_number'},
    {
      id: 'actions',
      cell: ({ row }) => {
        const donation = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(donation)}>
                <Eye className="mr-2 h-4 w-4" />
                <span>View</span>
              </DropdownMenuItem>
              {donationsPermissions.canEdit && (
                <DropdownMenuItem onClick={() => handleEdit(donation)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
              )}
              {donationsPermissions.canPrint && (
                <DropdownMenuItem onClick={() => handlePrint(donation)}>
                  <Printer className="mr-2 h-4 w-4" />
                  <span>Print</span>
                </DropdownMenuItem>
              )}
              {donationsPermissions.canDelete && (
                <DropdownMenuItem onClick={() => handleDeleteClick(donation)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete/Disable Donation</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (donationsPermissions.allowAccess && !donationsPermissions.canAdd && !donationsPermissions.canEdit && !donationsPermissions.onlyView && !donationsPermissions.canDelete && !donationsPermissions.canPrint) {
    return (
      <div className="flex justify-center items-center h-full">
        <h2 className="text-2xl font-bold">You don't have view access to this module</h2>
      </div>
    );
  }

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('donations')
        .select('*', { count: 'exact' })
        .order('date', { ascending: false });

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
    fetchData({ pageIndex: 0, pageSize: 10 }); // Initial fetch
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Donations List</h2>
        <div className="space-x-2 flex items-center">
        {donationsPermissions.canAdd && (
            <Link href="/donations/addDonation">
              <Button className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]">Add Donation</Button>
            </Link>
          )}
          {donationsPermissions.canAdd && (
              <Button 
                className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]"
                onClick={() => setIsReceiptMessageModalOpen(true)}
              >
                Add Receipt Message
              </Button>
          )}
        </div>
      </div>
      <Card className="w-full">
        <CardContent>
          <PaginatedTable
            columns={columns}
            data={donations}
            fetchData={fetchData}
            totalCount={totalCount}
            isLoading={isLoading}
            searchText="Search donations..."
            searchColumn="donor_name"
            isColumnButton={true}
            onImport={() => setIsImportModalOpen(true)}
          />
        </CardContent>
        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
          tableName="donations"
        />
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Donation</DialogTitle>
              <DialogDescription>Are you sure you want to delete this donation?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleDeleteConfirm}>Delete</Button>
              <Button onClick={handleDeleteCancel}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
          <DialogContent className="text-black">
            <DialogHeader>
              <DialogTitle>Send Receipt</DialogTitle>
              <DialogDescription>Select the donor and upload the receipt to send</DialogDescription>
            </DialogHeader>
            <Select onValueChange={(value) => setSelectedDonor(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a donor" />
              </SelectTrigger>
              <SelectContent>
                {donors.map(donor => (
                  <SelectItem key={donor.id} value={donor.id}>
                    {donor.donor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => fileInputRef.current.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {selectedFile ? selectedFile.name : "Upload Receipt (PDF)"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <DialogFooter>
              <Button 
                onClick={handlePrintConfirm} 
                disabled={isSending || !selectedDonor || !selectedFile}
              >
                {isSending ? 'Sending...' : 'Send'}
              </Button>
              <Button onClick={() => setIsPrintModalOpen(false)} disabled={isSending}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isReceiptMessageModalOpen} onOpenChange={setIsReceiptMessageModalOpen}>
          <DialogContent className="text-black max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{messageId ? 'Update' : 'Add'} Receipt Message</DialogTitle>
              <DialogDescription>
                Enter the message to be displayed on receipts
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-auto receipt-scrollbar">
              <ReactQuill
                theme="snow"
                value={receiptMessage}
                onChange={setReceiptMessage}
                modules={modules}
                formats={formats}
                className="bg-white h-[300px] sm:h-[400px]"
                placeholder="Enter your receipt message here..."
              />
            </div>
            <DialogFooter className="mt-4 border-t pt-4">
              <Button 
                onClick={handleAddReceiptMessage} 
                disabled={isMessageSubmitting || !receiptMessage.trim()}
                className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]"
              >
                {isMessageSubmitting ? 'Submitting...' : messageId ? 'Update' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
};

export default Donations;
