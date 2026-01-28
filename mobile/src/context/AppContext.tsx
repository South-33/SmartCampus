import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserRole } from '../screens/LoginScreen';
import { Doc } from '../../convex/_generated/dataModel';
import { authCache } from '../lib/authCache';

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
  rooms: Doc<"rooms">[] | undefined;
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
  todayClasses: any[] | undefined;
  enrolledClasses: any[] | undefined;

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

  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : 'skip' as any);

  // Strictly check roles
  const isAdmin = viewer !== undefined && viewer !== null && viewer.role === 'admin';
  const isStudent = viewer !== undefined && viewer !== null && viewer.role === 'student';

  // Global Sync for Data - Role Aware
  const rooms = useQuery(api.rooms.list, isAuthenticated ? {} : 'skip' as any);
  const recentLogs = useQuery(api.accessLogs.getRecent, isAuthenticated ? {} : 'skip' as any);
  const todayClasses = useQuery(api.classes.getToday, isAuthenticated ? {} : 'skip' as any);

  // Student Specific
  const studentStats = useQuery(api.accessLogs.getStudentStats, isStudent ? {} : 'skip' as any);
  const enrolledClasses = useQuery(api.classes.getEnrolled, isStudent ? {} : 'skip' as any);

  // Admin Only Queries - Only trigger if we are CERTAIN they are an admin
  const devices = useQuery(api.devices.list, isAdmin ? {} : 'skip' as any);
  const userStats = useQuery(api.users.getStats, isAdmin ? {} : 'skip' as any);
  const allUsers = useQuery(api.users.list, isAdmin ? {} : 'skip' as any);

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
        todayClasses,
        enrolledClasses,
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
