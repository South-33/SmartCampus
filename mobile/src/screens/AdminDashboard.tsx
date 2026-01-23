import React from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { colors, spacing, radius, shadows } from '../theme';
import {
    HeadingLg,
    HeadingSm,
    HeadingMd,
    Body,
    BodySm,
    Caption,
} from '../components';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface AdminDashboardProps {
    onProfile: () => void;
}

// Icons
const DeviceIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Rect x="4" y="4" width="16" height="16" rx="2" />
        <Path d="M9 9h6v6H9z" strokeLinecap="round" />
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

// Sample device data
const devices = [
    { id: '1', name: 'Room 305 Door', status: 'online', lastSeen: '2 min ago' },
    { id: '2', name: 'Room 305 Radar', status: 'online', lastSeen: '2 min ago' },
    { id: '3', name: 'Room 408 Door', status: 'offline', lastSeen: '15 min ago' },
    { id: '4', name: 'Room 112 Door', status: 'online', lastSeen: '1 min ago' },
];

// Sample alerts
const alerts = [
    { id: '1', type: 'device', message: 'Room 408 Door offline', time: '15 min ago', priority: 'high' },
    { id: '2', type: 'suspicious', message: 'Device used by 2 accounts', time: '1 hr ago', priority: 'high' },
    { id: '3', type: 'gps', message: 'GPS mismatch: John Doe', time: '2 hrs ago', priority: 'medium' },
];

// Stats
const stats = [
    { label: 'Active Users', value: '847', change: '+12' },
    { label: 'Devices Online', value: '23/25', change: '' },
    { label: 'Today\'s Scans', value: '1,234', change: '+89' },
];

export const AdminDashboard = ({ onProfile }: AdminDashboardProps) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                alwaysBounceVertical={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.greeting}>
                        <HeadingSm>Admin Panel</HeadingSm>
                        <HeadingLg>Kingsford</HeadingLg>
                        <BodySm style={styles.date}>{dateStr}</BodySm>
                    </View>
                    <TouchableOpacity style={styles.avatar} onPress={onProfile} activeOpacity={0.8}>
                        <HeadingMd style={styles.avatarText}>A</HeadingMd>
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {stats.map((stat, idx) => (
                        <View key={idx} style={styles.statCard}>
                            <Caption>{stat.label}</Caption>
                            <HeadingMd style={styles.statValue}>{stat.value}</HeadingMd>
                            {stat.change && (
                                <Caption style={styles.statChange}>{stat.change}</Caption>
                            )}
                        </View>
                    ))}
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={[styles.actionCard, styles.actionCardResponsive]} activeOpacity={0.85}>
                        <DeviceIcon />
                        <BodySm>Devices</BodySm>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionCard, styles.actionCardResponsive]} activeOpacity={0.85}>
                        <UsersIcon />
                        <BodySm>Users</BodySm>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionCard, styles.actionCardResponsive]} activeOpacity={0.85}>
                        <LogsIcon />
                        <BodySm>Logs</BodySm>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionCard, styles.actionCardResponsive]} activeOpacity={0.85}>
                        <UnlockIcon />
                        <BodySm>Unlock</BodySm>
                    </TouchableOpacity>
                </View>

                {/* Alerts Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <HeadingSm>Alerts</HeadingSm>
                        <View style={styles.alertBadge}>
                            <Caption style={styles.alertBadgeText}>{alerts.length}</Caption>
                        </View>
                    </View>

                    <View style={styles.alertsList}>
                        {alerts.map((alert) => (
                            <TouchableOpacity key={alert.id} style={styles.alertCard} activeOpacity={0.8}>
                                <View style={[
                                    styles.alertIcon,
                                    alert.priority === 'high' && styles.alertIconHigh,
                                ]}>
                                    <AlertIcon />
                                </View>
                                <View style={styles.alertContent}>
                                    <Body style={styles.alertMessage}>{alert.message}</Body>
                                    <Caption>{alert.time}</Caption>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Devices Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <HeadingSm>Devices</HeadingSm>
                        <BodySm style={styles.sectionLink}>View all</BodySm>
                    </View>

                    <View style={styles.devicesList}>
                        {devices.map((device) => (
                            <View key={device.id} style={styles.deviceRow}>
                                <View style={[
                                    styles.statusDot,
                                    device.status === 'online' && styles.statusOnline,
                                    device.status === 'offline' && styles.statusOffline,
                                ]} />
                                <View style={styles.deviceInfo}>
                                    <Body>{device.name}</Body>
                                    <Caption>{device.lastSeen}</Caption>
                                </View>
                                <TouchableOpacity style={styles.deviceAction}>
                                    <PowerIcon />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
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
        paddingTop: spacing.xl,
        paddingBottom: 0,
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
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.charcoal,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFF',
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.subtle,
    },
    statValue: {
        fontSize: 20,
        marginTop: 4,
    },
    statChange: {
        color: colors.success,
        fontFamily: 'Inter-Medium',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
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
        ...shadows.subtle,
    },
    actionCardResponsive: {
        minWidth: '45%',
        flexGrow: 1,
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
        padding: spacing.md,
    },
    alertIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    alertIconHigh: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
    deviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.md,
    },
    statusOnline: {
        backgroundColor: colors.success,
    },
    statusOffline: {
        backgroundColor: colors.error,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceAction: {
        padding: spacing.sm,
    },
});
