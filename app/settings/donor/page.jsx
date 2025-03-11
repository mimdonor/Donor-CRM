"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SettingsCard from "@/components/customComponents/SettingsCard";

const DonorSettings = () => {
  const settingsCategories = [
    { title: "Salutations", table: "salutation_dropdown" },
    { title: "Donor Source", table: "donorsource_dropdown" },
    { title: "Donor Zone", table: "donorzone_dropdown" },
    { title: "Representatives", table: "representatives_dropdown" }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Donor Settings</h1>
      <Separator className="mb-6" />
      <div className="grid grid-cols-1 md:w-1/2 w-full gap-6">
        {settingsCategories.map((category) => (
          <SettingsCard key={category.table} title={category.title} table={category.table} />
        ))}
      </div>
    </div>
  );
};

export default DonorSettings;