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
import { toast, Toaster } from 'react-hot-toast';
import { Textarea } from "@/components/ui/textarea";

const donorTypes = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Institution', label: 'Institution' },
];

const AddDonation = ({ donationId }) => {
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
  const [bankAccounts, setBankAccounts] = useState([]);

  useEffect(() => {
    const initializeForm = async () => {
      await Promise.all([
        fetchDonors(),
        fetchPurposes(),
        fetchLastReceiptNo(),
        fetchOrganizations()
      ]);
      
      if (donationId) {
        fetchDonationDetails();
      }
    };

    initializeForm();
  }, [donationId]);

  useEffect(() => {
    if (selectedOrganization && purposes.length > 0) {
      // Filter purposes based on selected organization
      const filtered = purposes.filter(purpose => 
        purpose.organization === selectedOrganization
      );
      setFilteredPurposes(filtered);
      console.log('Organization changed to:', selectedOrganization);
      console.log('Filtered purposes:', filtered);
    }
  }, [selectedOrganization, purposes]);

  // Add this debug effect near other useEffect hooks
  useEffect(() => {
    const subscription = watch((value) => {
      console.log('Form values changed:', value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const fetchDonors = async () => {
    const { data, error } = await supabase
      .from("donors")
      .select("*")  // Select all fields to get both donor_name and institution_name
      .order("donor_name", { ascending: true });

    if (error) {
      console.error("Error fetching donors:", error);
      setError("Failed to fetch donors");
    } else {
      // Transform the data to include a display name
      const transformedData = data.map(donor => ({
        ...donor,
        display_name: donor.donor_type === 'Institution' ? donor.institution_name : donor.donor_name
      }));
      setDonors(transformedData);
      setFilteredDonors(transformedData);
    }
  };

  const fetchPurposes = async () => {
    try {
      const { data, error } = await supabase
        .from("purposes_dropdown")
        .select("*")
        .eq('status', true);

      if (error) throw error;
      
      setPurposes(data);
      
      // If organization is already selected, filter purposes immediately
      if (selectedOrganization) {
        const filtered = data.filter(p => p.organization === selectedOrganization);
        setFilteredPurposes(filtered);
      }
    } catch (error) {
      console.error("Error fetching purposes:", error);
      setError("Failed to fetch purposes");
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

  const fetchDonationDetails = async () => {
    try {
      const { data: donation, error } = await supabase
        .from('donations')
        .select('*')
        .eq('id', donationId)
        .single();

      if (error) throw error;

      // Fetch donor using donor_id (which is now donor_number)
      const { data: donorData, error: donorError } = await supabase
        .from('donors')
        .select('*')
        .eq('donor_number', donation.donor_id)
        .single();

      if (donorError) throw donorError;

      console.log('Fetched donor:', donorData);

      // Set organization first
      setValue('organization', donation.organization);
      
      // Filter purposes immediately
      const filtered = purposes.filter(p => p.organization === donation.organization);
      setFilteredPurposes(filtered);

      // Then set other form values
      reset({
        organization: donation.organization,
        donor: donorData.id.toString(), // Use donor's ID for the form
        date: new Date(donation.date),
        purposes: Array.isArray(donation.purpose) ? donation.purpose : [donation.purpose],
        paymentType: donation.payment_type,
        amount: donation.amount?.toString(),
        ...(donation.payment_type === 'Online' && {
          transactionNumber: donation.transaction_number?.toString()
        }),
        ...(donation.payment_type === 'Cheque' && {
          chequeNumber: donation.cheque_number?.toString()
        }),
        bankName: donation.bank_name || '',
      });

      setSelectedDonor(donorData);
      await fetchPurposes();

    } catch (error) {
      console.error('Error fetching donation:', error);
      setError('Failed to fetch donation details');
    }
  };

  const fetchBankAccounts = async (organizationName) => {
    if (!organizationName) return;
    
    try {
      const { data, error } = await supabase
        .from('bank_details')
        .select('*')
        .eq('organization', organizationName);

      if (error) throw error;
      setBankAccounts(data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  useEffect(() => {
    if (selectedOrganization) {
      fetchBankAccounts(selectedOrganization);
    }
  }, [selectedOrganization]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = donors.filter((donor) =>
      searchBy === "name"
        ? (donor.display_name || "").toLowerCase().includes(value.toLowerCase())
        : donor.donor_number.toString().includes(value)
    );
    setFilteredDonors(filtered);
  };

  const getDonorDisplayName = (donor) => {
    if (donor.donor_type === 'Institution') {
      return donor.institution_name || donor.donor_name;
    }
    return donor.donor_name;
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
      
      // Don't override amount if we're in edit mode
      if (!donationId) {
        if (data.category === 'Regular' && Array.isArray(data.purposes)) {
          setValue('amount', data.commitment?.toString() || '');
        } else {
          setValue('amount', '');
        }
      }

      // Update purposes
      const validPurposes = data.category === 'Regular' && Array.isArray(data.purposes)
        ? data.purposes.filter(purpose => 
            filteredPurposesForOrg.some(fp => fp.name === purpose)
          )
        : getValues('purposes');
      
      setValue('purposes', validPurposes);
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
      donor_id: selectedDonor.donor_number,
      donor_name: selectedDonor.donor_type === 'Institution' 
        ? selectedDonor.institution_name 
        : selectedDonor.donor_name,
      date: format(data.date, "yyyy-MM-dd"),
      payment_type: data.paymentType,
      amount: parseFloat(data.amount),
      receipt_no: lastReceiptNo,
      ...((['Online', 'GPay'].includes(data.paymentType) && data.transactionNumber) ? 
        { transaction_number: data.transactionNumber } : {}),
      ...(data.paymentType === 'Cheque' && data.chequeNumber ? 
        { cheque_number: Number(data.chequeNumber) } : {}),
      purpose: data.purposes,
      organization: data.organization,
      bank_name: ['Online', 'Cheque', 'GPay'].includes(data.paymentType) ? data.bankName : null,
    };

    toast.promise(
      (async () => {
        let result;
        if (donationId) {
          // Update existing donation
          result = await supabase
            .from('donations')
            .update(donationData)
            .eq('id', donationId);
        } else {
          // Insert new donation
          result = await supabase
            .from('donations')
            .insert(donationData)
            .single();
        }

        if (result.error) throw result.error;

        reset();
        setIsSubmitting(false);
        return donationId ? "Donation updated successfully" : "Donation added successfully";
      })(),
      {
        loading: donationId ? "Updating donation..." : "Adding donation...",
        success: (message) => message,
        error: (error) => `Failed to ${donationId ? 'update' : 'add'} donation: ${error.message}`,
      }
    ).then(() => {
      router.push('/donations');
    });
  };

  const renderBankAccountField = () => {
    if (['Online', 'Cheque', 'GPay'].includes(paymentType)) {
      return (
        <div>
          <Label htmlFor="bankName">Bank Account</Label>
          <Controller
            name="bankName"
            control={control}
            rules={{ required: "Bank account is required" }}
            render={({ field }) => (
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bank Account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem 
                      key={account.id} 
                      value={account.bank_name}
                    >
                      {`${account.bank_name} - ${account.account_number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.bankName && (
            <p className="text-red-500">{errors.bankName.message}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <Toaster position="top-center" reverseOrder={false} />
      <CardHeader>
        <div className="w-full flex justify-between items-center">
          <CardTitle className="text-2xl">{donationId ? 'Edit' : 'Add'} Donation</CardTitle>
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
                      const filtered = purposes.filter(p => p.organization === value);
                      console.log('Filtered purposes for org:', value, filtered);
                      setFilteredPurposes(filtered);
                    }} 
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.value} value={org.value}>
                          {org.label}
                        </SelectItem>
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
                        console.log('Selected donor:', value);
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
                              ? donor.display_name
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
                      console.log('Selected purposes:', selected);
                      field.onChange(selected);
                    }}
                    placeholder={
                      !selectedOrganization 
                        ? "Please select an organization first"
                        : filteredPurposes.length === 0 
                          ? "No purposes found for this organization" 
                          : "Select Purposes"
                    }
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
                    <SelectItem value="GPay">GPay</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.paymentType && (
              <p className="text-red-500">{errors.paymentType.message}</p>
            )}
          </div>

          {renderBankAccountField()}

          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input id="amount" type="number" {...register("amount", { required: "Amount is required" })} />
            {errors.amount && <p className="text-red-500">{errors.amount.message}</p>}
          </div>

          {(paymentType === "Online" || paymentType === "GPay") && (
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