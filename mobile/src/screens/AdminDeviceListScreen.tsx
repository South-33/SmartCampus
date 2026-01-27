import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../theme';
import {
    HeadingLg,
    HeadingMd,
    HeadingSm,
    Body,
    BodySm,
    Caption,
    ResponsiveContainer,
} from '../components';
import Svg, { Path } from 'react-native-svg';
import { useAppData } from '../context/AppContext';

interface AdminDeviceListScreenProps {
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PowerIcon = ({ active }: { active: boolean }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? colors.success : colors.slate} strokeWidth={2}>
        <Path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const StatusBadge = ({ status }: { status: string }) => {
    const getStatusStyles = () => {
        switch (status) {
            case 'online':
                return { bg: '#F0F9F4', text: colors.success, label: 'ONLINE' };
            case 'active':
                return { bg: '#EBF5FF', text: colors.cobalt, label: 'ACTIVE' };
            case 'pending':
                return { bg: '#FFF9EB', text: '#B25E09', label: 'PENDING' };
            case 'offline':
                return { bg: '#FFF1F1', text: colors.error, label: 'OFFLINE' };
            default:
                return { bg: colors.mist, text: colors.slate, label: status?.toUpperCase() || 'UNKNOWN' };
        }
    };

    const styles_badge = getStatusStyles();

    return (
        <View style={[styles.badge, { backgroundColor: styles_badge.bg }]}>
            <Caption style={[styles.badgeText, { color: styles_badge.text }]}>{styles_badge.label}</Caption>
        </View>
    );
};

export const AdminDeviceListScreen = ({ onBack }: AdminDeviceListScreenProps) => {
    const insets = useSafeAreaInsets();
    const { devices, rooms } = useAppData();

    return (
        <View style={styles.container}>
            <ResponsiveContainer>
                <View style={[
                    styles.content,
                    { paddingTop: insets.top + spacing.lg }
                ]}>
                    {/* Header Row */}
                    <View style={styles.header}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <BackIcon />
                            </TouchableOpacity>
                            
                            <HeadingLg style={styles.headerTitle}>Devices</HeadingLg>
                            
                            {/* Spacer for centering */}
                            <View style={styles.headerSpacer} />
                        </View>
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={{ paddingBottom: spacing.xl }}
                        showsVerticalScrollIndicator={false}
                    >
                    <HeadingSm style={styles.sectionTitle}>ALL HARDWARE NODES</HeadingSm>
                    
                    {(devices || []).map((device: any) => {
                        const room = (rooms || []).find((r: any) => r._id === device.roomId);
                        return (
                            <TouchableOpacity key={device._id} style={styles.deviceCard} activeOpacity={0.8}>
                                <View style={styles.deviceMain}>
                                    <View style={styles.deviceHeader}>
                                        <Body style={styles.deviceName}>{device.name}</Body>
                                        <StatusBadge status={device.status} />
                                    </View>
                                    
                                    <View style={styles.deviceMeta}>
                                        <View style={styles.metaItem}>
                                            <Caption>Chip ID</Caption>
                                            <BodySm>{device.chipId}</BodySm>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Caption>Room</Caption>
                                            <BodySm>{room?.name || 'Unassigned'}</BodySm>
                                        </View>
                                    </View>
                                </View>
                                
                                <View style={styles.deviceFooter}>
                                    <Caption>Last seen: {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'Never'}</Caption>
                                    <TouchableOpacity style={styles.powerAction}>
                                        <PowerIcon active={device.status === 'online'} />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    </ScrollView>
                </View>
            </ResponsiveContainer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ivory,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: 68, // Fixed width for balancing
        height: 44,
    },
    header: {
        marginBottom: spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 68, // Same as backButton width
        height: 44,
    },
    scroll: {
        flex: 1,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    deviceCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        ...shadows.subtle,
        overflow: 'hidden',
    },
    deviceMain: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    deviceName: {
        fontFamily: 'Inter-SemiBold',
    },
    deviceMeta: {
        flexDirection: 'row',
        gap: spacing.lg,
    },
    metaItem: {
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
    },
    deviceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.ivory + '50',
    },
    powerAction: {
        padding: 4,
    },
});
