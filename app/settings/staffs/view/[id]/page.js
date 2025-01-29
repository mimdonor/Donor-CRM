"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ViewStaff() {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffDetails(id);
  }, [id]);

  const fetchStaffDetails = async (staffId) => {
    const { data, error } = await supabase
      .from('staffs')
      .select('*')
      .eq('staff_id', staffId)
      .single();

    if (error) {
      console.error('Error fetching staff details:', error);
    } else {
      setStaff(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center">Loading staff information...</div>;
  }

  if (!staff) {
    return <div className="text-center">Staff not found</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="w-full mx-auto p-8 relative overflow-hidden">
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
    </div>
  );
}
