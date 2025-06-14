
import React from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';

const VenueManagement: React.FC = () => {
  return (
    <PermissionWrapper module="venues" action="view">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
          Venue Management
        </h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
          <p className="text-gray-600">Venue management functionality will be implemented here.</p>
        </div>
      </div>
    </PermissionWrapper>
  );
};

export default VenueManagement;
