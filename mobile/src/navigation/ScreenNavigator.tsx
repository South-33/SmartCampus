import React from 'react';
import { useAppData } from '../context/AppContext';
import { Screen } from '../hooks/useAppNavigation';
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
} from '../screens';
import { useAuthActions } from '@convex-dev/auth/react';

interface ScreenNavigatorProps {
  screen: Screen;
  navigateTo: (screen: Screen, params?: any) => void;
  goBack: () => void;
  selectedClassId: string | null;
  selectedRoomId: string | null;
  selectedUserId: string | null;
  handleReportIssue: (message: string) => void;
  alerts: any[];
}

export const ScreenNavigator = ({
  screen,
  navigateTo,
  goBack,
  selectedClassId,
  selectedRoomId,
  selectedUserId,
  handleReportIssue,
  alerts,
}: ScreenNavigatorProps) => {
  const { 
    userRole, 
    setUserRole, 
    setIsDemo, 
    rooms, 
    devices, 
    recentLogs, 
    userStats, 
    allUsers, 
    isAdminDataLoaded 
  } = useAppData();
  
  const { signOut } = useAuthActions();

  const handleLogin = (role: any) => {
    setIsDemo(true);
    setUserRole(role);
    navigateTo('dashboard', { clearHistory: true });
  };

  const handleViewClass = (classId: string) => {
    navigateTo('class-detail', { classId });
  };

  const renderDashboard = () => {
    // Shared props for admin screens
    const adminProps = {
      rooms,
      devices,
      recentLogs,
      userStats,
      allUsers,
      isLoading: !isAdminDataLoaded
    };

    switch (userRole) {
      case 'student':
        return (
          <DashboardScreen
            key="student-dashboard"
            onOpenGate={() => navigateTo('opengate')}
            onAttendance={() => navigateTo('attendance')}
            onProfile={() => navigateTo('profile')}
            onViewAllClasses={() => navigateTo('classes')}
          />
        );
      case 'teacher':
        return (
          <TeacherDashboard
            key="teacher-dashboard"
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
            key="admin-dashboard"
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
            key="staff-dashboard"
            onProfile={() => navigateTo('profile')}
            onViewTasks={() => navigateTo('staff-tasks')}
            onReportIssue={handleReportIssue}
            onOpenGate={() => navigateTo('opengate')}
          />
        );
    }
  };

  switch (screen) {
    case 'login':
      return <LoginScreen key="login" onLogin={handleLogin} />;
    case 'dashboard':
      return renderDashboard();
    case 'opengate':
      return <OpenGateScreen key="opengate" onBack={goBack} />;
    case 'attendance':
      return <AttendanceScreen key="attendance" onBack={goBack} />;
    case 'profile':
      return (
        <ProfileScreen
          key="profile"
          onBack={goBack}
          onLinkCard={() => navigateTo('linkcard')}
          onNotifications={() => navigateTo('notifications')}
          onPrivacy={() => navigateTo('privacy')}
          onHelp={() => navigateTo('help')}
          onSignOut={() => {
            signOut();
            setIsDemo(false);
            navigateTo('login', { clearHistory: true });
          }}
        />
      );
    case 'linkcard':
      return <LinkCardScreen key="linkcard" onBack={goBack} />;
    case 'notifications':
      return <NotificationsScreen key="notifications" onBack={goBack} />;
    case 'privacy':
      return <PrivacyScreen key="privacy" onBack={goBack} />;
    case 'help':
      return <HelpScreen key="help" onBack={goBack} />;
    case 'classes':
      return <ClassesScreen key="classes" />;
    case 'teacher-classes':
      return <TeacherClassesScreen key="teacher-classes" onViewClass={handleViewClass} />;
    case 'teacher-hours':
      return <TeachingHoursScreen key="teacher-hours" onBack={goBack} />;
    case 'class-detail':
      return <ClassDetailScreen key={`class-${selectedClassId}`} classId={selectedClassId || '1'} onBack={goBack} />;
    case 'admin-users':
      return (
        <AdminUserListScreen 
          key="admin-users"
          onBack={goBack} 
          onViewUser={(userId) => navigateTo('admin-user-detail', { userId })}
        />
      );
    case 'admin-user-detail':
      return (
        <AdminUserDetailScreen 
          key={`user-${selectedUserId}`}
          userId={selectedUserId || ''} 
          onBack={goBack} 
        />
      );
    case 'admin-logs':
      return (
        <AdminLogsScreen 
          key="admin-logs"
          onBack={goBack} 
        />
      );
    case 'admin-rooms':
      return (
        <AdminRoomListScreen 
          key="admin-rooms"
          onBack={goBack} 
          onViewRoom={(roomId) => navigateTo('admin-room-detail', { roomId })}
        />
      );
    case 'admin-room-detail':
      return (
        <AdminRoomDetailScreen 
          key={`room-${selectedRoomId}`}
          roomId={selectedRoomId || ''} 
          onBack={goBack} 
        />
      );
    case 'admin-security':
      return <AdminSecurityScreen key="admin-security" onBack={goBack} />;
    case 'staff-tasks':
      return <StaffTasksScreen key="staff-tasks" onBack={goBack} />;
    default:
      return null;
  }
};
