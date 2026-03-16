import { Navigate } from 'react-router-dom';
import { useTeamAuth } from '../context/TeamAuthContext';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  requiredRole: 'employee' | 'management';
}

export default function TeamProtectedRoute({ children, requiredRole }: Props) {
  const { member, loading } = useTeamAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!member) {
    return <Navigate to={`/${requiredRole === 'management' ? 'management' : 'employee'}`} replace />;
  }

  if (member.role !== requiredRole) {
    return <Navigate to={`/${member.role === 'management' ? 'management' : 'employee'}`} replace />;
  }

  return <>{children}</>;
}
