import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAppData } from '../context/AppContext';
import { 
    DoorOpen, 
    ClipboardList, 
    AlertTriangle, 
    User, 
    Users, 
    CheckCircle2, 
    Clock, 
    Eye,
    EyeOff,
    Bath,
    School,
    Monitor,
    Coffee,
    Search,
    RefreshCcw
} from 'lucide-react-native';

interface StaffDashboardProps {
    onProfile: () => void;
    onViewTasks: () => void;
    onReportIssue?: (message: string) => void;
    onOpenGate: () => void;
}

const RoomIcon = ({ type, size = 20, color = colors.slate }: { type: string, size?: number, color?: string }) => {
    switch (type) {
        case 'bathroom': return <Bath size={size} color={color} />;
        case 'classroom': return <School size={size} color={color} />;
        case 'lab': return <Monitor size={size} color={color} />;
        case 'common': return <Coffee size={size} color={color} />;
        default: return <School size={size} color={color} />;
    }
};

export const StaffDashboard = ({ onProfile, onViewTasks, onReportIssue, onOpenGate }: StaffDashboardProps) => {
    const { rooms: allRooms, viewer } = useAppData();
    const insets = useSafeAreaInsets();
    const [localRooms, setLocalRooms] = useState<any[]>([]);

    useEffect(() => {
        if (allRooms) setLocalRooms(allRooms);
    }, [allRooms]);
    
    if (!viewer) return null;

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    const rooms = localRooms;

    // Filtering logic for cleaner utility
    const readyToClean = useMemo(() => 
        rooms.filter(r => r.needsCleaning && (r.occupancy || 0) === 0),
    [rooms]);

    const bathrooms = useMemo(() => 
        rooms.filter(r => r.type === 'bathroom'),
    [rooms]);

    const inUse = useMemo(() => 
        rooms.filter(r => (r.occupancy || 0) > 0),
    [rooms]);

    const cleanedToday = rooms.filter(r => !r.needsCleaning).length;

    const handleMarkCleaned = (roomId: string) => {
        Alert.alert(
            "Confirm Completion",
            "Mark this room as fully cleaned?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Mark Cleaned", 
                    onPress: () => {
                        setLocalRooms(prev => prev.map(r => 
                            r._id === roomId ? { ...r, needsCleaning: false, lastCleanedAt: 'Just now' } : r
                        ));
                    } 
                }
            ]
        );
    };

    const handleReportIssue = () => {
        Alert.prompt(
            "Report Issue",
            "Describe the issue (e.g., broken faucet, no soap):",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Report", 
                    onPress: (text?: string) => {
                        if (text && onReportIssue) {
                            onReportIssue(text);
                            Alert.alert("Success", "Issue reported to maintenance.");
                        }
                    } 
                }
            ],
            "plain-text"
        );
    };

    const RoomCard = ({ room, priority = false }: { room: any, priority?: boolean }) => (
        <View key={room._id} style={[styles.roomContainer, priority && styles.priorityRoom]}>
            <View style={styles.roomHeader}>
                <View style={styles.roomHeaderLeft}>
                    <View style={[
                        styles.pulseDot,
                        { backgroundColor: (room.occupancy || 0) > 0 ? colors.error : colors.success }
                    ]} />
                    <Body style={styles.roomName}>{room.name.toUpperCase()}</Body>
                </View>
                
                <View style={styles.roomHeaderRight}>
                    {room.needsCleaning && (
                        <View style={styles.statusBadgeWarning}>
                            <AlertTriangle size={12} color={colors.error} />
                            <Caption style={{ color: colors.error, marginLeft: 4, fontFamily: 'Inter-SemiBold', fontSize: 10 }}>NEEDS CLEANING</Caption>
                        </View>
                    )}
                </View>
            </View>

            {room.type !== 'bathroom' && (
                <View style={{ marginBottom: spacing.xs }}>
                    <View style={styles.roomStatusInfo}>
                        <Users size={14} color={colors.slate} />
                        <Caption style={styles.lockLabel}>
                            {(room.occupancy || 0)} ACTIVE
                        </Caption>
                    </View>
                </View>
            )}

            <View style={styles.roomControlsRow}>
                <View style={styles.metaInfo}>
                    <Clock size={12} color={colors.slate} />
                    <Caption style={{ marginLeft: 4, fontSize: 10, fontFamily: 'Inter-Medium' }}>LAST: {(room.lastCleanedAt || 'NEVER').toUpperCase()}</Caption>
                </View>
                
                <View>
                    {room.needsCleaning && (room.type === 'bathroom' || (room.occupancy || 0) === 0) ? (
                        <TouchableOpacity 
                            style={styles.cleanButton} 
                            onPress={() => handleMarkCleaned(room._id)}
                        >
                            <RefreshCcw size={14} color="#FFF" />
                            <BodySm style={styles.cleanButtonText}>MARK CLEANED</BodySm>
                        </TouchableOpacity>
                    ) : room.needsCleaning ? (
                        <View style={styles.waitBadge}>
                            <Clock size={14} color={colors.slate} />
                            <BodySm style={{ color: colors.slate, marginLeft: 4, fontSize: 10, fontFamily: 'Inter-SemiBold' }}>WAIT FOR EMPTY</BodySm>
                        </View>
                    ) : (
                        <View style={styles.completedBadge}>
                            <CheckCircle2 size={14} color={colors.success} />
                            <BodySm style={{ color: colors.success, marginLeft: 4, fontFamily: 'Inter-SemiBold', fontSize: 10 }}>CLEANED</BodySm>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    const ReadyToCleanSection = () => {
        if (readyToClean.length === 0) return null;
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <HeadingSm style={styles.priorityTitle}>READY TO CLEAN</HeadingSm>
                    <View style={styles.liveBadge}>
                        <View style={styles.pulseDot} />
                        <Caption style={{ color: colors.cobalt }}>LIVE RADAR</Caption>
                    </View>
                </View>
                <View style={styles.roomList}>
                    {readyToClean.map(room => <RoomCard key={room._id} room={room} priority />)}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ResponsiveContainer>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[
                        styles.content,
                        { paddingTop: Math.max(insets.top, 20) + spacing.md }
                    ]}
                    alwaysBounceVertical={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.greeting}>
                            <HeadingSm style={{ color: colors.slate }}>Staff Operations</HeadingSm>
                            <HeadingLg>Cleaning Hub</HeadingLg>
                            <BodySm style={styles.date}>{dateStr}</BodySm>
                        </View>
                        <TouchableOpacity style={styles.avatar} onPress={onProfile} activeOpacity={0.8}>
                            <User color="#FFF" size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Quick Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Caption style={styles.statLabel}>To Clean</Caption>
                            <HeadingMd style={[styles.statValue, { color: colors.error }]}>
                                {rooms.filter(r => r.needsCleaning).length}
                            </HeadingMd>
                        </View>
                        <View style={styles.statCard}>
                            <Caption style={styles.statLabel}>Cleaned</Caption>
                            <HeadingMd style={[styles.statValue, { color: colors.success }]}>
                                {cleanedToday}
                            </HeadingMd>
                        </View>
                        <View style={styles.statCard}>
                            <Caption style={styles.statLabel}>Safe Now</Caption>
                            <HeadingMd style={[styles.statValue, { color: colors.cobalt }]}>
                                {readyToClean.length}
                            </HeadingMd>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionCard} onPress={onOpenGate} activeOpacity={0.8}>
                            <View style={styles.actionIconBg}>
                                <DoorOpen size={20} color={colors.cobalt} />
                            </View>
                            <BodySm style={styles.actionLabel}>Unlock</BodySm>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={onViewTasks} activeOpacity={0.8}>
                            <View style={styles.actionIconBg}>
                                <ClipboardList size={20} color={colors.cobalt} />
                            </View>
                            <BodySm style={styles.actionLabel}>Tasks</BodySm>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={handleReportIssue} activeOpacity={0.8}>
                            <View style={[styles.actionIconBg, { backgroundColor: colors.errorBg }]}>
                                <AlertTriangle size={20} color={colors.error} />
                            </View>
                            <BodySm style={styles.actionLabel}>Report</BodySm>
                        </TouchableOpacity>
                    </View>

                    {/* READY TO CLEAN Section */}
                    <ReadyToCleanSection />

                    {/* BATHROOM MONITOR Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <HeadingSm>BATHROOM MONITOR</HeadingSm>
                            <Caption>Real-time status</Caption>
                        </View>
                        <View style={styles.roomList}>
                            {bathrooms.map(room => <RoomCard key={room._id} room={room} />)}
                        </View>
                    </View>

                    {/* IN USE Section */}
                    {inUse.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <HeadingSm style={{ color: colors.slate }}>CURRENTLY IN USE</HeadingSm>
                                <Caption>Skip for now</Caption>
                            </View>
                            <View style={styles.roomList}>
                                {inUse.filter(r => r.type !== 'bathroom').map(room => (
                                    <View key={room._id} style={[styles.roomContainer, { opacity: 0.7 }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <RoomIcon type={room.type} color={colors.slate} />
                                                <Body style={styles.roomName}>{room.name.toUpperCase()}</Body>
                                            </View>
                                            <View style={styles.statusBadgeError}>
                                                <Users size={12} color={colors.error} />
                                                <Caption style={{ color: colors.error, marginLeft: 4, fontFamily: 'Inter-SemiBold', fontSize: 10 }}>
                                                    {(room.occupancy || 0)} PPL
                                                </Caption>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
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
        paddingBottom: 80,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    greeting: {},
    date: {
        color: colors.slate,
        marginTop: 2,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.cobalt,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.subtle,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
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
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.mist,
        ...shadows.subtle,
    },
    actionIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontFamily: 'Inter-Medium',
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
    priorityTitle: {
        color: colors.cobalt,
        letterSpacing: 1,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cream,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.cobalt,
        marginRight: 6,
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
    priorityRoom: {
        ...Platform.select({
            web: {
                boxShadow: '0 8px 24px rgba(59, 94, 232, 0.15)',
            },
            default: {
                shadowColor: colors.cobalt,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 10,
            }
        })
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
    powerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    roomName: {
        fontFamily: 'Inter-SemiBold',
        color: colors.charcoal,
        fontSize: 14,
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
        color: colors.slate,
    },
    roomFooterAction: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cleanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cobalt,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.sm,
    },
    cleanButtonText: {
        color: '#FFF',
        fontFamily: 'Inter-SemiBold',
        marginLeft: 6,
        fontSize: 10,
    },
    waitBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.mist,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.sm,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statusBadgeWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF1F1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusBadgeSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.successBg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusBadgeError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.errorBg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
});
