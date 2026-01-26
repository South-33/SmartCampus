import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserRole } from '../screens/LoginScreen';
import { Doc } from '../../convex/_generated/dataModel';

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
  
  // Loading State
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : 'skip' as any);
  
  // Strictly check if the user is an admin
  const isAdmin = viewer !== undefined && viewer !== null && viewer.role === 'admin';

  // Global Sync for Data - Role Aware
  const rooms = useQuery(api.rooms.list, isAuthenticated ? {} : 'skip' as any);
  const recentLogs = useQuery(api.accessLogs.getRecent, isAuthenticated ? {} : 'skip' as any);
  
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

  useEffect(() => {
    if (isAuthenticated && viewer) {
      setIsDemo(false);
      setUserRole((viewer.role as UserRole) || 'student');
    } else if (!isAuthenticated && !authLoading) {
      setUserRole(null);
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
        isAuthenticated,
        isLoading: authLoading,
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
