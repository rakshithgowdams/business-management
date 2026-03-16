import { Navigate } from 'react-router-dom';
import { useTeamAuth } from '../context/TeamAuthContext';
import { getFirstAllowedRoute } from '../lib/team/permissions';
import { ShieldX } from 'lucide-react';

interface Props {
  permissionKey: string;
  basePath: string;
  children: React.ReactNode;
}

export default function PermissionGate({ permissionKey, basePath, children }: Props) {
  const { member, hasPermission } = useTeamAuth();

  if (!member) return null;

  if (hasPermission(permissionKey)) {
    return <>{children}</>;
  }

  const firstRoute = getFirstAllowedRoute(member.permissions);

  if (firstRoute && firstRoute !== '/dashboard') {
    return <Navigate to={`${basePath}${firstRoute.replace('/dashboard', '')}`} replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-1">Access Restricted</h2>
      <p className="text-sm text-gray-500 max-w-sm text-center">
        You don't have permission to access this section. Contact your administrator for access.
      </p>
    </div>
  );
}
