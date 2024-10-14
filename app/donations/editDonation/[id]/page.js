"use client";
import { useParams } from 'next/navigation';
import AddDonation from '@/components/customComponents/AddDonation';

export default function EditDonation() {
  const { id } = useParams();

  return <AddDonation donationId={id} />;
}
