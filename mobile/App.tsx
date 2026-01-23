import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, StatusBar, Animated, TouchableOpacity } from 'react-native';
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
  NotificationsScreen,
  PrivacyScreen,
  HelpScreen,
  ClassesScreen,
} from './src/screens';
import { UserRole } from './src/screens/LoginScreen';
import { colors, spacing, shadows } from './src/theme';
import { Caption } from './src/components';
import Svg, { Path } from 'react-native-svg';

SplashScreen.preventAutoHideAsync();

type Screen = 'login' | 'dashboard' | 'attendance' | 'opengate' | 'profile' | 'linkcard' | 'notifications' | 'privacy' | 'help' | 'classes';

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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [displayedScreen, setDisplayedScreen] = useState<Screen>('login');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tabFadeAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'PlayfairDisplay': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Medium': PlayfairDisplay_500Medium,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
  });

  const showTabBar = currentScreen === 'dashboard' || currentScreen === 'classes';

  React.useEffect(() => {
    Animated.timing(tabFadeAnim, {
      toValue: showTabBar ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
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

  const navigateTo = (screen: Screen) => {
    if (screen === currentScreen || isTransitioning) return;

    setIsTransitioning(true);
    setCurrentScreen(screen);
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setDisplayedScreen(screen);
      setIsTransitioning(false);
    });
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    navigateTo('dashboard');
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
            onProfile={() => navigateTo('profile')}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            onProfile={() => navigateTo('profile')}
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
        return <OpenGateScreen onBack={() => navigateTo('dashboard')} />;
      case 'attendance':
        return <AttendanceScreen onBack={() => navigateTo('dashboard')} />;
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => navigateTo('dashboard')}
            onLinkCard={() => navigateTo('linkcard')}
            onNotifications={() => navigateTo('notifications')}
            onPrivacy={() => navigateTo('privacy')}
            onHelp={() => navigateTo('help')}
            onSignOut={() => navigateTo('login')}
          />
        );
      case 'linkcard':
        return <LinkCardScreen onBack={() => navigateTo('profile')} />;
      case 'notifications':
        return <NotificationsScreen onBack={() => navigateTo('profile')} />;
      case 'privacy':
        return <PrivacyScreen onBack={() => navigateTo('profile')} />;
      case 'help':
        return <HelpScreen onBack={() => navigateTo('profile')} />;
      case 'classes':
        return <ClassesScreen />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />

      {/* Base screen - always rendered, keeps scroll position */}
      <View style={styles.screenLayer} pointerEvents={isTransitioning ? 'none' : 'auto'}>
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
            onPress={() => navigateTo('classes')}
            activeOpacity={0.7}
          >
            <ClassesIcon active={currentScreen === 'classes'} />
            <Caption style={[styles.tabLabel, currentScreen === 'classes' && styles.tabLabelActive]}>Classes</Caption>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
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
