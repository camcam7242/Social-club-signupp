import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#1a56db' }}>
      {role === 'customer' && (
        <>
          <Tabs.Screen name="index" options={{ title: 'Requests', tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} /> }} />
          <Tabs.Screen name="new-request" options={{ title: 'New Request', tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={24} color={color} /> }} />
          <Tabs.Screen name="vehicles" options={{ title: 'Garage', tabBarIcon: ({ color }) => <Ionicons name="car" size={24} color={color} /> }} />
        </>
      )}
      {role === 'mechanic' && (
        <>
          <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="speedometer" size={24} color={color} /> }} />
          <Tabs.Screen name="jobs" options={{ title: 'Jobs', tabBarIcon: ({ color }) => <Ionicons name="briefcase" size={24} color={color} /> }} />
        </>
      )}
      {role === 'admin' && (
        <Tabs.Screen name="index" options={{ title: 'Admin', tabBarIcon: ({ color }) => <Ionicons name="shield" size={24} color={color} /> }} />
      )}
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> }} />
    </Tabs>
  );
}
