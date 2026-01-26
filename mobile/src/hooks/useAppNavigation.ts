import { useState, useRef, useCallback } from 'react';
import { Animated, Platform } from 'react-native';

export type Screen = 'dashboard' | 'attendance' | 'opengate' | 'profile' | 'linkcard' | 'notifications' | 'privacy' | 'help' | 'classes' | 'teacher-classes' | 'teacher-hours' | 'class-detail' | 'admin-users' | 'admin-user-detail' | 'admin-logs' | 'admin-rooms' | 'admin-room-detail' | 'admin-security' | 'staff-tasks';

export type HistoryItem = {
  screen: Screen;
  selectedClassId?: string | null;
  selectedRoomId?: string | null;
  selectedUserId?: string | null;
};

export function useAppNavigation() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [displayedScreen, setDisplayedScreen] = useState<Screen>('dashboard');
  const [navigationHistory, setNavigationHistory] = useState<HistoryItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const navigateTo = useCallback((screen: Screen, params: { classId?: string, roomId?: string, userId?: string, clearHistory?: boolean } = {}) => {
    if ((screen === currentScreen && !params.classId && !params.roomId && !params.userId) || isTransitioning) return;

    if (params.clearHistory) {
      setNavigationHistory([]);
    } else {
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
  }, [currentScreen, isTransitioning, selectedClassId, selectedRoomId, selectedUserId, fadeAnim]);

  const goBack = useCallback(() => {
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
  }, [navigationHistory, isTransitioning, fadeAnim]);

  const resetNavigation = useCallback((screen: Screen = 'dashboard') => {
    setNavigationHistory([]);
    setCurrentScreen(screen);
    setDisplayedScreen(screen);
    setIsTransitioning(false);
    fadeAnim.setValue(1);
  }, [fadeAnim]);

  return {
    currentScreen,
    displayedScreen,
    navigationHistory,
    selectedClassId,
    selectedRoomId,
    selectedUserId,
    isTransitioning,
    fadeAnim,
    navigateTo,
    goBack,
    resetNavigation,
  };
}
