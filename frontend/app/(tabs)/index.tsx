import { useAuthStore } from '../../src/store/authStore';
import RequestsListScreen from '../../src/screens/customer/RequestsListScreen';
import MechanicDashboardScreen from '../../src/screens/mechanic/MechanicDashboardScreen';
import AdminDashboardScreen from '../../src/screens/admin/AdminDashboardScreen';

export default function HomeTab() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'mechanic') return <MechanicDashboardScreen />;
  if (role === 'admin') return <AdminDashboardScreen />;
  return <RequestsListScreen />;
}
