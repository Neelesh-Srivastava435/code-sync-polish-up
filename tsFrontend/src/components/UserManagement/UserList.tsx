import React, { useState, useRef, useEffect } from 'react';
import { Search, MoreHorizontal, Edit, Key, Mail, Power, Check, X, MapPin } from 'lucide-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { useNavigate } from 'react-router-dom';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks/hooks';
import { fetchUsers, deleteUser, toggleUserStatus, clearError } from '@/store/user/userSlice';
import { useToast } from '@/hooks/use-toast';
import { UserData } from '@/types/user';
import ResetPasswordDialog from './ResetPasswordDialog';
import { formatBackendError } from '@/utils/errorHandling';
import { usePermissions } from '@/hooks/usePermissions';

// Sample data for initial state with permissions and address
// const initialUsers: User[] = [
//   { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '+1 (555) 123-4567', address: '123 Main St, New York, NY 10001', role: 'Admin', permissions: ['Read', 'Write', 'Delete', 'Export'], status: 'Active' },
//   { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1 (555) 987-6543', address: '456 Park Ave, Boston, MA 02108', role: 'Account Manager', permissions: ['Read', 'Write'], status: 'Active' },
//   { id: '3', name: 'Michael Johnson', email: 'michael.j@example.com', phone: '+1 (555) 234-5678', address: '789 Broadway, Chicago, IL 60601', role: 'Facility Manager', permissions: ['Read'], status: 'Pending' },
//   { id: '4', name: 'Sarah Williams', email: 'sarah.w@example.com', phone: '+1 (555) 345-6789', address: '321 Oak Street, San Francisco, CA 94101', role: 'Account Manager', permissions: ['Read', 'Write'], status: 'Inactive' },
//   { id: '5', name: 'David Brown', email: 'david.b@example.com', phone: '+1 (555) 456-7890', address: '555 Pine Road, Miami, FL 33101', role: 'Facility Manager', permissions: ['Read'], status: 'Active' },
//   { id: '6', name: 'Emily Davis', email: 'emily.d@example.com', phone: '+1 (555) 567-8901', address: '777 Maple Lane, Seattle, WA 98101', role: 'Admin', permissions: ['Read', 'Write', 'Delete', 'Export'], status: 'Active' },
//   { id: '7', name: 'Robert Miller', email: 'robert.m@example.com', phone: '+1 (555) 678-9012', address: '888 Cedar Blvd, Austin, TX 78701', role: 'Account Manager', permissions: ['Read', 'Write'], status: 'Pending' },
//   { id: '8', name: 'Jennifer Wilson', email: 'jennifer.w@example.com', phone: '+1 (555) 789-0123', address: '999 Elm Street, Denver, CO 80201', role: 'Facility Manager', permissions: ['Read'], status: 'Active' },
//   { id: '9', name: 'Thomas Moore', email: 'thomas.m@example.com', phone: '+1 (555) 890-1234', address: '111 Birch Avenue, Portland, OR 97201', role: 'Admin', permissions: ['Read', 'Write', 'Delete'], status: 'Inactive' },
//   { id: '10', name: 'Lisa Anderson', email: 'lisa.a@example.com', phone: '+1 (555) 901-2345', address: '222 Spruce Drive, Atlanta, GA 30301', role: 'Account Manager', permissions: ['Read'], status: 'Active' },
//   { id: '11', name: 'James Taylor', email: 'james.t@example.com', phone: '+1 (555) 012-3456', address: '333 Willow Circle, Nashville, TN 37201', role: 'Facility Manager', permissions: ['Read'], status: 'Active' },
//   { id: '12', name: 'Patricia White', email: 'patricia.w@example.com', phone: '+1 (555) 123-4567', address: '444 Aspen Court, Las Vegas, NV 89101', role: 'Admin', permissions: ['Read', 'Write', 'Delete', 'Export'], status: 'Pending' },
// ];

// Create a custom hook for handling user errors
const useUserError = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const error = useAppSelector((state) => state.users.error);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  return { error };
};

