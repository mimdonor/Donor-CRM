"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SettingsCard from "@/components/customComponents/SettingsCard";

const DonationsSettings = () => {
  const settingsCategories = [
    { title: "Purpose", table: "purposes_dropdown", showOrganization: true },
    // Add more donation-related settings here if needed
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Donations Settings</h1>
      <Separator className="mb-6" />
      <div className="grid grid-cols-1 md:w-1/2 w-full gap-6">
        {settingsCategories.map((category) => (
          <SettingsCard key={category.table} title={category.title} table={category.table} showOrganization={category.showOrganization} />
        ))}
      </div>
    </div>
  );
};

export default DonationsSettings;