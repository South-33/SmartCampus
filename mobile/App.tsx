import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, StatusBar, Animated } from 'react-native';
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
} from './src/screens';
import { UserRole } from './src/screens/LoginScreen';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync();

type Screen = 'login' | 'dashboard' | 'attendance' | 'opengate' | 'profile' | 'linkcard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [displayedScreen, setDisplayedScreen] = useState<Screen>('login');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'PlayfairDisplay': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Medium': PlayfairDisplay_500Medium,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

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

  if (!fontsLoaded) {
    return null;
  }

  const renderDashboard = () => {
    switch (userRole) {
      case 'student':
        return (
          <DashboardScreen
            onOpenGate={() => navigateTo('opengate')}
            onAttendance={() => navigateTo('attendance')}
            onProfile={() => navigateTo('profile')}
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
          />
        );
      case 'linkcard':
        return <LinkCardScreen onBack={() => navigateTo('profile')} />;
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
});
