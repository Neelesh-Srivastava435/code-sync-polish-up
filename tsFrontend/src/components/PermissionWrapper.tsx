
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionDenied from './PermissionDenied';

interface PermissionWrapperProps {
  children: React.ReactNode;
  module: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'export';
  fallback?: React.ReactNode;
  showDenied?: boolean;
}

const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  module,
  action,
  fallback = null,
  showDenied = true
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(module, action)) {
    if (showDenied) {
      return <PermissionDenied action={action} module={module} />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionWrapper;
