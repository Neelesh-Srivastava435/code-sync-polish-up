import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/reduxHooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Activity, Building, BookOpen, Users, User, FileText, LogOut, Settings, Package, Calendar } from 'lucide-react';

// Logo component
const Logo: React.FC = () => (
  <div className="p-6 flex items-center justify-center">
    <img 
      src="/lovable-uploads/901fc38c-b6e4-4c87-a6ed-c27faeb388f7.png" 
      alt="Young Achievers" 
      className="w-40 h-auto"
    />
  </div>
);

// Menu item component
interface MenuItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ to, icon: Icon, label, badge }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive 
          ? 'text-brand-purple bg-purple-50 font-medium' 
          : 'text-gray-700 hover:bg-gray-100'
      }`
    }
  >
    <span className="flex items-center gap-3">
      <Icon size={20} />
      <span>{label}</span>
    </span>
    {badge && (
      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
        {badge}
      </span>
    )}
  </NavLink>
);

// Settings submenu component
const SettingsSubmenu: React.FC = () => {
  const settingsRoutes = [
    { path: '/settings/amenities', label: 'Amenities' },
    { path: '/settings/programs', label: 'Programs' },
    { path: '/settings/assets', label: 'Fixed Assets' },
  ];

  return (
    <div className="ml-9 mt-1 space-y-1">
      {settingsRoutes.map((route) => (
        <NavLink
          key={route.path}
          to={route.path}
          className={({ isActive }) =>
            `block px-4 py-2 text-sm rounded-lg transition-colors ${
              isActive
                ? 'text-brand-purple bg-purple-50 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          {route.label}
        </NavLink>
      ))}
    </div>
  );
};

// Sidebar component
const Sidebar: React.FC = () => {
  const [settingsExpanded, setSettingsExpanded] = React.useState(false);
  const {signOut} = useAuth();
  const { canViewUsers, canViewVenues, canViewBatches } = usePermissions();

  // Check if the current route is a settings route
  const isSettingsRoute = () => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith('/settings');
    }
    return false;
  };

  // Set settings expanded if on a settings route
  React.useEffect(() => {
    if (isSettingsRoute()) {
      setSettingsExpanded(true);
    }
  }, []);

  return (
    <div className="h-full w-64 bg-[#FBFBFE] flex flex-col shadow-lg animate-slide-in">
      <Logo />
      
      <div className="p-4 border-t border-gray-200">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Admin Dashboard
        </p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        <MenuItem to="/dashboard" icon={Activity} label="Admin Dashboard" />
        
        {canViewUsers() && (
          <MenuItem to="/users" icon={Users} label="User Management" />
        )}
        
        {canViewVenues() && (
          <MenuItem to="/venues" icon={Building} label="Venue Management" />
        )}
        
        {canViewBatches() && (
          <MenuItem to="/batches" icon={BookOpen} label="Batch Management" />
        )}
        
        <MenuItem to="/partners" icon={FileText} label="Partner Management" />
        <MenuItem to="/members" icon={Users} label="Member Management" />
        <MenuItem 
          to="/students-teachers" 
          icon={Calendar} 
          label="Attendance" 
          badge="New" 
        />
        <MenuItem to="/activity-logs" icon={Activity} label="Activity Logs" />
        <MenuItem to="/profile" icon={User} label="Profile" />
        
        {/* Settings with submenu */}
        <div>
          <button
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg transition-colors ${
              isSettingsRoute()
                ? 'text-brand-purple bg-purple-50 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings size={20} />
              <span>Settings</span>
            </div>
            <span className="text-xs">{settingsExpanded ? '▼' : '▶'}</span>
          </button>
          {settingsExpanded && <SettingsSubmenu />}
        </div>
      </nav>
      
      <div className="p-4 mt-auto border-t border-gray-200">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        onClick={signOut}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
