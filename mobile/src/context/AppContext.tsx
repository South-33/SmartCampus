import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserRole } from '../screens/LoginScreen';

interface AppContextType {
  // Auth State
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isDemo: boolean;
  setIsDemo: (isDemo: boolean) => void;
  
  // Data State
  rooms: any[] | undefined;
  devices: any[] | undefined;
  recentLogs: any[] | undefined;
  userStats: any | undefined;
  allUsers: any[] | undefined;
  isAdminDataLoaded: boolean;
  
  // Loading State
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [isDemo, setIsDemo] = useState(false);

  // Global Sync for Admin Data
  const rooms = useQuery(api.rooms.list, isAuthenticated ? {} : 'skip' as any);
  const devices = useQuery(api.devices.list, isAuthenticated ? {} : 'skip' as any);
  const recentLogs = useQuery(api.accessLogs.getRecent, isAuthenticated ? {} : 'skip' as any);
  const userStats = useQuery(api.users.getStats, isAuthenticated ? {} : 'skip' as any);
  const allUsers = useQuery(api.users.list, isAuthenticated ? {} : 'skip' as any);
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : 'skip' as any);

  const isAdminDataLoaded = rooms !== undefined && devices !== undefined && recentLogs !== undefined && userStats !== undefined && allUsers !== undefined;

  useEffect(() => {
    if (isAuthenticated && viewer) {
      setIsDemo(false);
      setUserRole((viewer.role as UserRole) || 'student');
    }
  }, [isAuthenticated, viewer]);

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
