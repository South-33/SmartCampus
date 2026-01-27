import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Animated,
    useWindowDimensions,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../theme';
import {
    HeadingLg,
    HeadingSm,
    HeadingMd,
    Body,
    BodySm,
    Caption,
    ResponsiveContainer,
} from '../components';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
export interface AdminAlert {
    id: string;
    type: 'device' | 'suspicious' | 'sharing' | 'gps';
    priority: 'high' | 'medium' | 'low';
    message: string;
    time: string;
    data?: any;
}

interface AdminDashboardProps {
    onProfile: () => void;
    onSecurity: () => void;
    onUsers: () => void;
    onLogs: () => void;
    onRooms: () => void;
    onViewRoom: (roomId: string) => void;
    onOpenGate: () => void;
    alerts?: AdminAlert[];
}


// Icons
const ShieldIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth={2}>
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
        <Line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round" />
        <Line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PlusIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const SecurityIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const DoorIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M3 21h18M9 21V3h12v18" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="15" cy="12" r="1" fill={colors.cobalt} stroke="none" />
    </Svg>
);

const UsersIcon = () => (

    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="9" cy="7" r="4" />
        <Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const LogsIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const AlertIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth={2}>
        <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const UnlockIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <Path d="M7 11V7a5 5 0 0 1 9.9-1" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PowerIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const WifiIcon = ({ status }: { status: 'online' | 'offline' }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={status === 'online' ? colors.success : colors.error} strokeWidth={2}>
        <Path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const LockIcon = ({ status }: { status: 'unlocked' | 'locked' | 'staff_only' }) => {
    const isLocked = status !== 'unlocked';
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={isLocked ? colors.error : colors.slate} strokeWidth={2}>
            <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <Path d={isLocked ? "M7 11V7a5 5 0 0 1 10 0v4" : "M7 11V7a5 5 0 0 1 9.9-1"} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
};

const PinIcon = ({ pinned }: { pinned: boolean }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={pinned ? colors.cobalt : "none"} stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M19 13.5l-2-2V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7.5l-2 2V15h6v5l1 1 1-1v-5h6v-1.5z" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const DeviceStatusIcon = ({ type, status }: { type: 'gatekeeper' | 'watchman', status: 'online' | 'offline' }) => {
    const color = status === 'online' ? colors.success : colors.error;
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
            {type === 'gatekeeper' ? (
                <>
                    <Rect x="5" y="3" width="14" height="18" rx="1" strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx="15" cy="12" r="1" fill={color} stroke="none" />
                </>
            ) : (
                <>
                    <Circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                    <Circle cx="12" cy="12" r="5" strokeWidth={1.5} />
                    <Circle cx="12" cy="12" r="2" fill={color} stroke="none" />
                </>
            )}
        </Svg>
    );
};

import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAppData } from '../context/AppContext';
import { useFadeIn } from '../hooks/useFadeIn';

export interface AdminAlert {
    id: string;
    type: 'device' | 'suspicious' | 'sharing' | 'gps';
    priority: 'high' | 'medium' | 'low';
    message: string;
    time: string;
    data?: any;
}

