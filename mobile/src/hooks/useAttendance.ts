import { useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

const QUEUE_KEY = '@attendance_queue';

interface AntiCheat {
  deviceTime: number;
  timeSource: string;
  hasInternet: boolean;
  deviceId: string;
  gps: { lat: number, lng: number } | undefined;
}

interface QueuedAttendance {
  roomId: string;
  timestamp: number;
  antiCheat: AntiCheat;
}

interface AttendanceOptions {
  demoMode?: boolean;
}

export const useAttendance = (
  userId: string | undefined,
  deviceId: string | undefined,
  options: AttendanceOptions = {}
) => {
  const { demoMode = false } = options;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recordAttendanceMutation = useMutation(api.attendance.recordAttendance);

  const getQueue = async (): Promise<QueuedAttendance[]> => {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  };

  const saveQueue = async (queue: QueuedAttendance[]) => {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  };

  const addToQueue = async (item: QueuedAttendance) => {
    const queue = await getQueue();
    queue.push(item);
    await saveQueue(queue);
  };

  const processQueue = useCallback(async () => {
    if (demoMode) {
      await saveQueue([]);
      return;
    }

    const queue = await getQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued attendance records...`);
    const remaining: QueuedAttendance[] = [];

    for (const item of queue) {
      try {
        await recordAttendanceMutation({
          roomId: item.roomId as Id<"rooms">,
          timestamp: item.timestamp,
          method: "phone",
          antiCheat: item.antiCheat,
        });
      } catch (err) {
        console.warn("Failed to sync queued item, keeping in queue:", err);
        remaining.push(item);
      }
    }

    await saveQueue(remaining);
  }, [demoMode, recordAttendanceMutation]);

  const submitAttendance = async (roomId: string) => {
    if (!userId || !deviceId) throw new Error("Missing user or device information");

    setIsSubmitting(true);
    try {
      // 1. Biometric check
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify identity for attendance',
      });
      if (!auth.success) return { success: false, reason: 'biometric_failed' };

      if (demoMode) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, mode: 'demo' };
      }

      // 2. Location check
      let gps: { lat: number, lng: number } | undefined = undefined;
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        gps = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }

      const timestamp = Date.now();
      const antiCheat: AntiCheat = {
        deviceTime: timestamp,
        timeSource: 'ntp',
        hasInternet: true,
        deviceId: deviceId,
        gps,
      };

      // 3. Attempt online submission
      try {
        await recordAttendanceMutation({
          roomId: roomId as Id<"rooms">,
          timestamp,
          method: "phone",
          antiCheat: antiCheat,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, mode: 'online' };
      } catch (err) {
        // 4. Fallback to offline queue
        console.log("Online submission failed, queuing locally:", err);
        await addToQueue({
          roomId,
          timestamp,
          antiCheat: { ...antiCheat, hasInternet: false },
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return { success: true, mode: 'offline' };
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitAttendance,
    processQueue,
    isSubmitting,
  };
};
