
import { useAppSelector } from './reduxHooks/hooks';
import { PermissionValue } from '@/types/permission';

export const usePermissions = () => {
  const user = useAppSelector((state) => state.auth.user);

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export'): boolean => {
    if (!user || !user.permission?.permissions) {
      return false;
    }

    const modulePermissions = user.permission.permissions[module];
    if (!modulePermissions) {
      return false;
    }

    return modulePermissions[action] === true;
  };

  const canViewUsers = () => hasPermission('users', 'view');
  const canCreateUsers = () => hasPermission('users', 'create');
  const canEditUsers = () => hasPermission('users', 'edit');
  const canDeleteUsers = () => hasPermission('users', 'delete');

  const canViewVenues = () => hasPermission('venues', 'view');
  const canCreateVenues = () => hasPermission('venues', 'create');
  const canEditVenues = () => hasPermission('venues', 'edit');
  const canDeleteVenues = () => hasPermission('venues', 'delete');

  const canViewBatches = () => hasPermission('batches', 'view');
  const canCreateBatches = () => hasPermission('batches', 'create');
  const canEditBatches = () => hasPermission('batches', 'edit');
  const canDeleteBatches = () => hasPermission('batches', 'delete');

  return {
    hasPermission,
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canViewVenues,
    canCreateVenues,
    canEditVenues,
    canDeleteVenues,
    canViewBatches,
    canCreateBatches,
    canEditBatches,
    canDeleteBatches,
  };
};
