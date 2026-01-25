import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';
import {
  LoginScreen,
  DashboardScreen,
  AttendanceScreen,
  OpenGateScreen,
  ProfileScreen,
  LinkCardScreen,
  TeacherDashboard,
  AdminDashboard,
  AdminUserListScreen,
  AdminUserDetailScreen,
  AdminLogsScreen,
  AdminRoomListScreen,
  AdminRoomDetailScreen,
  AdminSecurityScreen,
  StaffDashboard,
  StaffTasksScreen,
  NotificationsScreen,
  PrivacyScreen,
  HelpScreen,
  ClassesScreen,
  TeacherClassesScreen,
  ClassDetailScreen,
  TeachingHoursScreen,
} from './src/screens';
import { UserRole } from './src/screens/LoginScreen';
import { colors, spacing, shadows } from './src/theme';
import { Caption } from './src/components';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { mockAlerts as initialAlerts, AdminAlert } from './src/data/adminMockData';

SplashScreen.preventAutoHideAsync();

type Screen = 'login' | 'dashboard' | 'attendance' | 'opengate' | 'profile' | 'linkcard' | 'notifications' | 'privacy' | 'help' | 'classes' | 'teacher-classes' | 'teacher-hours' | 'class-detail' | 'admin-users' | 'admin-user-detail' | 'admin-logs' | 'admin-rooms' | 'admin-room-detail' | 'admin-security' | 'staff-tasks';

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

