import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Initial session checking state - display refined loading skeleton to prevent redirect flicker
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-forest-800 text-sage-300 flex items-center justify-center animate-pulse mb-4 shadow-md">
          <UtensilsCrossed className="w-6 h-6 animate-spin text-sage-300" />
        </div>
        <div className="text-base font-bold text-forest-900">Verifying SharePlate Session...</div>
        <div className="text-xs text-stone-500 mt-1">Checking secure cryptographic credentials</div>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to login with location state
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role Authorization check: If roles are specified and user role not permitted
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-3xl border border-stone-200 shadow-card text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal-900">Access Restricted</h2>
        <p className="text-sm text-charcoal-600 max-w-md mx-auto">
          This portal section is restricted to <strong>{allowedRoles.join(' or ')}</strong> accounts. Your current profile role is <strong>{user.role}</strong>.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Navigate to={`/${user.role}/dashboard`} replace />
        </div>
      </div>
    );
  }

  return children;
}
