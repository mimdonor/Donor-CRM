import React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const Settings = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <Separator className="mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/settings/donor">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Donor Settings</h2>
            <p className="text-gray-600">Manage donor sources, zones, representatives, and categories</p>
          </Card>
        </Link>
        <Link href="/settings/donations">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Donations Settings</h2>
            <p className="text-gray-600">Manage donation purposes and other donation-related settings</p>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Settings;