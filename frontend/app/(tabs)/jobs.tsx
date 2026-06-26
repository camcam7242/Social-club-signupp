import { useAuthStore } from '../../src/store/authStore';
import ActiveJobScreen from '../../src/screens/mechanic/ActiveJobScreen';
import MechanicJobsScreen from '../../src/screens/mechanic/MechanicJobsScreen';

export default function JobsTab() {
  // Show open requests (to quote) and active jobs in a combined view
  // For now default to active jobs; open requests are in the dashboard
  return <ActiveJobScreen />;
}
