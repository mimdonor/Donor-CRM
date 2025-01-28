'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { useRouter } from 'next/navigation';
import { Separator } from "@/components/ui/separator";
import { Country, State, City } from 'country-state-city';
import Image from 'next/image';

const supabaseStorage = createClient("https://ctmihnkvxjdkkyryphvm.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bWlobmt2eGpka2t5cnlwaHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTczOTM4OSwiZXhwIjoyMDQ1MzE1Mzg5fQ.4vF0dsyyIfvmW0iMRm3spiAwAQ-NFrL0okXpzUVOaKA");

const roles = [
  'Promotional',
  'State co-ordinator',
  'Zonal Coordinator',
  'Regional coordinator',
  'Full Time',
  'Part Time',
  'Volunteer',
  'Office Staff',
  'Representative',
  'None'
];
 

const RequiredLabel = ({ htmlFor, children }) => (
  <Label htmlFor={htmlFor}>
    {children} <span className="text-red-500">*</span>
  </Label>
);

export default function Staffs() {
  const { register, handleSubmit, control, watch, formState: { errors }, reset, setValue, getValues } = useForm();
  const router = useRouter();
  const watchRole = watch("role");
  const [lastStaffId, setLastStaffId] = useState('MIM001');
  const [staffNumber, setStaffNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  useEffect(() => {
    fetchLastStaffId();
  }, []);

  const fetchLastStaffId = async () => {
    const { data, error } = await supabase
      .from('staffs')
      .select('staff_id')
      .order('staff_id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last staff ID:', error);
    } else if (data && data.length > 0) {
      const lastId = data[0].staff_id;
      const newId = 'MIM' + (parseInt(lastId.slice(3)) + 1).toString().padStart(3, '0');
      setLastStaffId(newId);
    } else {
      // If there are no staffs in the database, start from 1
      const newId = 'MIM001';
      setLastStaffId(newId);
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
    setSelectedCity(cityName);
    setValue('city', cityName, { shouldValidate: true });
  };

  const handleImageUpload = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${lastStaffId}.${fileExt}`;
    const {  error } = await supabaseStorage.storage
      .from('staffs')
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: url } = supabaseStorage.storage
      .from('staffs')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully:', url.publicUrl);
    setProfileImageUrl(url.publicUrl);
    return url.publicUrl;
  };

  const onSubmit = async (data) => {
    let profileUrl = profileImageUrl;

    if (profileImage) {
      profileUrl = await handleImageUpload(profileImage);
    }

    const staffData = {
      staff_id: lastStaffId,
      staff_name: data.staffName,
      email: data.email,
      role: data.role,
      gender: data.gender,
      designation: data.designation,
      door_number: data.doorNumber,
      street_name: data.streetName,
      area_name: data.areaName,
      country: selectedCountry.name,
      state: selectedState.name,
      pincode: Number(data.pincode),
      mobile_number: data.phone,
      profile_url: profileUrl,
    };

    const result = await supabase
      .from('staffs')
      .insert([staffData])
      .select();

    if (result.error) {
      console.error("Error adding staff", result.error);
    } else {
      console.log(result.data);

      if (data.role !== 'None') {
        const userData = {
          name: data.staffName,
          email: data.email,
          password: data.password,
          role: data.role,
        };

        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          console.error("Error adding user", await response.json());
        } else {
          console.log(await response.json());
        }
      }

    //   router.push('/settings/staffs');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-gray-300 border-2">
      <CardHeader className="flex flex-row justify-between items-center">
        <div className="w-full flex justify-between items-center">
          <CardTitle className="text-2xl md:text-3xl">Add Staff</CardTitle>
          <p className="flex gap-2 items-center text-sm text-gray-500">Staff ID -
            <span className="bg-[#F3E6D5] text-[#6C665F] text-sm px-2 py-1 rounded-md">{lastStaffId}</span></p>
        </div>
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-[#F3E6D5] text-[#6C665F] px-4 py-2 rounded-md mb-4">Staff Information</div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              {profileImageUrl ? (
                <Image src={profileImageUrl} alt="Profile" width={50} height={50} className="rounded-full" />
              ) : (
                <span className="text-gray-500"></span>
              )}
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setProfileImage(file);
                  setProfileImageUrl(URL.createObjectURL(file));
                }
              }}
              className="w-60"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="staffName">Staff Name</RequiredLabel>
              <Input id="staffName" {...register("staffName", { required: "Staff Name is required" })} />
              {errors.staffName && <p className="text-red-500 text-sm">{errors.staffName.message}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="gender">Gender</RequiredLabel>
              <Controller
                name="gender"
                control={control}
                rules={{ required: "Gender is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && <p className="text-red-500 text-sm">{errors.gender.message}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="designation">Designation</RequiredLabel>
              <Input id="designation" {...register("designation", { required: "Designation is required" })} />
              {errors.designation && <p className="text-red-500 text-sm">{errors.designation.message}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="role">Role</RequiredLabel>
              <Controller
                name="role"
                control={control}
                rules={{ required: "Role is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role, index) => (
                        <SelectItem key={index} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="email">Email ID</RequiredLabel>
              <Input id="email" type="email" {...register("email", { required: "Email ID is required" })} />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
            {watchRole !== 'None' && (
              <div className="space-y-2">
                <RequiredLabel htmlFor="password">Set Password</RequiredLabel>
                <Input id="password" type="password" {...register("password", { required: "Password is required" })} />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
              </div>
            )}
          </div>
          <div className="bg-[#F3E6D5] text-[#6C665F] px-4 py-2 rounded-md mb-4">Contact Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doorNumber">Door Number</Label>
              <Input id="doorNumber" {...register("doorNumber")} />
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
              <RequiredLabel htmlFor="state">State / Region</RequiredLabel>
              <Controller
                name="state"
                control={control}
                rules={{ required: "State is required" }}
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
              {errors.state && <p className="text-red-500 text-sm">{errors.state.message}</p>}
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="city">City</RequiredLabel>
              <Controller
                name="city"
                control={control}
                rules={{ required: "City is required" }}
                render={({ field }) => (
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    handleCityChange(value);
                  }} value={selectedCity} disabled={!selectedState}>
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
              {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" {...register("pincode")} />
            </div>
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
          </div>
          <Button type="submit" className="w-full bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]">Add Staff</Button>
        </form>
      </CardContent>
    </Card>
  );
}