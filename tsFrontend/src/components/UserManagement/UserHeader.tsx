
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

interface UserHeaderProps {
  title: string;
}

const UserHeader: React.FC<UserHeaderProps> = ({ title }) => {
  const { canCreateUsers } = usePermissions();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight animate-fade-in">
        {title}
      </h1>
      
      {canCreateUsers() && (
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 justify-center"
          >
            <Upload size={16} />
            <span className="text-sm">Import Users</span>
          </Button>
          
          <Button 
            asChild
            className="flex items-center gap-2 justify-center"
          >
            <Link to="/users/new">
              <Plus size={16} />
              <span className="text-sm">Add New User</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserHeader;
