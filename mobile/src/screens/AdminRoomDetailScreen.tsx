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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { mockRooms, mockDevices, DeviceStatus, LockStatus } from '../data/adminMockData';

interface AdminRoomDetailScreenProps {
    roomId: string;
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PowerIcon = ({ active }: { active: boolean }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? colors.success : colors.slate} strokeWidth={2}>
        <Path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const UnlockIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <Path d="M7 11V7a5 5 0 0 1 9.9-1" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const StatusBadge = ({ status }: { status: DeviceStatus }) => {
    const isOnline = status === 'online';
    return (
        <View style={[styles.badge, { backgroundColor: isOnline ? colors.successBg : colors.errorBg }]}>
            <Caption style={{ color: isOnline ? colors.success : colors.error, fontSize: 10, fontFamily: 'Inter-SemiBold' }}>
                {status.toUpperCase()}
            </Caption>
        </View>
    );
};

const DeviceIcon = ({ type, color }: { type: 'gatekeeper' | 'watchman', color: string }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
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

const LockIconSmall = ({ active }: { active: boolean }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? colors.error : colors.slate} strokeWidth={2}>
        <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <Path d={active ? "M7 11V7a5 5 0 0 1 10 0v4" : "M7 11V7a5 5 0 0 1 9.9-1"} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const AdminRoomDetailScreen = ({ roomId, onBack }: AdminRoomDetailScreenProps) => {
    const insets = useSafeAreaInsets();
    const room = mockRooms.find(r => r.id === roomId);
    const devices = mockDevices.filter(d => d.roomId === roomId);

    if (!room) return null;

    return (
        <View style={styles.container}>
            <ResponsiveContainer>
                <View style={[
                    styles.content,
                    { paddingTop: Math.max(insets.top, 20) + spacing.md }
                ]}>
                    {/* Header Row */}
                    <View style={styles.header}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity style={styles.backButton} onPress={onBack}>
                                <BackIcon />
                                <BodySm>Back</BodySm>
                            </TouchableOpacity>
                            
                            <HeadingMd style={styles.headerTitle}>Room Details</HeadingMd>
                            
                            {/* Spacer for centering */}
                            <View style={styles.headerSpacer} />
                        </View>
                    </View>

                    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
                        {/* Room Info Card */}
                    <View style={styles.roomCard}>
                        <HeadingSm>PHYSICAL SPACE</HeadingSm>
                        <HeadingMd style={styles.roomName}>{room.name}</HeadingMd>
                        <View style={styles.roomMeta}>
                            <View style={styles.metaItem}>
                                <Caption>Occupancy</Caption>
                                <Body>{room.occupancy} People</Body>
                            </View>
                            <View style={styles.metaItem}>
                                <Caption>Access Level</Caption>
                                <Body style={{ 
                                    color: room.lockStatus === 'unlocked' ? colors.success : colors.error,
                                    fontFamily: 'Inter-SemiBold'
                                }}>
                                    {room.lockStatus.replace('_', ' ').toUpperCase()}
                                </Body>
                            </View>
                        </View>
                    </View>

                    {/* Lock Controls */}
                    <HeadingSm style={styles.sectionTitle}>LOCK STATUS</HeadingSm>
                    <View style={styles.lockSelector}>
                        {(['unlocked', 'staff_only', 'locked'] as LockStatus[]).map((status) => (
                            <TouchableOpacity 
                                key={status} 
                                style={[
                                    styles.lockTab, 
                                    room.lockStatus === status && styles.lockTabActive,
                                    room.lockStatus === status && status !== 'unlocked' && styles.lockTabActiveError
                                ]}
                            >
                                <BodySm style={[
                                    styles.lockTabText, 
                                    room.lockStatus === status && styles.lockTabTextActive
                                ]}>
                                    {status.split('_')[0].toUpperCase()}
                                </BodySm>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Quick Controls */}
                    <HeadingSm style={styles.sectionTitle}>REMOTE ACTIONS</HeadingSm>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <UnlockIcon />
                            <BodySm style={styles.actionBtnText}>Unlock Door</BodySm>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <PowerIcon active={room.powerStatus === 'on'} />
                            <BodySm style={styles.actionBtnText}>Toggle Power</BodySm>
                        </TouchableOpacity>
                    </View>

                    {/* Connected Devices */}
                    <HeadingSm style={styles.sectionTitle}>CONNECTED HARDWARE</HeadingSm>
                    {devices.map((device) => (
                        <View key={device.id} style={styles.deviceCard}>
                            <View style={styles.deviceHeader}>
                                <View style={styles.deviceTitleGroup}>
                                    <DeviceIcon 
                                        type={device.type} 
                                        color={device.status === 'online' ? colors.success : colors.error} 
                                    />
                                    <View>
                                        <Body style={styles.deviceName}>{device.name}</Body>
                                        <Caption>{device.type.toUpperCase()}</Caption>
                                    </View>
                                </View>
                                <StatusBadge status={device.status} />
                            </View>
                            
                            <View style={styles.deviceDetails}>
                                <View style={styles.detailRow}>
                                    <Caption>Chip ID</Caption>
                                    <BodySm>{device.chipId}</BodySm>
                                </View>
                                <View style={styles.detailRow}>
                                    <Caption>Firmware</Caption>
                                    <BodySm>v{device.firmwareVersion}</BodySm>
                                </View>
                                <View style={styles.detailRow}>
                                    <Caption>Last Seen</Caption>
                                    <BodySm>{device.lastSeen}</BodySm>
                                </View>
                            </View>

                            <View style={styles.deviceActions}>
                                <TouchableOpacity style={styles.deviceActionBtn}>
                                    <BodySm style={styles.deviceActionText}>Reboot Node</BodySm>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deviceActionBtn}>
                                    <BodySm style={styles.deviceActionText}>Update Firmware</BodySm>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {devices.length === 0 && (
                        <View style={styles.emptyCard}>
                            <Caption>No hardware devices linked to this room.</Caption>
                        </View>
                    )}
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
        paddingTop: spacing.xl,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: 80, // Fixed width for balancing
    },
    header: {
        marginBottom: spacing.xl,
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
        width: 80, // Same as backButton width
    },
    scroll: {
        flex: 1,
    },
    roomCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        ...shadows.subtle,
    },
    roomName: {
        marginVertical: 4,
    },
    roomMeta: {
        flexDirection: 'row',
        marginTop: spacing.md,
        gap: spacing.lg,
    },
    metaItem: {
        flex: 1,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    actionRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        ...shadows.subtle,
    },
    actionBtnText: {
        fontFamily: 'Inter-Medium',
    },
    lockSelector: {
        flexDirection: 'row',
        backgroundColor: colors.mist,
        borderRadius: radius.md,
        padding: 4,
        marginBottom: spacing.lg,
    },
    lockTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: radius.sm,
    },
    lockTabActive: {
        backgroundColor: colors.cobalt,
    },
    lockTabActiveError: {
        backgroundColor: colors.error,
    },
    lockTabText: {
        color: colors.slate,
        fontFamily: 'Inter-Medium',
    },
    lockTabTextActive: {
        color: '#FFF',
    },
    deviceCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.subtle,
    },
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    deviceTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deviceName: {
        fontFamily: 'Inter-SemiBold',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    deviceDetails: {
        backgroundColor: colors.ivory,
        borderRadius: radius.sm,
        padding: spacing.sm,
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    deviceActions: {
        flexDirection: 'row',
        marginTop: spacing.md,
        gap: spacing.md,
    },
    deviceActionBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.mist,
    },
    deviceActionText: {
        color: colors.cobalt,
        fontFamily: 'Inter-Medium',
    },
    emptyCard: {
        padding: spacing.xl,
        alignItems: 'center',
    },
});
