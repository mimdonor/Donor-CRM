"use client";
import { useParams } from 'next/navigation';
import AddDonor from '@/components/customComponents/AddDonor';

export default function EditDonor() {
  const { id } = useParams();

  return <AddDonor donorId={id} />;
}