type HistoryItem = {
  screen: Screen;
  selectedClassId?: string | null;
  selectedRoomId?: string | null;
  selectedUserId?: string | null;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [displayedScreen, setDisplayedScreen] = useState<Screen>('login');
  const [navigationHistory, setNavigationHistory] = useState<HistoryItem[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tabFadeAnim = useRef(new Animated.Value(0)).current;

  const [alerts, setAlerts] = useState<AdminAlert[]>(initialAlerts);

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
  const [fontsLoaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'PlayfairDisplay': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Medium': PlayfairDisplay_500Medium,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
  });

  const mainScreens = ['dashboard', 'classes', 'teacher-classes', 'teacher-hours', 'staff-tasks', 'admin-rooms', 'admin-users', 'admin-logs'];
  const showTabBar = mainScreens.includes(currentScreen);

  React.useEffect(() => {
    Animated.timing(tabFadeAnim, {
      toValue: showTabBar ? 1 : 0,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [showTabBar]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const navigateTo = (screen: Screen, params: { classId?: string, roomId?: string, userId?: string, clearHistory?: boolean } = {}) => {
    if ((screen === currentScreen && !params.classId && !params.roomId && !params.userId) || isTransitioning) return;

    if (params.clearHistory || screen === 'login') {
      setNavigationHistory([]);
    } else {
      // Push current state to history before navigating
      setNavigationHistory(prev => [...prev, {
        screen: currentScreen,
        selectedClassId,
        selectedRoomId,
        selectedUserId
      }]);
    }

    if (params.classId) setSelectedClassId(params.classId);
    if (params.roomId) setSelectedRoomId(params.roomId);
    if (params.userId) setSelectedUserId(params.userId);

    setIsTransitioning(true);
    setCurrentScreen(screen);
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setDisplayedScreen(screen);
      setIsTransitioning(false);
    });
  };

  const goBack = () => {
    if (navigationHistory.length === 0 || isTransitioning) return;

    const lastItem = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory(prev => prev.slice(0, -1));

    if (lastItem.selectedClassId !== undefined) setSelectedClassId(lastItem.selectedClassId);
    if (lastItem.selectedRoomId !== undefined) setSelectedRoomId(lastItem.selectedRoomId);
    if (lastItem.selectedUserId !== undefined) setSelectedUserId(lastItem.selectedUserId);

    setIsTransitioning(true);
    setCurrentScreen(lastItem.screen);
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setDisplayedScreen(lastItem.screen);
      setIsTransitioning(false);
    });
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    navigateTo('dashboard', { clearHistory: true });
  };

  const handleViewClass = (classId: string) => {
    navigateTo('class-detail', { classId });
  };

  const renderDashboard = () => {
    switch (userRole) {
      case 'student':
        return (
          <DashboardScreen
            onOpenGate={() => navigateTo('opengate')}
            onAttendance={() => navigateTo('attendance')}
            onProfile={() => navigateTo('profile')}
            onViewAllClasses={() => navigateTo('classes')}
          />
        );
      case 'teacher':
        return (
          <TeacherDashboard
            onOpenGate={() => navigateTo('opengate')}
            onAttendance={() => navigateTo('attendance')}
            onProfile={() => navigateTo('profile')}
            onViewClass={handleViewClass}
            onViewHours={() => navigateTo('teacher-hours')}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            alerts={alerts}
            onProfile={() => navigateTo('profile')}
            onSecurity={() => navigateTo('admin-security')}
            onUsers={() => navigateTo('admin-users')}
            onLogs={() => navigateTo('admin-logs')}
            onRooms={() => navigateTo('admin-rooms')}
            onViewRoom={(roomId) => navigateTo('admin-room-detail', { roomId })}
            onOpenGate={() => navigateTo('opengate')}
          />
        );
      case 'staff':
        return (
          <StaffDashboard 
            onProfile={() => navigateTo('profile')}
            onViewTasks={() => navigateTo('staff-tasks')}
            onReportIssue={handleReportIssue}
            onOpenGate={() => navigateTo('opengate')}
          />
        );
    }
  };

  const renderScreen = (screen: Screen) => {
    switch (screen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      case 'dashboard':
        return renderDashboard();
      case 'opengate':
        return <OpenGateScreen onBack={goBack} />;
      case 'attendance':
        return <AttendanceScreen onBack={goBack} />;
      case 'profile':
        return (
          <ProfileScreen
            onBack={goBack}
            onLinkCard={() => navigateTo('linkcard')}
            onNotifications={() => navigateTo('notifications')}
            onPrivacy={() => navigateTo('privacy')}
            onHelp={() => navigateTo('help')}
            onSignOut={() => navigateTo('login', { clearHistory: true })}
          />
        );
      case 'linkcard':
        return <LinkCardScreen onBack={goBack} />;
      case 'notifications':
        return <NotificationsScreen onBack={goBack} />;
      case 'privacy':
        return <PrivacyScreen onBack={goBack} />;
      case 'help':
        return <HelpScreen onBack={goBack} />;
      case 'classes':
        return <ClassesScreen />;
      case 'teacher-classes':
        return <TeacherClassesScreen onViewClass={handleViewClass} />;
      case 'teacher-hours':
        return <TeachingHoursScreen onBack={goBack} />;
      case 'class-detail':
        return <ClassDetailScreen classId={selectedClassId || '1'} onBack={goBack} />;
      case 'admin-users':
        return (
          <AdminUserListScreen 
            onBack={goBack} 
            onViewUser={(userId) => navigateTo('admin-user-detail', { userId })}
          />
        );
      case 'admin-user-detail':
        return (
          <AdminUserDetailScreen 
            userId={selectedUserId || 'u1'} 
            onBack={goBack} 
          />
        );
      case 'admin-logs':
        return <AdminLogsScreen onBack={goBack} />;
      case 'admin-rooms':
        return (
          <AdminRoomListScreen 
            onBack={goBack} 
            onViewRoom={(roomId) => navigateTo('admin-room-detail', { roomId })}
          />
        );
      case 'admin-room-detail':
        return (
          <AdminRoomDetailScreen 
            roomId={selectedRoomId || 'room1'} 
            onBack={goBack} 
          />
        );
      case 'admin-security':
        return <AdminSecurityScreen onBack={goBack} />;
      case 'staff-tasks':
        return <StaffTasksScreen onBack={goBack} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <StatusBar style="dark" translucent backgroundColor="transparent" />

        {/* Base screen - always rendered, keeps scroll position */}
        <View style={[styles.screenLayer, { pointerEvents: isTransitioning ? 'none' : 'auto' }]}>
          {renderScreen(displayedScreen)}
        </View>

        {/* New screen fades in on top during transition */}
        {isTransitioning && currentScreen !== displayedScreen && (
          <Animated.View style={[styles.screenLayer, { opacity: fadeAnim }]}>
            {renderScreen(currentScreen)}
          </Animated.View>
        )}

        {/* Custom Tab Bar */}
        {showTabBar && (
          <Animated.View style={[styles.tabBar, { opacity: tabFadeAnim }]}>
            <TouchableOpacity 
              style={styles.tabItem} 
              onPress={() => navigateTo('dashboard')}
              activeOpacity={0.7}
            >
              <HomeIcon active={currentScreen === 'dashboard'} />
              <Caption style={[styles.tabLabel, currentScreen === 'dashboard' && styles.tabLabelActive]}>Home</Caption>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tabItem} 
              onPress={() => {
                if (userRole === 'staff') {
                  navigateTo('staff-tasks');
                } else if (userRole === 'admin') {
                  navigateTo('admin-rooms');
                } else {
                  navigateTo(userRole === 'teacher' ? 'teacher-classes' : 'classes');
                }
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
                <TouchableOpacity 
                  style={styles.tabItem} 
                  onPress={() => navigateTo('admin-users')}
                  activeOpacity={0.7}
                >
                  <UsersIcon active={currentScreen === 'admin-users'} />
                  <Caption style={[styles.tabLabel, currentScreen === 'admin-users' && styles.tabLabelActive]}>Users</Caption>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.tabItem} 
                  onPress={() => navigateTo('admin-logs')}
                  activeOpacity={0.7}
                >
                  <LogsIcon active={currentScreen === 'admin-logs'} />
                  <Caption style={[styles.tabLabel, currentScreen === 'admin-logs' && styles.tabLabelActive]}>Logs</Caption>
                </TouchableOpacity>
              </>
            )}

            {userRole === 'teacher' && (
              <TouchableOpacity 
                style={styles.tabItem} 
                onPress={() => navigateTo('teacher-hours')}
                activeOpacity={0.7}
              >
                <HoursIcon active={currentScreen === 'teacher-hours'} />
                <Caption style={[styles.tabLabel, currentScreen === 'teacher-hours' && styles.tabLabelActive]}>Hours</Caption>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
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
