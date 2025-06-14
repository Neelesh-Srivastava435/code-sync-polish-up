
import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PermissionDeniedProps {
  action?: string;
  module?: string;
}

const PermissionDenied: React.FC<PermissionDeniedProps> = ({ 
  action = "access", 
  module = "this page" 
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="flex justify-center">
          <div className="bg-red-100 p-4 rounded-full">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to {action} {module}. 
            Please contact your administrator to request access.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PermissionDenied;
