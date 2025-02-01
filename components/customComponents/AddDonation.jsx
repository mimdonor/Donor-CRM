"use client";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "react-toastify";

const donorTypes = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Institution', label: 'Institution' },
];

const AddDonation = () => {
  const { register, handleSubmit, control, watch, reset, setValue, getValues, formState: { errors } } = useForm();
  const [searchBy, setSearchBy] = useState("name");
  const paymentType = watch("paymentType");
  const selectedOrganization = watch("organization");
  const selectedDonorId = watch("donor");
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();
  const [purposes, setPurposes] = useState([]);
  const [filteredPurposes, setFilteredPurposes] = useState([]);
  const [donorType, setDonorType] = useState('');
  const [lastReceiptNo, setLastReceiptNo] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDonors();
    fetchPurposes();
    fetchLastReceiptNo();
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      const filtered = purposes.filter(purpose => purpose.organization === selectedOrganization);
      setFilteredPurposes(filtered);
      
      // Update purposes based on the current donor and new organization
      if (selectedDonorId) {
        handleDonorChange(selectedDonorId, selectedOrganization);
      } else {
        setValue('purposes', []);
      }
    }
  }, [selectedOrganization, purposes, setValue, selectedDonorId]);

  const fetchDonors = async () => {
    const { data, error } = await supabase
      .from("donors")
      .select("id, donor_name, donor_number")
      .order("donor_name", { ascending: true });

    if (error) {
      console.error("Error fetching donors:", error);
      setError("Failed to fetch donors");
    } else {
      setDonors(data);
      setFilteredDonors(data);
    }
  };

  const fetchPurposes = async () => {
    const { data, error } = await supabase
      .from("purposes_dropdown")
      .select("name, organization")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching purposes:", error);
      setError("Failed to fetch purposes");
    } else {
      setPurposes(data);
    }
  };

  const fetchLastReceiptNo = async () => {
    const { data, error } = await supabase
      .from("donations")
      .select("receipt_no")
      .order("receipt_no", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching last receipt number:", error);
      setError("Failed to fetch last receipt number");
    } else {
      const nextReceiptNo = data.length > 0 ? data[0].receipt_no + 1 : 1;
      setLastReceiptNo(nextReceiptNo);
    }
  };

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from("organization_settings")
      .select("id, name");

    if (error) {
      console.error("Error fetching organizations:", error);
      setError("Failed to fetch organizations");
    } else {
      setOrganizations(data.map(org => ({ value: org.name, label: org.name })));
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = donors.filter((donor) =>
      searchBy === "name"
        ? `${donor.donor_name}`.toLowerCase().includes(value.toLowerCase())
        : donor.donor_number.toString().includes(value)
    );
    setFilteredDonors(filtered);
  };

  const handleDonorChange = async (donorId, org = selectedOrganization) => {
    const { data, error } = await supabase
      .from("donors")
      .select("*")
      .eq("id", donorId)
      .single();

    if (error) {
      console.error("Error fetching donor details:", error);
      setError("Failed to fetch donor details");
    } else {
      setSelectedDonor(data);
      const filteredPurposesForOrg = purposes.filter(purpose => purpose.organization === org);
      
      if (data.category === 'Regular' && Array.isArray(data.purposes)) {
        // Filter purposes to only include those matching the selected organization
        const validPurposes = data.purposes.filter(purpose => 
          filteredPurposesForOrg.some(fp => fp.name === purpose)
        );
        setValue('purposes', validPurposes);
        setValue('amount', data.commitment || '');
      } else {
        // For non-regular donors, keep existing purposes if they're valid for the new organization
        const currentPurposes = getValues('purposes');
        const validPurposes = currentPurposes.filter(purpose => 
          filteredPurposesForOrg.some(fp => fp.name === purpose)
        );
        setValue('purposes', validPurposes);
        setValue('amount', '');
      }
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const selectedDonor = donors.find((donor) => donor.id.toString() === data.donor);

    if (!selectedDonor) {
      setError("Selected donor not found. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const donationData = {
      donor_id: selectedDonor.id,
      donor_name: `${selectedDonor.donor_name}`,
      date: format(data.date, "yyyy-MM-dd"), // Format the date
      payment_type: data.paymentType,
      amount: parseFloat(data.amount),
      receipt_no: lastReceiptNo,
      transaction_number: data.transactionNumber ? Number(data.transactionNumber) : null,
      cheque_number: data.chequeNumber ? Number(data.chequeNumber) : null,
      purpose: data.purposes, // Now saving as an array
      organization: data.organization, // Add the organization
    };

    toast.promise(
      (async () => {
        const { data: insertedDonation, error: donationError } = await supabase
          .from('donations')
          .insert(donationData)
          .single();

        if (donationError) throw donationError;

        const { error: donorUpdateError } = await supabase
          .from('donors')
          .update({ last_donation_date: donationData.date })
          .eq('id', selectedDonor.id);

        if (donorUpdateError) throw donorUpdateError;

        reset();
        setIsSubmitting(false);
        return "Donation added successfully";
      })(),
      {
        loading: "Adding donation...",
        success: (message) => message,
        error: (error) => `Failed to add donation: ${error.message}`,
      }
    ).then(() => {
      router.push('/donations');
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <div className="w-full flex justify-between items-center">
          <CardTitle className="text-2xl">Add Donation</CardTitle>
          <p className="flex gap-2 items-center text-sm text-gray-500">
            Receipt No - 
            <span className="bg-[#F3E6D5] text-[#6C665F]text-sm px-2 py-1 rounded-md">
              {lastReceiptNo || ""}
            </span>
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/2">
              <Label htmlFor="organization">Organization</Label>
              <Controller
                name="organization"
                control={control}
                rules={{ required: "Organization is required" }}
                render={({ field }) => (
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setFilteredPurposes([]);
                    }} 
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.value} value={org.value}>{org.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.organization && <p className="text-red-500">{errors.organization.message}</p>}
            </div>
          </div>

          <div className="flex space-x-4">
            {/* Search by name or donor_number */}
            <div className="w-1/2">
              <Label htmlFor="searchBy">Search By</Label>
              <Select
                value={searchBy}
                onValueChange={(value) => {
                  setSearchBy(value);
                  setSearchTerm("");
                  setFilteredDonors(donors);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="id">ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2">
              <Label htmlFor="donor">Donor</Label>
              <Controller
                name="donor"
                control={control}
                rules={{ required: "Donor is required" }}
                render={({ field }) => (
                  <>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleDonorChange(value);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Search by ${searchBy}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <Input
                          placeholder={`Search by ${searchBy}`}
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="mb-2"
                        />
                        {filteredDonors.map((donor) => (
                          <SelectItem key={donor.id} value={donor.id.toString()}>
                            {searchBy === "name"
                              ? `${donor.donor_name}`
                              : donor.donor_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.donor && (
                      <p className="text-red-500">{errors.donor.message}</p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="w-1/2">
              <Label htmlFor="date">Date</Label>
              <Controller
                name="date"
                control={control}
                rules={{ required: "Date is required" }}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date)}
                  />
                )}
              />
              {errors.date && <p className="text-red-500">{errors.date.message}</p>}
            </div>
            <div className="w-1/2">
              <Label htmlFor="purposes">Purposes</Label>
              <Controller
                name="purposes"
                control={control}
                rules={{ required: "At least one purpose is required" }}
                render={({ field }) => (
                  <MultiSelect
                    options={filteredPurposes.map(p => ({ 
                      value: p.name, 
                      label: p.name
                    }))}
                    selected={field.value || []}
                    onChange={(selected) => {
                      const validSelected = selected.filter(s => 
                        filteredPurposes.some(fp => fp.name === s)
                      );
                      field.onChange(validSelected);
                    }}
                    placeholder="Select Purposes"
                  />
                )}
              />
              {errors.purposes && (
                <p className="text-red-500">{errors.purposes.message}</p>
              )}
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <Label htmlFor="paymentType">Payment Type</Label>
            <Controller
              name="paymentType"
              control={control}
              rules={{ required: "Payment type is required" }}
              defaultValue=""
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Payment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.paymentType && (
              <p className="text-red-500">{errors.paymentType.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input id="amount" type="number" {...register("amount", { required: "Amount is required" })} />
            {errors.amount && <p className="text-red-500">{errors.amount.message}</p>}
          </div>

          {paymentType === "Online" && (
            <div>
              <Label htmlFor="transactionNumber">Transaction Number</Label>
              <Input
                id="transactionNumber"
                {...register("transactionNumber", { required: "Transaction number is required" })}
              />
              {errors.transactionNumber && <p className="text-red-500">{errors.transactionNumber.message}</p>}
            </div>
          )}

          {paymentType === "Cheque" && (
            <div>
              <Label htmlFor="chequeNumber">Cheque Number</Label>
              <Input
                id="chequeNumber"
                {...register("chequeNumber", { required: "Cheque number is required" })}
              />
              {errors.chequeNumber && <p className="text-red-500">{errors.chequeNumber.message}</p>}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddDonation;