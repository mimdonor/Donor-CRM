"use client";
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { useRouter } from 'next/navigation';
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from "@/components/ui/multi-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Country, State, City } from 'country-state-city';
import { toast, Toaster } from 'react-hot-toast';

const donorTypes = [
  { id: 1, name: 'Individual' },
  { id: 2, name: 'Institution' }
];

const categories = [
  { id: 1, name: 'Regular' },
  { id: 2, name: 'Occasional' }
];

const RequiredLabel = ({ htmlFor, children }) => (
  <Label htmlFor={htmlFor}>
    {children} <span className="text-red-500">*</span>
  </Label>
);

export default function AddDonor({ donorId }) {
  const { register, handleSubmit, control, watch, formState: { errors }, reset, setValue, getValues } = useForm();
  const [dropdownOptions, setDropdownOptions] = useState({
    donorSources: [],
    representatives: [],
    donorZones: [],
    purposes: [],
  });
  const router = useRouter();
  const isEditing = !!donorId;
  const watchDonorType = watch("donorType");
  const watchCategory = watch("category");
  const [lastDonorId, setLastDonorId] = useState('G00');
  const [donorNumber, setDonorNumber] = useState('')
  const [isDropdownsLoaded, setIsDropdownsLoaded] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salutations, setSalutations] = useState([]);

  useEffect(() => {
    fetchDropdownOptions();
    fetchSalutations();
    fetchLastDonorId();
  }, []);

  useEffect(() => {
    if (isEditing && isDropdownsLoaded) {
      fetchDonorData();
    }
  }, [isEditing, isDropdownsLoaded]);

  const fetchDropdownOptions = async () => {
    const tables = [
      'donorsource_dropdown',
      'donorzone_dropdown',
      'representatives_dropdown',
      'purposes_dropdown',
    ];

    const options = {};

    for (const table of tables) {
      let query = supabase.from(table).select('name, status').eq('status', true);
      
      // Add state and district fields only for donorzone_dropdown
      if (table === 'donorzone_dropdown') {
        query = query.select('name, status, state, district');
      }
      
      // Add organization field for purposes_dropdown
      if (table === 'purposes_dropdown') {
        query = query.select('name, status, organization');
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching ${table}:`, error);
      } else {
        options[table] = data;
      }
    }

    setDropdownOptions({
      donorSources: options.donorsource_dropdown || [],
      representatives: options.representatives_dropdown || [],
      donorZones: options.donorzone_dropdown || [],
      purposes: options.purposes_dropdown || [],
    });
    setIsDropdownsLoaded(true);
  };

  const fetchSalutations = async () => {
    const { data, error } = await supabase
      .from('salutation_dropdown')
      .select('name')
      .eq('status', true)
      .order('name');

    if (error) {
      console.error('Error fetching salutations:', error);
    } else {
      setSalutations(data || []);
    }
  };

  const fetchLastDonorId = async () => {
    const { data, error } = await supabase
      .from('donors')
      .select('donor_number')
      .order('id', { ascending: false })
      .limit(1);
  
    if (error) {
      console.error('Error fetching last donor ID:', error);
    } else if (data && data.length > 0) {
      const lastId = data[0].donor_number;
  
      // Extract the numeric part of the last ID
      const numericPart = parseInt(lastId.slice(1), 10);
  
      // Increment the numeric part
      const newNumericPart = numericPart + 1;
  
      // Generate the new ID without padding
      const newId = 'G' + newNumericPart;
  
      console.log('New donor ID:', newId);
      setLastDonorId(newId);
    } else {
      // If there are no donors, start from G00
      const newId = 'G00';
      console.log('No donors found, starting from G00');
      setLastDonorId(newId);
    }
  };

  const fetchDonorData = async () => {
    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .eq('id', donorId)
      .single();

    if (error) {
      console.error('Error fetching donor data:', error);
    } else {
      setDonorNumber(data.donor_number);
      console.log('Fetched donor data:', data);

      // Split the donor name correctly
      const nameParts = data.donor_name.split(' ');
      const salutation = nameParts[0];  // First part is salutation
      const firstName = nameParts[1];    // Second part is first name
      const lastName = nameParts.slice(2).join(' ');  // Rest is last name

      const formData = {
        donorNumber: data.donor_number,
        salutation: salutation,
        firstName: firstName,
        lastName: lastName,
        institutionName: data.institution_name,
        phone: data.phone,
        streetName: data.street_name,
        areaName: data.area_name,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        donorSource: data.donor_source,
        representative: data.representative,
        donorZone: data.donor_zone,
        donorType: data.donor_type,
        category: data.category,
        purposes: Array.isArray(data.purposes) ? data.purposes : data.purposes ? data.purposes.slice(1, -1).split(',') : [],
        commitment: data.commitment,
        panNumber: data.pan_number,
        isMagazineSubscribed: data.is_magazine_subscribed,
        contactPersonTitle: data.contact_person?.split(' ')[0] || '',
        contactPersonName: data.contact_person?.split(' ').slice(1).join(' ') || '',
      };

      console.log('Form data to be set:', formData);

      reset(formData);

      // Set selected country, state, and city
      const country = Country.getAllCountries().find(c => c.name === data.country);
      const state = State.getStatesOfCountry(country?.isoCode).find(s => s.name === data.state);
      const city = City.getCitiesOfState(country?.isoCode, state?.isoCode).find(c => c.name === data.city);

      setSelectedCountry(country);
      setSelectedState(state);
      setSelectedCity(city);

      // Force update of controlled inputs
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value) {
          setValue(key, value, { shouldValidate: true });
        }
      });

      console.log('Current form values:', getValues());
    }
  };

  const handleCountryChange = (countryCode) => {
    const country = Country.getCountryByCode(countryCode);
    if (country) {
      setSelectedCountry(country);
      setSelectedState(null);
      setSelectedCity(null);
      setValue('country', country.name, { shouldValidate: true });
    }
  };

  const handleStateChange = (stateCode) => {
    const state = State.getStateByCodeAndCountry(stateCode, selectedCountry.isoCode);
    if (state) {
      setSelectedState(state);
      setSelectedCity(null);
      setValue('state', state.name, { shouldValidate: true });
    }
  };

  const handleCityChange = (cityName) => {
    const city = City.getAllCities().find(c => c.name === cityName && c.stateCode === selectedState.isoCode && c.countryCode === selectedCountry.isoCode);
    setSelectedCity(city);
    setValue('city', city.name, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const selectedZone = dropdownOptions.donorZones.find(zone => zone.name === data.donorZone);
    const donorData = {
      donor_number: donorId ? donorNumber : lastDonorId,
      donor_name: watchDonorType === 'Institution' 
        ? data.institutionName 
        : `${data.salutation} ${data.firstName} ${data.lastName}`.trim(),
      institution_name: data.donorType === 'Institution' ? data.institutionName : '',
      phone: data.phone,
      street_name: data.streetName,
      area_name: data.areaName,
      landmark: data.landmark,
      city: selectedCity?.name || data.city, // Use existing city if no new selection
      state: selectedState?.name || data.state, // Use existing state if no new selection
      country: selectedCountry.name,
      pincode: Number(data.pincode),
      donor_source: data.donorSource,
      representative: data.representative,
      donor_zone: data.donorZone,
      donor_zone_state: selectedZone?.state,
      donor_zone_district: selectedZone?.district,
      donor_type: data.donorType,
      category: data.category,
      purposes: data.purposes ? `{${data.purposes.join(',')}}` : null, // Format as Postgres array
      commitment: data.commitment ? parseFloat(data.commitment) : null,
      pan_number: data.panNumber,
      is_magazine_subscribed: data.isMagazineSubscribed || false,
      salutation: data.salutation, // Add salutation field
    };

    // Concatenate contact person title and name for institutions
    if (data.donorType === 'Institution') {
      donorData.contact_person = `${data.contactPersonTitle} ${data.contactPersonName}`.trim();
    }

    toast.promise(
      (async () => {
        let result;
        if (isEditing) {
          result = await supabase
            .from('donors')
            .update(donorData)
            .eq('id', donorId);
        } else {
          result = await supabase
            .from('donors')
            .insert([donorData])
            .select();
        }

        if (result.error) {
          throw new Error(result.error.message);
        }

        reset();
        setIsSubmitting(false);
        return isEditing ? "Donor updated successfully" : "Donor added successfully";
      })(),
      {
        loading: isEditing ? "Updating donor..." : "Adding donor...",
        success: (message) => message,
        error: (error) => `Failed to ${isEditing ? 'update' : 'add'} donor: ${error.message}`,
      }
    ).then(() => {
      router.push('/donors');
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-gray-300 border-2">
      <Toaster position="top-center" reverseOrder={false} />
      <CardHeader className="flex flex-row justify-between items-center">
        <div className="w-full flex justify-between items-center">
          <CardTitle className="text-2xl md:text-3xl">{isEditing ? 'Edit Donor' : 'Add Donor'}</CardTitle>
          {!isEditing && 
          <p className="flex gap-2 items-center text-sm text-gray-500">Donor ID -
            <span className="bg-[#F3E6D5] text-[#6C665F] text-sm px-2 py-1 rounded-md">{lastDonorId}</span></p>}
        {isEditing && <p className="flex gap-2 items-center text-sm text-gray-500">Donor ID - <span className="bg-[#F3E6D5] text-[#6C665F] text-sm px-2 py-1 rounded-md">{donorNumber}</span></p>}
        </div>
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="category">Category</RequiredLabel>
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                </div>
                {watchCategory === 'Regular' && (
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="purposes">Purposes</RequiredLabel>
                    <Controller
                      name="purposes"
                      control={control}
                      rules={{ required: "At least one purpose is required" }}
                      render={({ field }) => (
                        <MultiSelect
                          options={dropdownOptions.purposes.map(p => ({ 
                            value: p.name, 
                            label: p.name,
                            organization: p.organization 
                          }))}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder="Select Purposes"
                        />
                      )}
                    />
                    {errors.purposes && <p className="text-red-500 text-sm">{errors.purposes.message}</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <RequiredLabel htmlFor="donorType">Donor Type</RequiredLabel>
                  <Controller
                    name="donorType"
                    control={control}
                    rules={{ required: "Donor Type is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Donor Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {donorTypes.map((type) => (
                            <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.donorType && <p className="text-red-500 text-sm">{errors.donorType.message}</p>}
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="donorSource">Donor Source</RequiredLabel>
                  <Controller
                    name="donorSource"
                    control={control}
                    rules={{ required: "Donor Source is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Donor Source" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownOptions.donorSources.map((source) => (
                            <SelectItem key={source.name} value={source.name}>{source.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.donorSource && <p className="text-red-500 text-sm">{errors.donorSource.message}</p>}
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="representative">In charge / Representative</RequiredLabel>
                  <Controller
                    name="representative"
                    control={control}
                    rules={{ required: "Representative is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Representative" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownOptions.representatives.map((rep) => (
                            <SelectItem key={rep.name} value={rep.name}>{rep.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.representative && <p className="text-red-500 text-sm">{errors.representative.message}</p>}
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="donorZone">Donor Zone</RequiredLabel>
                  <Controller
                    name="donorZone"
                    control={control}
                    rules={{ required: "Donor Zone is required" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Donor Zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropdownOptions.donorZones.map((zone) => (
                            <SelectItem key={zone.name} value={zone.name}>{zone.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.donorZone && <p className="text-red-500 text-sm">{errors.donorZone.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                {watchDonorType === 'Institution' ? 'Institution Information' : 'Personal Information'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchDonorType === 'Institution' ? (
                  <>
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="institutionName">Institution Name</RequiredLabel>
                      <Input id="institutionName" {...register("institutionName", { required: "Institution Name is required" })} />
                      {errors.institutionName && <p className="text-red-500 text-sm">{errors.institutionName.message}</p>}
                    </div>
                    <div className="flex gap-4">
                      <div className="w-[100px] space-y-2">
                        <RequiredLabel htmlFor="contactPersonTitle">Title</RequiredLabel>
                        <Controller
                          name="contactPersonTitle"
                          control={control}
                          rules={{ required: "Required" }}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Title" />
                              </SelectTrigger>
                              <SelectContent>
                                {salutations.map((s) => (
                                  <SelectItem key={s.name} value={s.name}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.contactPersonTitle && <p className="text-red-500 text-sm">{errors.contactPersonTitle.message}</p>}
                      </div>
                      <div className="flex-1 space-y-2">
                        <RequiredLabel htmlFor="contactPersonName">Contact Person Name</RequiredLabel>
                        <Input id="contactPersonName" {...register("contactPersonName", { required: "Contact Person Name is required" })} />
                        {errors.contactPersonName && <p className="text-red-500 text-sm">{errors.contactPersonName.message}</p>}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-4">
                      <div className="w-[100px] space-y-2">
                        <RequiredLabel htmlFor="salutation">Title</RequiredLabel>
                        <Controller
                          name="salutation"
                          control={control}
                          rules={{ required: "Required" }}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Title" />
                              </SelectTrigger>
                              <SelectContent>
                                {salutations.map((s) => (
                                  <SelectItem key={s.name} value={s.name}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.salutation && (
                          <p className="text-red-500 text-sm">{errors.salutation.message}</p>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <RequiredLabel htmlFor="firstName">First Name</RequiredLabel>
                        <Input 
                          id="firstName" 
                          {...register("firstName", { required: "First Name is required" })} 
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm">{errors.firstName.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" {...register("lastName")} />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="phone">Phone Number</RequiredLabel>
                  <Controller
                    name="phone"
                    control={control}
                    rules={{ required: "Phone Number is required" }}
                    render={({ field }) => (
                      <PhoneInput
                        defaultCountry="in"
                        value={field.value}
                        onChange={(phone) => field.onChange(phone)}
                        className="w-full"
                        inputStyle={{
                          width: '100%',
                          height: '40px',
                          fontSize: '16px',
                          borderRadius: 'var(--radius)',
                          border: '1px solid hsl(var(--input))',
                          backgroundColor: 'hsl(var(--background))',
                          color: 'hsl(var(--foreground))',
                        }}
                        containerStyle={{
                          width: '100%',
                        }}
                        countrySelectorStyleProps={{
                          buttonStyle: {
                            border: '1px solid hsl(var(--input))',
                            borderRadius: 'var(--radius)',
                            height: '40px',
                            padding: '5px',
                            backgroundColor: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                          }
                        }}
                        dropdownStyleProps={{
                          style: {
                            backgroundColor: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                          }
                        }}
                      />
                    )}
                  />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="country">Country</RequiredLabel>
                  <Controller
                    name="country"
                    control={control}
                    rules={{ required: "Country is required" }}
                    render={({ field }) => (
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        handleCountryChange(value);
                      }} value={selectedCountry?.isoCode}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                          {Country.getAllCountries().map((country) => (
                            <SelectItem key={country.isoCode} value={country.isoCode}>{country.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.country && <p className="text-red-500 text-sm">{errors.country.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        handleStateChange(value);
                      }} value={selectedState?.isoCode} disabled={!selectedCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCountry && State.getStatesOfCountry(selectedCountry.isoCode).map((state) => (
                            <SelectItem key={state.isoCode} value={state.isoCode}>{state.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        handleCityChange(value);
                      }} value={selectedCity?.name} disabled={!selectedState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedState && City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode).map((city) => (
                            <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streetName">Street Name</Label>
                  <Input id="streetName" {...register("streetName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="areaName">Area Name</Label>
                  <Input id="areaName" {...register("areaName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark</Label>
                  <Input id="landmark" {...register("landmark")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" {...register("pincode")} />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <div className="grid items-center grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input id="panNumber" {...register("panNumber")} />
                </div>
                {watchCategory === 'Regular' && (
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="commitment">Commitment Amount (₹)</RequiredLabel>
                    <Input
                      id="commitment"
                      type="number"
                      {...register("commitment", { required: "Commitment amount is required" })}
                    />
                    {errors.commitment && <p className="text-red-500 text-sm">{errors.commitment.message}</p>}
                  </div>
                )}
                <div className="space-y-2 flex items-center md:col-span-2">
                  <div className="flex items-center space-x-2 h-10">
                    <Controller
                      name="isMagazineSubscribed"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="isMagazineSubscribed"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="w-5 h-5"
                        />
                      )}
                    />
                    <Label
                      htmlFor="isMagazineSubscribed"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Subscribe to Magazine
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]" disabled={isSubmitting}>{isEditing ? 'Update Donor' : 'Add Donor'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
