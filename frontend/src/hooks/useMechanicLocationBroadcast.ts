import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { mechanicApi } from '../services/api';
import { useSocketStore } from '../store/socketStore';
import { JobStatus } from '../types';

const BROADCAST_STATUSES: JobStatus[] = ['en_route', 'arrived'];
const INTERVAL_MS = 8000;

export const useMechanicLocationBroadcast = (jobStatus: JobStatus | undefined) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!jobStatus || !BROADCAST_STATUSES.includes(jobStatus)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const broadcast = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await mechanicApi.updateLocation(loc.coords.latitude, loc.coords.longitude);
      } catch {
        // Silently ignore — don't interrupt the mechanic's workflow
      }
    };

    broadcast();
    intervalRef.current = setInterval(broadcast, INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobStatus, socket]);
};
