import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQuery, useConvexAuth, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserRole } from '../screens/LoginScreen';
import { Doc } from '../../convex/_generated/dataModel';
import { authCache } from '../lib/authCache';
import { getOrCreateDeviceId } from '../lib/deviceId';

export type RoomWithHomeroom = Doc<"rooms"> & { homeroomName?: string };

interface CachedProfile {
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
}

interface AppContextType {
  // Auth State
  userRole: UserRole | null;
  setUserRole: (role: UserRole | null) => void;
  isDemo: boolean;
  setIsDemo: (isDemo: boolean) => void;

  // Data State
  rooms: RoomWithHomeroom[] | undefined;
  devices: Doc<"devices">[] | undefined;
  recentLogs: {
    _id: string;
    userName: string;
    roomName: string;
    action: string;
    method: string;
    timestamp: number;
    result: string;
  }[] | undefined;
  userStats: { total: number, students: number, teachers: number, staff: number } | undefined;
  allUsers: Doc<"users">[] | undefined;
  viewer: Doc<"users"> | null | undefined;
  isAdminDataLoaded: boolean;

  // Student Specific
  studentStats: { currentStreak: number, weekAttended: number, weekTotal: number, overallPercent: number, status: string } | null | undefined;
  todaySessions: any[] | undefined;
  homeroomSchedule: any[] | undefined;
  activeSemester: any | null | undefined;

  // Device
  deviceId: string | null;

  // Loading State
  isAuthenticated: boolean;
  isLoading: boolean;
  // Optimistic auth state for instant UI
  isOptimisticAuth: boolean;
  // Cached profile for instant render
  cachedProfile: CachedProfile | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isOptimisticAuth, setIsOptimisticAuth] = useState(false);
  const [cachedProfile, setCachedProfile] = useState<CachedProfile | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [hasLinkedDevice, setHasLinkedDevice] = useState(false);

  const updateDeviceId = useMutation(api.users.updateDeviceId);

  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");

  // Strictly check roles
  const isAdmin = viewer !== undefined && viewer !== null && viewer.role === 'admin';
  const isStudent = viewer !== undefined && viewer !== null && viewer.role === 'student';

  // Global Sync for Data - Role Aware
  const rooms = useQuery(api.rooms.list, isAuthenticated ? {} : "skip");
  const recentLogs = useQuery(api.accessLogs.getRecent, isAuthenticated ? {} : "skip");
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = useQuery(api.sessions.getSessionsByDate, isAuthenticated ? { date: todayStr } : "skip");
  const activeSemester = useQuery(api.calendar.getActiveSemester, isAuthenticated ? {} : "skip");

  // Student Specific
  const studentStats = useQuery(api.accessLogs.getStudentStats, isStudent ? {} : "skip");
  const homeroomSchedule = useQuery(
    api.schedule.getHomeroomSchedule, 
    isStudent && viewer?.currentHomeroomId ? { homeroomId: viewer.currentHomeroomId } : "skip"
  );

  // Admin Only Queries - Only trigger if we are CERTAIN they are an admin
  const devices = useQuery(api.devices.list, isAdmin ? {} : "skip");
  const userStats = useQuery(api.users.getStats, isAdmin ? {} : "skip");
  const allUsers = useQuery(api.users.list, isAdmin ? {} : "skip");

  // Determine if necessary data for the current role is loaded
  const isAdminDataLoaded = isAuthenticated && viewer !== undefined ? (
    rooms !== undefined &&
    recentLogs !== undefined &&
    (!isAdmin || (devices !== undefined && userStats !== undefined && allUsers !== undefined))
  ) : false;

  // Check for cached auth on mount for optimistic UI
  useEffect(() => {
    const cached = authCache.get();
    const profile = authCache.getProfile();
    if (cached && cached.isAuthenticated) {
      setIsOptimisticAuth(true);
      setUserRole(cached.userRole);
    }
    if (profile) {
      setCachedProfile(profile);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDeviceId = async () => {
      try {
        const id = await getOrCreateDeviceId();
        if (isMounted) setDeviceId(id);
      } catch (err) {
        console.warn('Failed to load device id:', err);
      }
    };

    loadDeviceId();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && viewer) {
      setIsDemo(false);
      const role = (viewer.role as UserRole) || 'student';
      setUserRole(role);
      // Cache the auth state and user profile
      authCache.set(true, role);
      authCache.setProfile({
        name: viewer.name || '',
        email: viewer.email || '',
        role,
        avatarInitials: viewer.name?.split(' ').map((n: string) => n[0]).join('') || '',
      });
      setIsOptimisticAuth(false); // Real auth confirmed
    } else if (!isAuthenticated && !authLoading) {
      setUserRole(null);
      authCache.clear();
      setIsOptimisticAuth(false);
    }
  }, [isAuthenticated, viewer, authLoading]);

  useEffect(() => {
    if (!isAuthenticated || !viewer || !deviceId || hasLinkedDevice) return;

    if (!viewer.deviceId) {
      updateDeviceId({ deviceId })
        .then(() => setHasLinkedDevice(true))
        .catch((err) => {
          console.warn('Failed to link device id:', err);
          setHasLinkedDevice(true);
        });
    } else {
      setHasLinkedDevice(true);
    }
  }, [isAuthenticated, viewer, deviceId, hasLinkedDevice, updateDeviceId]);

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        isDemo,
        setIsDemo,
        rooms,
        devices,
        recentLogs,
        userStats,
        allUsers,
        viewer,
        isAdminDataLoaded,
        studentStats,
        todaySessions,
        homeroomSchedule,
        activeSemester,
        deviceId,
        isAuthenticated,
        isLoading: authLoading,
        isOptimisticAuth,
        cachedProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppProvider');
  }
  return context;
};
