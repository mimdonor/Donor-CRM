"use client";
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BankDetails = () => {
  const [bankDetails, setBankDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { register, handleSubmit, reset, control } = useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_details')
        .select('*');
      
      if (error) throw error;
      setBankDetails(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bank details:', error);
      setError('Failed to fetch bank details');
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      if (editingBank) {
        // Update existing bank
        const { error: updateError } = await supabase
          .from('bank_details')
          .update({
            bank_name: data.bankName,
            account_number: data.accountNumber,
            account_type: data.accountType,
          })
          .eq('id', editingBank.id);

        if (updateError) throw updateError;
      } else {
        // Add new bank
        const { error: insertError } = await supabase
          .from('bank_details')
          .insert({
            bank_name: data.bankName,
            account_number: data.accountNumber,
            account_type: data.accountType,
          });

        if (insertError) throw insertError;
      }

      await fetchBankDetails();
      setIsOpen(false);
      setEditingBank(null);
      reset();
    } catch (error) {
      console.error('Error managing bank details:', error);
      setError('Failed to manage bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bank) => {
    setEditingBank(bank);
    reset({
      bankName: bank.bank_name,
      accountNumber: bank.account_number,
      accountType: bank.account_type,
    });
    setIsOpen(true);
  };

  const handleDelete = async (bankId) => {
    try {
      const { error } = await supabase
        .from('bank_details')
        .delete()
        .eq('id', bankId);

      if (error) throw error;
      await fetchBankDetails();
    } catch (error) {
      console.error('Error deleting bank:', error);
      setError('Failed to delete bank account');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Bank Details</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644]"
              onClick={() => {
                setEditingBank(null);
                reset({
                  bankName: '',
                  accountNumber: '',
                  accountType: '',
                });
              }}
            >
              Add Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="text-black">
            <DialogHeader>
              <DialogTitle>
                {editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input 
                    id="bankName" 
                    {...register("bankName", { required: true })} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input 
                    id="accountNumber" 
                    {...register("accountNumber", { required: true })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Controller
                    name="accountType"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Savings">Savings</SelectItem>
                          <SelectItem value="Current">Current</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644]">
                {editingBank ? 'Update Bank Account' : 'Add Bank Account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Accounts</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Accounts</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {bankDetails.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No bank accounts have been added yet.</p>
                    <p className="text-sm">Click the 'Add Bank Account' button to add your first bank account.</p>
                  </div>
                ) : (
                  bankDetails.map((bank) => (
                    <Card key={bank.id} className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Bank Name</Label>
                          <p className="mt-1">{bank.bank_name}</p>
                        </div>
                        <div>
                          <Label>Account Number</Label>
                          <p className="mt-1">{bank.account_number}</p>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <Label>Account Type</Label>
                            <p className="mt-1">{bank.account_type}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(bank)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(bank.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inactive">
          <Card>
            <CardContent className="pt-6">
              {/* Content for inactive accounts */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BankDetails;
