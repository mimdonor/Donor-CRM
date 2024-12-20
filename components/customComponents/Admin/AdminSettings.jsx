'use client'
import { useState } from 'react';
import OrganizationSettings from './OrganizationSettings.jsx';
import BankDetails from './BankDetails.jsx';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'bank', label: 'Bank Details' }
  ];

  return (
    <div className="w-full">
      {/* Tabs Header */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Settings tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'general' && <OrganizationSettings />}
        {activeTab === 'bank' && <BankDetails />}
      </div>
    </div>
  );
};

export default AdminSettings;