export const AdminDashboard = ({
    onProfile,
    onSecurity,
    onUsers,
    onLogs,
    onRooms,
    onViewRoom,
    onOpenGate,
    alerts = [],
}: AdminDashboardProps) => {
    const { rooms, devices, recentLogs, userStats, isAdminDataLoaded, viewer, cachedProfile } = useAppData();
    const isLoading = !isAdminDataLoaded;

    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isTablet = width > 600;

    // Use cached profile for instant render, fallback to viewer when loaded
    const avatarInitials = viewer?.name?.split(' ').map((n: string) => n[0]).join('')
        || cachedProfile?.avatarInitials
        || 'A';

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    const cycleLockStatusMutation = useMutation(api.rooms.cycleLockStatus);

    const cycleLockStatus = async (roomId: string) => {
        try {
            await cycleLockStatusMutation({ roomId: roomId as any });
        } catch (error) {
            console.error(error);
        }
    };

    // Component-level fade for data sections
    const dataFadeAnim = useFadeIn({ trigger: !isLoading, duration: 400 });

    return (
        <View style={styles.container}>
            <ResponsiveContainer>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[
                        styles.content,
                        { paddingTop: insets.top + spacing.lg }
                    ]}
                    alwaysBounceVertical={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.greeting}>
                                <HeadingSm>Admin Panel</HeadingSm>
                                <HeadingLg>Kingsford</HeadingLg>
                                <BodySm style={styles.date}>{dateStr}</BodySm>
                            </View>
                            <TouchableOpacity style={styles.avatar} onPress={onProfile} activeOpacity={0.8}>
                                <HeadingMd style={styles.avatarText}>{avatarInitials}</HeadingMd>
                            </TouchableOpacity>
                        </View>

                        {/* Quick Actions Grid - Now at the Top */}
                        <View style={styles.actionsGrid}>
                            <TouchableOpacity 
                                style={[styles.actionCard, { width: isTablet ? '48.5%' : '100%' }]} 
                                activeOpacity={0.85} 
                                onPress={onOpenGate}
                            >
                                <DoorIcon />
                                <BodySm>Open Gate</BodySm>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionCard, { width: isTablet ? '48.5%' : '100%' }]} 
                                activeOpacity={0.85} 
                                onPress={onSecurity}
                            >
                                <SecurityIcon />
                                <BodySm>Security</BodySm>
                            </TouchableOpacity>
                        </View>

                        {/* System Health Overview */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <HeadingSm>System Health</HeadingSm>
                                <Caption>All systems operational</Caption>
                            </View>
                            <View style={styles.healthCard}>
                                <View style={styles.healthItem}>
                                    <View style={styles.healthIconContainer}>
                                        <WifiIcon status="online" />
                                    </View>
                                    <View>
                                        <Body style={styles.healthValue}>{isLoading ? '--' : (devices?.filter(d => d.status === 'online').length || 0)}/{isLoading ? '--' : (devices?.length || 0)}</Body>
                                        <Caption>Nodes Online</Caption>
                                    </View>
                                </View>
                                <View style={styles.healthDivider} />
                                <View style={styles.healthItem}>
                                    <View style={[styles.healthIconContainer, { backgroundColor: colors.cream }]}>
                                        <DoorIcon />
                                    </View>
                                    <View>
                                        <Body style={styles.healthValue}>{isLoading ? '--' : (rooms?.length || 0)}</Body>
                                        <Caption>Rooms Active</Caption>
                                    </View>
                                </View>
                            </View>

                            {/* Pending Registration Alert - Now integrated into System Health */}
                            {!isLoading && (devices || []).some(d => !d.roomId) && (
                                <TouchableOpacity style={[styles.registrationCard, { marginTop: spacing.md }]} activeOpacity={0.8} onPress={onSecurity}>
                                    <View style={styles.registrationIcon}>
                                        <PlusIcon />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Body style={{ fontFamily: 'Inter-SemiBold' }}>New Device Detected</Body>
                                        <Caption>{devices?.filter(d => !d.roomId).length} device(s) awaiting room assignment</Caption>
                                    </View>
                                    <BodySm style={{ color: colors.cobalt, fontFamily: 'Inter-Medium' }}>Assign</BodySm>
                                </TouchableOpacity>
                            )}


                        </View>

                        {/* Alerts & Logs Combined Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <HeadingSm>Alerts</HeadingSm>
                                    <View style={styles.alertBadge}>
                                        <Caption style={styles.alertBadgeText}>{alerts.length}</Caption>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={onLogs}>
                                    <BodySm style={styles.sectionLink}>See All Logs</BodySm>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.alertsList}>
                                {alerts.map((alert: any) => (
                                    <TouchableOpacity
                                        key={alert.id}
                                        style={[
                                            styles.alertCard,
                                            alert.priority === 'high' && styles.alertCardHigh
                                        ]}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[
                                            styles.alertIcon,
                                            alert.priority === 'high' && styles.alertIconHigh,
                                        ]} />
                                        <View style={styles.alertContent}>
                                            <Body style={styles.alertMessage}>{alert.message}</Body>
                                            <Caption>{alert.time}</Caption>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Pinned Rooms Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <HeadingSm>Pinned Rooms</HeadingSm>
                                <TouchableOpacity onPress={onRooms}>
                                    <BodySm style={styles.sectionLink}>Manage pins</BodySm>
                                </TouchableOpacity>
                            </View>

                            <Animated.View style={[styles.roomList, { opacity: dataFadeAnim }]}>
                                {isLoading ? (
                                    <View style={styles.inlineLoading}>
                                        <ActivityIndicator color={colors.cobalt} />
                                    </View>
                                ) : (
                                    (rooms || []).slice(0, 3).map((room) => {
                                        const roomDevices = (devices || []).filter(d => d.roomId === room._id);
                                        const currentLockStatus = room.lockStatus || 'unlocked';
                                        return (
                                            <TouchableOpacity
                                                key={room._id}
                                                style={styles.roomContainer}
                                                activeOpacity={0.85}
                                                onPress={() => onViewRoom(room._id)}
                                            >
                                                <View style={styles.roomHeader}>
                                                    <View style={styles.roomHeaderLeft}>
                                                        <View style={[
                                                            styles.powerDot,
                                                            { backgroundColor: room.powerStatus === 'on' ? colors.success : colors.slate }
                                                        ]} />
                                                        <Body style={styles.roomNameMain}>{room.name}</Body>
                                                    </View>
                                                    <View style={styles.roomHeaderRight}>
                                                        <WifiIcon status="online" />
                                                        <View style={styles.deviceIndicatorGroup}>
                                                            {roomDevices.map(device => (
                                                                <DeviceStatusIcon
                                                                    key={device._id}
                                                                    type="gatekeeper"
                                                                    status={device.status === 'online' ? 'online' : 'offline'}
                                                                />
                                                            ))}
                                                        </View>
                                                    </View>
                                                </View>

                                                <View style={styles.roomControlsRow}>
                                                    <TouchableOpacity
                                                        style={styles.roomStatusInfo}
                                                        activeOpacity={0.6}
                                                        onPress={() => cycleLockStatus(room._id)}
                                                    >
                                                        <LockIcon status={currentLockStatus as any} />
                                                        <View style={styles.lockStatusRow}>
                                                            <Caption style={[
                                                                styles.lockLabel,
                                                                currentLockStatus !== 'unlocked' && { color: colors.error }
                                                            ]}>
                                                                {currentLockStatus.replace('_', ' ').toUpperCase()}
                                                            </Caption>
                                                            {currentLockStatus === 'staff_only' && <Caption style={styles.lockDesc}>• Staff & Admins only</Caption>}
                                                            {currentLockStatus === 'locked' && <Caption style={styles.lockDesc}>• Admins only</Caption>}
                                                        </View>
                                                    </TouchableOpacity>
                                                    <Caption>Occupancy: {room.occupancy || 0}</Caption>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                                {!isLoading && (rooms?.length || 0) === 0 && (
                                    <View style={styles.emptyPinned}>
                                        <Caption>No rooms found.</Caption>
                                    </View>
                                )}
                            </Animated.View>

                        </View>

                        {/* Recent Activity Mini-Feed */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <HeadingSm>Recent Activity</HeadingSm>
                                <TouchableOpacity onPress={onLogs}>
                                    <BodySm style={styles.sectionLink}>View History</BodySm>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.activityCard}>
                                {isLoading ? (
                                    <View style={styles.inlineLoading}>
                                        <ActivityIndicator color={colors.cobalt} />
                                    </View>
                                ) : (
                                    (recentLogs || []).slice(0, 3).map((log, idx) => (
                                        <View key={log._id} style={[styles.activityRow, idx === 2 && { borderBottomWidth: 0 }]}>
                                            <View style={styles.activityDot} />
                                            <View style={{ flex: 1 }}>
                                                <BodySm><BodySm style={{ fontFamily: 'Inter-SemiBold' }}>{log.userName}</BodySm> • {log.roomName}</BodySm>
                                                <Caption>{log.action.replace('_', ' ')} • {log.method.toUpperCase()} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Caption>
                                            </View>
                                            <View style={[
                                                styles.resultBadge,
                                                { backgroundColor: log.result === 'granted' ? '#F0F9F4' : '#FFF1F1' }
                                            ]}>
                                                <Caption style={{ color: log.result === 'granted' ? colors.success : colors.error, fontSize: 10 }}>
                                                    {log.result.toUpperCase()}
                                                </Caption>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>

                        </View>

                        {/* User Summary */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <HeadingSm>User Statistics</HeadingSm>
                                <TouchableOpacity onPress={onUsers}>
                                    <BodySm style={styles.sectionLink}>Manage Users</BodySm>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.userStatsContainer}>
                                <View style={styles.userStatItem}>
                                    <HeadingMd>{isLoading ? '--' : userStats?.students}</HeadingMd>
                                    <Caption>Students</Caption>
                                </View>
                                <View style={styles.userStatDivider} />
                                <View style={styles.userStatItem}>
                                    <HeadingMd>{isLoading ? '--' : userStats?.teachers}</HeadingMd>
                                    <Caption>Teachers</Caption>
                                </View>
                                <View style={styles.userStatDivider} />
                                <View style={styles.userStatItem}>
                                    <HeadingMd>{isLoading ? '--' : userStats?.staff}</HeadingMd>
                                    <Caption>Staff</Caption>
                                </View>
                            </View>

                        </View>

                        {/* Analytics Section - Moved to bottom */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <HeadingSm>Weekly Attendance</HeadingSm>
                                <Caption>+2.4% from last week</Caption>
                            </View>
                            <View style={styles.graphCard}>
                                <Svg height="100" width="100%" style={{ marginBottom: spacing.sm }}>
                                    {/* Horizontal grid lines */}
                                    <Line x1="0" y1="20" x2="100%" y2="20" stroke={colors.mist} strokeWidth="1" />
                                    <Line x1="0" y1="50" x2="100%" y2="50" stroke={colors.mist} strokeWidth="1" />
                                    <Line x1="0" y1="80" x2="100%" y2="80" stroke={colors.mist} strokeWidth="1" />

                                    {/* Trend Line */}
                                    <Polyline
                                        points="0,80 40,70 80,40 120,50 160,30 200,45 240,25 280,15 320,35"
                                        fill="none"
                                        stroke={colors.cobalt}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Data points */}
                                    <Circle cx="320" cy="35" r="4" fill={colors.cobalt} />
                                </Svg>
                                <View style={styles.graphLabels}>
                                    <Caption>MON</Caption>
                                    <Caption>TUE</Caption>
                                    <Caption>WED</Caption>
                                    <Caption>THU</Caption>
                                    <Caption>FRI</Caption>
                                    <Caption>SAT</Caption>
                                    <Caption>SUN</Caption>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </ResponsiveContainer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ivory,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    greeting: {},
    date: {
        fontStyle: 'italic',
        marginTop: 2,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.charcoal,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFF',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    statCard: {
        width: '31.5%',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.subtle,
    },
    statLabel: {
        textAlign: 'center',
        fontSize: 14,
        width: '100%',
        color: colors.slate,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 22,
        fontFamily: 'PlayfairDisplay-Medium',
        textAlign: 'center',
        width: '100%',
        color: colors.charcoal,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        width: '48.5%',
        marginBottom: spacing.sm,
        ...shadows.subtle,
    },
    graphCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        ...shadows.subtle,
    },
    graphLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xs,
    },
    openGateIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionLink: {
        color: colors.cobalt,
        fontFamily: 'Inter-Medium',
    },
    healthCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.subtle,
    },
    healthItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    healthIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F9F4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    healthValue: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
    healthDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.mist,
        marginHorizontal: spacing.md,
    },
    emergencyCard: {
        backgroundColor: '#FFF1F1',
        borderWidth: 1,
        borderColor: '#FFEBEB',
        borderRadius: radius.md,
        padding: spacing.md,
        ...shadows.subtle,
    },
    emergencyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    emergencyButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    emergencyBtn: {
        flex: 1,
        height: 36,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.mist,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        ...shadows.subtle,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
        gap: spacing.sm,
    },
    activityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.slate,
        opacity: 0.3,
    },
    resultBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    userStatsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.subtle,
    },
    userStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    userStatDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.mist,
    },
    registrationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        borderWidth: 1,
        borderColor: '#E0E7FF',
        borderRadius: radius.md,
        padding: spacing.md,
        gap: spacing.md,
        ...shadows.subtle,
    },
    registrationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertBadge: {
        backgroundColor: colors.error,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    alertBadgeText: {
        color: '#FFF',
        fontFamily: 'Inter-SemiBold',
        fontSize: 11,
    },
    alertsList: {
        gap: spacing.sm,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    alertIcon: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error,
        marginRight: spacing.md,
    },
    alertIconHigh: {
        backgroundColor: colors.error,
    },
    alertCardHigh: {
        ...Platform.select({
            web: {
                boxShadow: '0 4px 10px rgba(198, 40, 40, 0.2)',
            },
            default: {
                shadowColor: colors.error,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 6,
            },
        }),
        borderColor: '#FFEBEB',
    },
    alertContent: {
        flex: 1,
    },
    alertMessage: {
        marginBottom: 2,
    },
    devicesList: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    roomList: {
        gap: spacing.md,
    },
    roomContainer: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        ...shadows.subtle,
    },
    roomHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    roomHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    roomHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deviceIndicatorGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    powerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    roomNameMain: {
        fontFamily: 'Inter-SemiBold',
    },
    roomControlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.mist,
        marginTop: spacing.xs,
        paddingTop: spacing.sm,
    },
    roomStatusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    lockLabel: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
    },
    lockStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    lockDesc: {
        fontSize: 9,
        color: colors.slate,
    },
    quickActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    quickActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    quickActionText: {
        fontSize: 12,
        color: colors.cobalt,
        fontFamily: 'Inter-Medium',
    },
    emptyPinned: {
        padding: spacing.lg,
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.slate,
    },
    deviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    statusDot: {
        width: 10, height: 10,
        borderRadius: 5,
        marginRight: spacing.md,
    },
    statusOnline: {
        backgroundColor: colors.success,
    },
    statusOffline: {
        backgroundColor: colors.error,
    },
    inlineLoading: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deviceInfo: {
        flex: 1,
    },

    deviceAction: {
        padding: spacing.sm,
    },
});
