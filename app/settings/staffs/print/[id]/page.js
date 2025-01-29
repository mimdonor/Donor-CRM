"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PrintStaff() {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, [id]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  async function fetchStaff() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("staffs")
        .select("*")
        .eq("staff_id", id)
        .single();

      if (error) throw error;
      setStaff(data);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center">Loading staff information...</div>;
  }

  if (!staff) {
    return <div className="text-center">Staff not found</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl print:p-0 print:max-w-full">
      <Card className="p-8 relative overflow-hidden">
        <div className="absolute w-full top-0 left-0 right-0 h-2 bg-[#F3E6D5]"></div>
        <div className="absolute top-2 left-0 w-2 h-2 bg-white rounded-bl-full"></div>
        <div className="absolute top-2 right-0 w-2 h-2 bg-white rounded-br-full"></div>
        <CardHeader className="flex flex-row justify-between items-center">
          <div className="w-full flex justify-between items-center">
            <CardTitle className="text-2xl md:text-3xl">Staff Information</CardTitle>
            <p className="flex gap-2 items-center text-sm text-gray-500">
              Staff ID - 
              <span className="bg-[#F3E6D5] text-[#6C665F] text-sm px-2 py-1 rounded-md">
                {staff.staff_id}
              </span>
            </p>
          </div>
        </CardHeader>
        <Separator className="mb-6" />
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Staff Name:</p>
                  <p>{staff.staff_name}</p>
                </div>
                <div>
                  <p className="font-semibold">Email:</p>
                  <p>{staff.email}</p>
                </div>
                <div>
                  <p className="font-semibold">Role:</p>
                  <p>{staff.role}</p>
                </div>
                <div>
                  <p className="font-semibold">Designation:</p>
                  <p>{staff.designation}</p>
                </div>
                <div>
                  <p className="font-semibold">Mobile Number:</p>
                  <p>{staff.mobile_number}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Country:</p>
                  <p>{staff.country}</p>
                </div>
                <div>
                  <p className="font-semibold">State:</p>
                  <p>{staff.state}</p>
                </div>
                <div>
                  <p className="font-semibold">City:</p>
                  <p>{staff.city}</p>
                </div>
                <div>
                  <p className="font-semibold">Pincode:</p>
                  <p>{staff.pincode}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {!isPrinting && (
        <div className="flex flex-row-reverse w-full my-4">
          <Button onClick={handlePrint} className="print:hidden">
            Print Staff
          </Button>
        </div>
      )}
    </div>
  );
}
