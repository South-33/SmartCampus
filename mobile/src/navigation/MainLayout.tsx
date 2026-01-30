import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { useAppData } from '../context/AppContext';
import { Screen, useAppNavigation } from '../hooks/useAppNavigation';
import { ScreenNavigator } from './ScreenNavigator';
import { colors, spacing } from '../theme';
import { Caption } from '../components';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { AdminAlert } from '../screens/AdminDashboard';
import { LoginScreen } from '../screens';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Simple Tab Bar Icons
const HomeIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={active ? colors.cobalt : colors.slate} strokeWidth={2}>
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClassesIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={active ? colors.cobalt : colors.slate} strokeWidth={2}>
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RoomsIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={active ? colors.cobalt : colors.slate} strokeWidth={2}>
    <Rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 3v18M3 9h18" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HoursIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={active ? colors.cobalt : colors.slate} strokeWidth={2}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TasksIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={active ? colors.cobalt : colors.slate} strokeWidth={2}>
    <Path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UsersIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={active ? colors.cobalt : colors.slate} strokeWidth={2}>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LogsIcon = ({ active }: { active: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={active ? colors.cobalt : colors.slate} strokeWidth={2}>
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MainLayout = () => {
  const { userRole, isDemo, isAuthenticated, isLoading, setIsDemo, setUserRole, isAdminDataLoaded, isOptimisticAuth } = useAppData();
  const navigation = useAppNavigation();
  const {
    currentScreen,
    displayedScreen,
    isTransitioning,
    fadeAnim,
    navigateTo,
    goBack,
    selectedClassId,
    selectedRoomId,
    selectedUserId,
    resetNavigation
  } = navigation;

  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [showLogin, setShowLogin] = useState(false);

  // Single animation value for the Auth Gate Crossfade
  const authFadeAnim = useRef(new Animated.Value(0)).current;
  const tabFadeAnim = useRef(new Animated.Value(0)).current;

  const mainScreens: Screen[] = ['dashboard', 'classes', 'teacher-classes', 'teacher-hours', 'staff-tasks', 'admin-rooms', 'admin-users', 'admin-logs'];
  const showTabBar = mainScreens.includes(currentScreen);

  // Handle auth state changes with crossfade
  useEffect(() => {
    // If we were optimistically showing the app but auth failed, fade to login
    if (!isAuthenticated && !isLoading && !isDemo && !isOptimisticAuth) {
      setShowLogin(true);
      Animated.timing(authFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else if (isAuthenticated || isDemo || isOptimisticAuth) {
      // User is authenticated (or optimistic), fade out login
      setShowLogin(false);
      Animated.timing(authFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [isAuthenticated, isLoading, isDemo, isOptimisticAuth]);

  // Tab bar fade
  useEffect(() => {
    Animated.timing(tabFadeAnim, {
      toValue: showTabBar ? 1 : 0,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [showTabBar]);

  // Reset internal navigation when logged out
  useEffect(() => {
    if (!isAuthenticated && !isDemo) {
      resetNavigation('dashboard');
    }
  }, [isAuthenticated, isDemo]);

  const handleDemoLogin = (role: any) => {
    setIsDemo(true);
    setUserRole(role);
    navigateTo('dashboard', { clearHistory: true });
  };

  const handleReportIssue = (message: string) => {
    const newAlert: AdminAlert = {
      id: `a${Date.now()}`,
      type: 'device',
      priority: 'high',
      message,
      time: 'Just now'
    };
    setAlerts([newAlert, ...alerts]);
  };

  const renderScreenContent = (screenToRender: Screen) => (
    <ErrorBoundary>
      <ScreenNavigator
        screen={screenToRender}
        navigateTo={navigateTo}
        goBack={goBack}
        selectedClassId={selectedClassId}
        selectedRoomId={selectedRoomId}
        selectedUserId={selectedUserId}
        handleReportIssue={handleReportIssue}
        alerts={alerts}
      />
    </ErrorBoundary>
  );

  // Determine effective auth state (optimistic or real)
  const effectiveIsAuthenticated = isAuthenticated || isDemo || isOptimisticAuth;

  return (
    <View style={styles.container}>
      {/* LAYER 1: THE AUTH GATE (LOGIN) - shown when not authenticated */}
      {showLogin && (
        <Animated.View
          style={[
            styles.authLayer,
            {
              opacity: authFadeAnim,
              zIndex: 10,
              pointerEvents: 'auto'
            }
          ]}
        >
          <LoginScreen onLogin={handleDemoLogin} />
        </Animated.View>
      )}

      {/* LAYER 2: THE APP (DASHBOARD + NAV) - shown when authenticated (or optimistic) */}
      {effectiveIsAuthenticated && (
        <Animated.View style={[styles.appLayer, { opacity: 1 }]}>
          {/* Base screen */}
          <View style={[styles.screenLayer, { pointerEvents: isTransitioning ? 'none' : 'auto' }]}>
            {renderScreenContent(displayedScreen)}
          </View>

          {/* New screen fades in on top during internal transitions */}
          {isTransitioning && currentScreen !== displayedScreen && (
            <Animated.View style={[styles.screenLayer, { opacity: fadeAnim }]}>
              {renderScreenContent(currentScreen)}
            </Animated.View>
          )}

          {/* Tab Bar */}
          {showTabBar && (
            <Animated.View style={[styles.tabBar, { opacity: tabFadeAnim }]}>
              <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('dashboard')} activeOpacity={0.7}>
                <HomeIcon active={currentScreen === 'dashboard'} />
                <Caption style={[styles.tabLabel, currentScreen === 'dashboard' && styles.tabLabelActive]}>Home</Caption>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                  if (userRole === 'staff') navigateTo('staff-tasks');
                  else if (userRole === 'admin') navigateTo('admin-rooms');
                  else navigateTo(userRole === 'teacher' ? 'teacher-classes' : 'classes');
                }}
                activeOpacity={0.7}
              >
                {userRole === 'staff' ? (
                  <TasksIcon active={currentScreen === 'staff-tasks'} />
                ) : userRole === 'admin' ? (
                  <RoomsIcon active={currentScreen === 'admin-rooms'} />
                ) : (
                  <ClassesIcon active={currentScreen === 'classes' || currentScreen === 'teacher-classes'} />
                )}
                <Caption style={[styles.tabLabel, (currentScreen === 'classes' || currentScreen === 'teacher-classes' || currentScreen === 'staff-tasks' || currentScreen === 'admin-rooms') && styles.tabLabelActive]}>
                  {userRole === 'teacher' ? 'Schedule' : userRole === 'staff' ? 'Tasks' : userRole === 'admin' ? 'Rooms' : 'Classes'}
                </Caption>
              </TouchableOpacity>

              {userRole === 'admin' && (
                <>
                  <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('admin-users')} activeOpacity={0.7}>
                    <UsersIcon active={currentScreen === 'admin-users'} />
                    <Caption style={[styles.tabLabel, currentScreen === 'admin-users' && styles.tabLabelActive]}>Users</Caption>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('admin-logs')} activeOpacity={0.7}>
                    <LogsIcon active={currentScreen === 'admin-logs'} />
                    <Caption style={[styles.tabLabel, currentScreen === 'admin-logs' && styles.tabLabelActive]}>Logs</Caption>
                  </TouchableOpacity>
                </>
              )}

              {userRole === 'teacher' && (
                <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('teacher-hours')} activeOpacity={0.7}>
                  <HoursIcon active={currentScreen === 'teacher-hours'} />
                  <Caption style={[styles.tabLabel, currentScreen === 'teacher-hours' && styles.tabLabelActive]}>Hours</Caption>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  authLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ivory,
  },
  appLayer: {
    flex: 1,
  },
  screenLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: colors.ivory,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.slate,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: colors.cobalt,
  },
});
