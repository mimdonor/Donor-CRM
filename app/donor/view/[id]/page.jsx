"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DonorView() {
  const { id } = useParams();
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonor();
  }, [id]);

  async function fetchDonor() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDonor(data);
    } catch (error) {
      console.error('Error fetching donor:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center">Loading donor information...</div>;
  }

  if (!donor) {
    return <div className="text-center">Donor not found</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="w-full mx-auto p-8 relative overflow-hidden">
        <div className="absolute w-full top-0 left-0 right-0 h-2 bg-[#F3E6D5]"></div>
        <div className="absolute top-2 left-0 w-2 h-2 bg-white rounded-bl-full"></div>
        <div className="absolute top-2 right-0 w-2 h-2 bg-white rounded-br-full"></div>
        <CardHeader className="flex flex-row justify-between items-center">
          <div className="w-full flex justify-between items-center">
            <CardTitle className="text-2xl md:text-3xl">Donor Information</CardTitle>
            <p className="flex gap-2 items-center text-sm text-gray-500">
              Donor ID - 
              <span className="bg-[#F3E6D5] text-[#6C665F] text-sm px-2 py-1 rounded-md">
                {donor.donor_number}
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
                  <p className="font-semibold">Donor Type:</p>
                  <p>{donor.donor_type}</p>
                </div>
                <div>
                  <p className="font-semibold">Donor Source:</p>
                  <p>{donor.donor_source}</p>
                </div>
                <div>
                  <p className="font-semibold">Representative:</p>
                  <p>{donor.representative}</p>
                </div>
                <div>
                  <p className="font-semibold">Donor Zone:</p>
                  <p>{donor.donor_zone}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                {donor.donor_type === 'Institution' ? 'Institution Information' : 'Personal Information'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {donor.donor_type === 'Institution' ? (
                  <>
                    <div>
                      <p className="font-semibold">Institution Name:</p>
                      <p>{donor.institution_name}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Contact Person:</p>
                      <p>{donor.contact_person}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold">Donor Name:</p>
                      <p>{donor.donor_name}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Phone:</p>
                  <p>{donor.phone}</p>
                </div>
                <div>
                  <p className="font-semibold">Address:</p>
                  <p>{`${donor.street_name}, ${donor.area_name}`}</p>
                  <p>{`${donor.landmark ? donor.landmark + ', ' : ''}${donor.city}`}</p>
                  <p>{`${donor.state}, ${donor.country} - ${donor.pincode}`}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Category:</p>
                  <p>{donor.category}</p>
                </div>
                <div>
                  <p className="font-semibold">PAN Number:</p>
                  <p>{donor.pan_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}