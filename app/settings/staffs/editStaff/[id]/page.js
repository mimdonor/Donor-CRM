"use client";
import { useParams } from 'next/navigation';
import AddStaffs from '@/components/customComponents/AddStaffs';

export default function EditStaff() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <AddStaffs staffId={id} />
    </div>
  );
}
