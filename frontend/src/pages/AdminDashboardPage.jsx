import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AdminBookingsView from '../components/admin/views/AdminBookingsView';
import AdminDashboardView from '../components/admin/views/AdminDashboardView';
import AdminGuidesView from '../components/admin/views/AdminGuidesView';
import AdminHotelsView from '../components/admin/views/AdminHotelsView';
import AdminCruisesView from '../components/admin/views/AdminCruisesView';
import AdminLoginView from '../components/admin/views/AdminLoginView';
import AdminPackagesView from '../components/admin/views/AdminPackagesView';
import AdminPaymentsView from '../components/admin/views/AdminPaymentsView';
import AdminReportsView from '../components/admin/views/AdminReportsView';
import AdminTravelersView from '../components/admin/views/AdminTravelersView';
import AdminTravelOrdersView from '../components/admin/views/AdminTravelOrdersView';
import AdminContactInquiriesView from '../components/admin/views/AdminContactInquiriesView';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';

export default function AdminDashboardPage({ onExitAdmin, onAuthSuccess }) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const { user, isAuthenticated } = useAuthStore();
  const { fetchAdminData } = useAdminStore();
  const canAccessAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'receptionist');

  useEffect(() => {
    if (canAccessAdmin) fetchAdminData({ includeAdminOnly: user?.role === 'admin' });
  }, [canAccessAdmin, fetchAdminData, user?.role]);

  if (!canAccessAdmin) {
    return (
      <AdminLoginView
        onLoginSuccess={(targetRole) => {
          if (targetRole === 'user') {
            if (onExitAdmin) onExitAdmin();
          } else {
            onAuthSuccess?.();
          }
        }}
      />
    );
  }

  return (
    <AdminLayout
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      onLogout={() => onExitAdmin?.()}
    >
      {activeNav === 'dashboard' && <AdminDashboardView onNavigate={(nav) => setActiveNav(nav)} />}
      {activeNav === 'bookings' && <AdminBookingsView />}
      {activeNav === 'travel-orders' && <AdminTravelOrdersView />}
      {activeNav === 'packages' && <AdminPackagesView />}
      {activeNav === 'travelers' && <AdminTravelersView />}
      {activeNav === 'guides' && <AdminGuidesView />}
      {activeNav === 'hotels' && <AdminHotelsView />}
      {activeNav === 'cruises' && <AdminCruisesView />}
      {activeNav === 'payments' && <AdminPaymentsView />}
      {activeNav === 'reports' && <AdminReportsView />}
      {activeNav === 'contacts' && <AdminContactInquiriesView />}
    </AdminLayout>
  );
}
