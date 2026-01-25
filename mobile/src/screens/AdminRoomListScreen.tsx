import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
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
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { mockRooms, LockStatus, mockDevices } from '../data/adminMockData';

interface AdminRoomListScreenProps {
    onBack: () => void;
    onViewRoom: (roomId: string) => void;
}

const SearchIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Circle cx="11" cy="11" r="8" />
        <Line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const FilterIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PlusIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const UserIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
    </Svg>
);

const PinIcon = ({ pinned }: { pinned: boolean }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={pinned ? colors.cobalt : "none"} stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M19 13.5l-2-2V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7.5l-2 2V15h6v5l1 1 1-1v-5h6v-1.5z" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const LockIcon = ({ status }: { status: LockStatus }) => {
    const isLocked = status !== 'unlocked';
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={isLocked ? colors.error : colors.slate} strokeWidth={2}>
            <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <Path d={isLocked ? "M7 11V7a5 5 0 0 1 10 0v4" : "M7 11V7a5 5 0 0 1 9.9-1"} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
};

const WifiIcon = ({ status }: { status: 'online' | 'offline' }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={status === 'online' ? colors.success : colors.error} strokeWidth={2}>
        <Path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" strokeLinecap="round" strokeLinejoin="round" />
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

export const AdminRoomListScreen = ({ onBack, onViewRoom }: AdminRoomListScreenProps) => {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'offline' | 'locked'>('all');

    // Simulated local state for demo purposes
    const [roomStatuses, setRoomStatuses] = useState<Record<string, LockStatus>>(
        mockRooms.reduce((acc, room) => ({ ...acc, [room.id]: room.lockStatus }), {})
    );
    const [pinnedRooms, setPinnedRooms] = useState<Record<string, boolean>>(
        mockRooms.reduce((acc, room) => ({ ...acc, [room.id]: !!room.isPinned }), {})
    );

    const filteredRooms = useMemo(() => {
        return mockRooms.filter(room => {
            const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
            const currentStatus = roomStatuses[room.id];
            
            if (filterStatus === 'locked') return matchesSearch && currentStatus === 'locked';
            if (filterStatus === 'offline') return matchesSearch && (room.connectivity.wifi === 'offline');
            
            return matchesSearch;
        });
    }, [searchQuery, filterStatus, roomStatuses]);

    const cycleLockStatus = (roomId: string) => {
        const current = roomStatuses[roomId];
        const next: LockStatus = 
            current === 'unlocked' ? 'staff_only' :
            current === 'staff_only' ? 'locked' : 'unlocked';
        
        setRoomStatuses({ ...roomStatuses, [roomId]: next });
    };

    const togglePin = (roomId: string) => {
        setPinnedRooms({ ...pinnedRooms, [roomId]: !pinnedRooms[roomId] });
    };

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
                            
                            <HeadingMd style={styles.headerTitle}>Rooms</HeadingMd>
                            
                            <View style={styles.headerSpacer} />
                        </View>

                        {/* Search and Filter */}
                        <View style={styles.searchContainer}>
                            <View style={styles.searchInputWrapper}>
                                <SearchIcon />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search rooms..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor={colors.slate}
                                />
                            </View>
                            <TouchableOpacity 
                                style={[
                                    styles.filterButton,
                                    filterStatus !== 'all' && styles.filterButtonActive
                                ]}
                                onPress={() => {
                                    const next: typeof filterStatus = 
                                        filterStatus === 'all' ? 'offline' :
                                        filterStatus === 'offline' ? 'locked' : 'all';
                                    setFilterStatus(next);
                                }}
                            >
                                <FilterIcon />
                                {filterStatus !== 'all' && (
                                    <View style={styles.filterBadge}>
                                        <Caption style={styles.filterBadgeText}>1</Caption>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                        
                        {filterStatus !== 'all' && (
                            <View style={styles.filterChipRow}>
                                <TouchableOpacity 
                                    style={styles.filterChip}
                                    onPress={() => setFilterStatus('all')}
                                >
                                    <Caption style={styles.filterChipText}>
                                        {filterStatus.toUpperCase()}
                                    </Caption>
                                    <BackIcon /> 
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={{ paddingBottom: spacing.xl }}
                        showsVerticalScrollIndicator={false}
                    >
                        <HeadingSm style={styles.sectionTitle}>
                            {filterStatus === 'all' ? 'ALL ROOMS' : `${filterStatus.toUpperCase()} ROOMS`} ({filteredRooms.length})
                        </HeadingSm>

                        <View style={styles.grid}>
                            {filteredRooms.map((room) => {
                                const currentLockStatus = roomStatuses[room.id];
                                const isPinned = pinnedRooms[room.id];
                                return (
                                    <TouchableOpacity 
                                        key={room.id} 
                                        style={styles.roomCard} 
                                        activeOpacity={0.85}
                                        onPress={() => onViewRoom(room.id)}
                                    >
                                        <View style={styles.roomHeader}>
                                            <View style={styles.roomHeaderLeft}>
                                                <View style={[
                                                    styles.powerDot,
                                                    { backgroundColor: room.powerStatus === 'on' ? colors.success : colors.slate }
                                                ]} />
                                                <HeadingSm style={styles.roomName}>{room.name}</HeadingSm>
                                            </View>
                                            <View style={styles.roomHeaderRight}>
                                                <TouchableOpacity 
                                                    activeOpacity={0.7} 
                                                    onPress={() => togglePin(room.id)}
                                                    style={styles.pinHeaderAction}
                                                >
                                                    <PinIcon pinned={isPinned} />
                                                </TouchableOpacity>
                                                <WifiIcon status={room.connectivity.wifi} />
                                                {mockDevices.filter(d => d.roomId === room.id).map(device => (
                                                    <DeviceStatusIcon 
                                                        key={device.id}
                                                        type={device.type} 
                                                        status={device.status === 'online' ? 'online' : 'offline'} 
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                        
                                        <View style={styles.roomStats}>
                                            <View style={styles.statItem}>
                                                <UserIcon />
                                                <Caption style={styles.statText}>{room.occupancy} Active</Caption>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.roomFooter}>
                                            <TouchableOpacity 
                                                style={styles.statItem}
                                                activeOpacity={0.6}
                                                onPress={() => cycleLockStatus(room.id)}
                                            >
                                                <LockIcon status={currentLockStatus} />
                                                <View style={styles.lockStatusRow}>
                                                    <Caption style={[
                                                        styles.statText, 
                                                        currentLockStatus !== 'unlocked' && { color: colors.error, fontFamily: 'Inter-Medium' }
                                                    ]}>
                                                        {currentLockStatus.replace('_', ' ').toUpperCase()}
                                                    </Caption>
                                                    {currentLockStatus === 'staff_only' && <Caption style={styles.lockDesc}>• Staff & Admins only</Caption>}
                                                    {currentLockStatus === 'locked' && <Caption style={styles.lockDesc}>• Admins only</Caption>}
                                                </View>
                                            </TouchableOpacity>

                                            <BodySm style={styles.manageLink}>View Details</BodySm>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
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
    searchContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 44,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter',
        fontSize: 14,
        color: colors.charcoal,
    },
    filterButton: {
        width: 44,
        height: 44,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterButtonActive: {
        borderColor: colors.cobalt,
        backgroundColor: '#F0F4FF',
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.cobalt,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
    },
    filterChipRow: {
        flexDirection: 'row',
        marginTop: spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cobalt,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 16,
        gap: 4,
    },
    filterChipText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
    },
    addButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        flex: 1,
    },
    sectionTitle: {
        marginBottom: spacing.md,
        color: colors.charcoal,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    roomCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
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
    connectivityGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deviceIndicatorGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    powerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    roomName: {
        fontSize: 14,
        flex: 1,
        color: colors.charcoal,
    },
    roomStats: {
        marginBottom: spacing.md,
        gap: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 11,
    },
    roomFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.mist,
        paddingTop: spacing.sm,
    },
    manageLink: {
        fontSize: 12,
        color: colors.cobalt,
        fontFamily: 'Inter-Medium',
    },
    lockAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
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
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    pinHeaderAction: {
        padding: 4,
    },
});
