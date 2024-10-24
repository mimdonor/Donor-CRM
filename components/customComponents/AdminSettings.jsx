"use client";
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { Country, State, City } from 'country-state-city';

const supabaseStorage = createClient("https://ctmihnkvxjdkkyryphvm.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bWlobmt2eGpka2t5cnlwaHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTczOTM4OSwiZXhwIjoyMDQ1MzE1Mzg5fQ.4vF0dsyyIfvmW0iMRm3spiAwAQ-NFrL0okXpzUVOaKA");

const AdminSettings = () => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { register, handleSubmit, control, setValue, watch, reset } = useForm();

  const watchCountry = watch('country');
  const watchState = watch('state');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      handleOrgChange(organizations[0].id);
    }
  }, [organizations]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*');
      
      if (error) throw error;
      setOrganizations(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Failed to fetch organizations');
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const updates = {
        name: data.name,
        institution_no: data.institutionNo,
        street_name: data.streetName,
        area_name: data.areaName,
        city: data.city,
        pincode: data.pincode,
        country: data.country,
        state: data.state,
        email: data.email,
        phone: data.phone,
      };

      if (data.logo && data.logo[0]) {
        const file = data.logo[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${data.name}.${fileExt}`;
        const { error: uploadError } = await supabaseStorage.storage
          .from('organization-images')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseStorage.storage
          .from('organization-images')
          .getPublicUrl(fileName);

        updates.image_url = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('organization_settings')
        .update(updates)
        .eq('id', selectedOrg.id);

      if (updateError) throw updateError;

      await fetchOrganizations();
      setLoading(false);
    } catch (error) {
      console.error('Error updating organization:', error);
      setError('Failed to update organization');
      setLoading(false);
    }
  };

  const handleOrgChange = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    setSelectedOrg(org);
    reset({
      name: org.name,
      institutionNo: org.institution_no,
      streetName: org.street_name,
      areaName: org.area_name,
      city: org.city,
      pincode: org.pincode,
      country: org.country,
      state: org.state,
      email: org.email,
      phone: org.phone,
    });
  };

  // if (loading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error}</div>;

  return (
    <Card className="w-full max-w-4xl mx-auto mt-4">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-2xl">Organization Settings</CardTitle>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">Choose org</span>
          <Select onValueChange={handleOrgChange} value={selectedOrg?.id}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent>
        {selectedOrg && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-[#F3E6D5] text-[#6C665F] px-4 py-2 rounded-md mb-4">
              Organization Information
            </div>
            <div className="flex items-center space-x-4 mb-4">
              {selectedOrg.image_url && (
                <Image
                  src={selectedOrg.image_url}
                  alt="Organization logo"
                  width={50}
                  height={50}
                  className="rounded-md"
                />
              )}
              <Label htmlFor="logo">Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                {...register("logo")}
                className="w-auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" {...register("name")} />
            </div>

            <div className="bg-[#F3E6D5] text-[#6C665F] px-4 py-2 rounded-md mb-4">
              Contact Information
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="institutionNo">Institution No</Label>
                <Input id="institutionNo" {...register("institutionNo")} />
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
                <Label htmlFor="country">Country</Label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Country.getAllCountries().map((country) => (
                          <SelectItem key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State / Region</Label>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {State.getStatesOfCountry(watchCountry).map((state) => (
                          <SelectItem key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        {City.getCitiesOfState(watchCountry, watchState).map((city) => (
                          <SelectItem key={city.name} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" {...register("pincode")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      defaultCountry="in"
                      value={field.value}
                      onChange={(phone) => field.onChange(phone)}
                      inputStyle={{
                        width: '100%',
                        height: '40px',
                        fontSize: '16px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid hsl(var(--input))',
                        backgroundColor: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644]">
                Update
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSettings;