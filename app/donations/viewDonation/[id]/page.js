"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card } from "@/components/ui/card";
import Image from 'next/image';
import SeeshanHeader from "@/public/assets/SeeshanHeader.png";
import MimHeader from "@/public/assets/MIMHeader.png";
import SeeshanFooter from "@/public/assets/SeeshanFooter.png";
import MimFooter from "@/public/assets/MIMFooter.png";

export default function DonationView() {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    fetchDonation();
  }, [id]);

  async function fetchDonation() {
    try {
      setLoading(true);
      const { data: donationData, error: donationError } = await supabase
        .from('donations')
        .select('*')
        .eq('id', id)
        .single();

      if (donationError) throw donationError;

      if (donationData) {
        const { data: donorData, error: donorError } = await supabase
          .from('donors')
          .select('*')
          .eq('donor_number', donationData.donor_id)
          .single();

        if (donorError) throw donorError;

        setDonation({ ...donationData, donor: donorData });

        // Fetch organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organization_settings')
          .select('*')
          .eq('name', donationData.organization)
          .single();
        
        if (orgError) throw orgError;
        console.log(orgData)

        setOrganization(orgData);

        const {data: receiptData, error: receiptError} = await supabase
        .from('receipt_message')
        .select('message')
        .single();

        if (receiptData) {
          console.log("Receipt", receiptData)
          setReceiptData(receiptData);
        }

      }
    } catch (error) {
      console.error('Error fetching donation:', error);
    } finally {
      setLoading(false);
    }
  }
  

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  };

  const formatAddress = (org) => {
    if (!org) return 'Address not available';
    return `${org.street_name}, ${org.area_name}
${org.city}, ${org.state}
${org.country} - ${org.pincode}
Phone: ${org.phone}
`;
  };

  if (loading) {
    return <div className="text-center">Loading donation information...</div>;
  }

  if (!donation || !organization) {
    return <div className="text-center">Donation or organization not found</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card className="relative overflow-hidden">
        <div className="w-full">
          <Image
            src={organization.name === "Seeshan" ? SeeshanHeader : MimHeader}
            alt={`${organization.name} Header`}
            sizes="100vw"
            className="w-full h-28"
          />
        </div>
        <div className="p-8">
          <div className="w-1/4 text-left">
            <p className="text-sm">
              <strong>Receipt No:</strong> {donation.receipt_no}
            </p>
            <p className="text-sm">
              <strong>Date:</strong> {formatDate(donation.date)}
            </p>
          </div>

          {/* <h2 className="text-2xl font-bold text-center mb-6 text-green-600">
            Receipt
 </div>         </h2> */}

          <div className="space-y-4 my-6">
            <div className="flex">
              <p className="w-1/3"><strong>Received From:</strong></p>
              <p className="w-2/3">{donation.donor?.institution_name ? donation.donor?.institution_name : donation.donor?.donor_name }</p>
            </div>
            <div className="flex">
              <p className="w-1/3"><strong>City:</strong></p>
              <p className="w-2/3">{donation.donor?.city}</p>
            </div>
            <div className="flex">
              <p className="w-1/3"><strong>Towards:</strong></p>
              <p className="w-2/3">{donation.purpose}</p>
            </div>
            <div className="flex">
              <p className="w-1/3"><strong>Amount:</strong></p>
              <p className="w-2/3">Rs. {donation.amount.toFixed(2)}</p>
            </div>
            {/* <div className="flex">
              <p className="w-1/3"><strong>Remarks:</strong></p>
              <p className="w-2/3">{donation.remarks || 'N/A'}</p>
            </div> */}
          </div>

          {/* <div className="flex justify-end mb-12">
            <div className="w-1/3">
              <div className="border-t border-black pt-2">
                <p className="text-center">Authorized Signature</p>
              </div>
            </div>
          </div> */}

          <div className="flex justify-end -mr-16 -mb-10">
            <div className="w-56">
              <p className="text-[10px] text-gray-600 text-left">
                Signature is not required<br />
                as the document is to be digitally signed
              </p>
            </div>
          </div>
          
        </div>
        <div className="w-full">
          <Image
            src={organization.name === "Seeshan" ? SeeshanFooter : MimFooter}
            alt={`${organization.name} Footer`}
            sizes="100vw"
            className="w-full h-28"
          />
        </div>
        <div className="bg-gray-100 p-4 text-center">
            <p 
              className="text-sm italic mt-2"
              dangerouslySetInnerHTML={{ __html: receiptData.message }}
            />
          </div>
      </Card>
    </div>
  );
}