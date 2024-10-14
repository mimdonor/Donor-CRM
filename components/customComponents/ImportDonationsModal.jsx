"use client"
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export default function ImportDonationsModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        let jsonData;

        if (file.name.endsWith('.csv')) {
          const csvText = new TextDecoder().decode(data);
          const workbook = XLSX.read(csvText, { type: 'string' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(sheet);
        } else {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(sheet);
        }

        // Process and insert data into Supabase
        const { data: donationData, error } = await supabase
          .from('donations')
          .insert(jsonData);

        if (error) throw error;

        onImportSuccess();
      } catch (error) {
        console.error('Error importing donation data:', error);
        // You might want to show an error message here
      } finally {
        setIsUploading(false);
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>Import Donations Data</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || isUploading}>
            {isUploading ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}