// Address component with tooltip for long addresses
const AddressDisplay: React.FC<{ address: string }> = ({ address }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 max-w-[180px] truncate">
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate text-sm">{address}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm max-w-xs">{address}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Role Badge component
const RoleBadge: React.FC<{ role: UserData['role'] }> = ({ role }) => {
  const badgeClass = {
    'Admin': 'badge-admin',
    'Account Manager': 'badge-faculty',
    'Facility Manager': 'badge-student',
  }[role];

  return (
    <span className={`badge ${badgeClass}`}>
      {role}
    </span>
  );
};

// Permission Badge component
const PermissionBadge: React.FC<{ permissions: string[] }> = ({ permissions }) => {
  if (permissions.length === 0) return <span className="text-sm text-gray-400">No permissions</span>;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-wrap gap-1 justify-center">
            {permissions.slice(0, 2).map((permission, index) => (
              <span key={index} className="badge badge-permission text-xs">
                {permission}
              </span>
            ))}
            {permissions.length > 2 && (
              <span className="badge badge-permission-more text-xs">
                +{permissions.length - 2}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            {permissions.join(', ')}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Status Badge component
const StatusBadge: React.FC<{ status: UserData['status'] }> = ({ status }) => {
  const config = {
    'Active': { class: 'badge-active', icon: Check },
    'Inactive': { class: 'badge-inactive', icon: X },
    'Pending': { class: 'badge-pending', icon: null },
  }[status];

  const Icon = config.icon;

  return (
    <span className={`badge ${config.class} flex items-center gap-1`}>
      {Icon && <Icon size={12} />}
      {status}
    </span>
  );
};

// Action Menu component with permission checks
interface ActionMenuProps {
  user: UserData;
  onEdit: (user: UserData) => void;
  onResetPassword: (user: UserData) => void;
  onSendEmail: (user: UserData) => void;
  onDeactivate: (user: UserData) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ 
  user, onEdit, onResetPassword, onSendEmail, onDeactivate 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { canEditUsers, canDeleteUsers } = usePermissions();

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = user.status === 'Active';

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal size={20} className="text-gray-500 mx-auto" />
      </button>
      
      {isOpen && (
        <div className="table-action-menu">
          <div className="py-1">
            {canEditUsers() && (
              <button 
                onClick={() => { onEdit(user); setIsOpen(false); }}
                className="table-action-item"
              >
                <Edit size={16} className="mr-2" />
                Edit
              </button>
            )}
            {canEditUsers() && (
              <button 
                onClick={() => { onResetPassword(user); setIsOpen(false); }}
                className="table-action-item"
              >
                <Key size={16} className="mr-2" />
                Reset Password
              </button>
            )}
            <button 
              onClick={() => { onSendEmail(user); setIsOpen(false); }}
              className="table-action-item"
            >
              <Mail size={16} className="mr-2" />
              Send Email
            </button>
            {canDeleteUsers() && (
              <button 
                onClick={() => { onDeactivate(user); setIsOpen(false); }}
                className={`table-action-item ${isActive ? 'table-action-item-destructive' : 'table-action-item-success'}`}
              >
                <Power size={16} className="mr-2" />
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Search component
interface SearchProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search users..."
        className="search-input"
        value={searchValue}
        onChange={handleChange}
      />
      {searchValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

// Main UserList component
const UserList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading } = useAppSelector((state) => state.users);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const usersPerPage = 10;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEditUsers, canDeleteUsers } = usePermissions();

  // Use the custom error handling hook
  useUserError();

  // Fetch users on component mount
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleEdit = (user: UserData) => {
    if (canEditUsers()) {
      navigate(`/users/edit/${user.id}`);
    } else {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit users.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = (user: UserData) => {
    setResetPasswordUser(user);
    setIsResetPasswordOpen(true);
  };

  const handleSendEmail = (user: UserData) => {
    console.log('Send email to:', user);
  };

  const handleDeactivate = async (user: UserData) => {
    if (!canDeleteUsers()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to modify user status.",
        variant: "destructive",
      });
      return;
    }

    const isActivating = user.status === 'Inactive';
    const actionWord = isActivating ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${actionWord} ${user.firstName} ${user.lastName}?`)) {
      try {
        await dispatch(toggleUserStatus(user.id!)).unwrap();
        toast({
          title: "Success",
          description: `User ${actionWord}d successfully.`,
        });
      } catch (error: any) {
        console.error(`Error ${actionWord}ing user:`, error);
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phone.toLowerCase().includes(searchLower) ||
      user.address.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      user.status.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SearchBar onSearch={handleSearch} />
      </div>
      
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Name</th>
                <th className="table-cell">Email</th>
                <th className="table-cell">Phone</th>
                <th className="table-cell">Address</th>
                <th className="table-cell">Role & Permissions</th>
                <th className="table-cell text-center">Status</th>
                <th className="table-cell text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-10">
                    <p className="text-gray-500">Loading users...</p>
                  </td>
                </tr>
              )}
              {!loading && currentUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-10">
                    <p className="text-gray-500 text-lg">No users found.</p>
                    {searchQuery && <p className="text-gray-400 text-sm">Try adjusting your search criteria.</p>}
                  </td>
                </tr>
              )}
              {!loading && currentUsers.map(user => (
                <tr key={user.id} className="table-row">
                  <td className="table-cell">{user.firstName} {user.lastName}</td>
                  <td className="table-cell">{user.email}</td>
                  <td className="table-cell">{user.phone}</td>
                  <td className="table-cell">
                    <AddressDisplay address={user.address} />
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col items-start gap-1">
                      <RoleBadge role={user.role} />
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex justify-center">
                      <StatusBadge status={user.status} />
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <ActionMenu
                      user={user}
                      onEdit={handleEdit}
                      onResetPassword={handleResetPassword}
                      onSendEmail={handleSendEmail}
                      onDeactivate={handleDeactivate}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              // Only show 5 page links with ellipsis for others
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink 
                      isActive={pageNumber === currentPage}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (
                (pageNumber === 2 && currentPage > 3) ||
                (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return <PaginationEllipsis key={pageNumber} />;
              }
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      <ResetPasswordDialog
        isOpen={isResetPasswordOpen}
        onClose={() => {
          setIsResetPasswordOpen(false);
          setResetPasswordUser(null);
        }}
        user={resetPasswordUser}
      />
    </div>
  );
};

export default UserList;
