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

interface TeacherDashboardProps {
    onOpenGate: () => void;
    onProfile: () => void;
}

// Icons
const DoorIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M3 21h18M9 21V3h12v18" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="15" cy="12" r="1" fill={colors.cobalt} stroke="none" />
    </Svg>
);

const ScanInIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth={2}>
        <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13 12H3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ScanOutIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth={2}>
        <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ClassIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Rect x="3" y="4" width="18" height="18" rx="2" />
        <Path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </Svg>
);

const RosterIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="9" cy="7" r="4" />
        <Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// Sample class data for teacher
const todayClasses = [
    {
        id: '1',
        name: 'CS101 — Data Structures',
        room: 'Room 305',
        time: '09:00 – 10:30',
        attended: 28,
        total: 32,
        status: 'completed',
    },
    {
        id: '2',
        name: 'CS201 — Algorithms',
        room: 'Room 305',
        time: '11:00 – 12:30',
        attended: 15,
        total: 30,
        status: 'ongoing',
    },
    {
        id: '3',
        name: 'CS301 — Database Systems',
        room: 'Room 408',
        time: '14:00 – 15:30',
        attended: 0,
        total: 25,
        status: 'upcoming',
    },
];

export const TeacherDashboard = ({ onOpenGate, onProfile }: TeacherDashboardProps) => {
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
                        <HeadingSm>Good morning</HeadingSm>
                        <HeadingLg>Prof. Williams</HeadingLg>
                        <BodySm style={styles.date}>{dateStr}</BodySm>
                    </View>
                    <TouchableOpacity style={styles.avatar} onPress={onProfile} activeOpacity={0.8}>
                        <HeadingMd style={styles.avatarText}>W</HeadingMd>
                    </TouchableOpacity>
                </View>

                {/* Scan IN/OUT Section */}
                <View style={styles.scanSection}>
                    <View style={styles.scanRow}>
                        <TouchableOpacity style={styles.scanCard} activeOpacity={0.85}>
                            <View style={[styles.scanIcon, styles.scanInIcon]}>
                                <ScanInIcon />
                            </View>
                            <HeadingMd style={styles.scanTitle}>Scan IN</HeadingMd>
                            <Caption>Start teaching</Caption>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.scanCard} activeOpacity={0.85}>
                            <View style={[styles.scanIcon, styles.scanOutIcon]}>
                                <ScanOutIcon />
                            </View>
                            <HeadingMd style={styles.scanTitle}>Scan OUT</HeadingMd>
                            <Caption>End session</Caption>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Actions Row */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionMini} onPress={onOpenGate} activeOpacity={0.85}>
                        <DoorIcon />
                        <BodySm>Open Gate</BodySm>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionMini} activeOpacity={0.85}>
                        <RosterIcon />
                        <BodySm>Roster</BodySm>
                    </TouchableOpacity>
                </View>

                {/* Today's Classes */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <HeadingSm>Today's Classes</HeadingSm>
                        <BodySm style={styles.sectionLink}>View all</BodySm>
                    </View>

                    <View style={styles.classList}>
                        {todayClasses.map((cls) => (
                            <TouchableOpacity key={cls.id} style={styles.classCard} activeOpacity={0.8}>
                                <View style={styles.classHeader}>
                                    <Body style={styles.className}>{cls.name}</Body>
                                    <View style={[
                                        styles.statusBadge,
                                        cls.status === 'ongoing' && styles.statusOngoing,
                                        cls.status === 'completed' && styles.statusCompleted,
                                    ]}>
                                        <Caption style={[
                                            styles.statusText,
                                            cls.status === 'ongoing' && styles.statusTextOngoing,
                                            cls.status === 'completed' && styles.statusTextCompleted,
                                        ]}>
                                            {cls.status === 'ongoing' ? 'LIVE' : cls.status === 'completed' ? 'DONE' : 'UPCOMING'}
                                        </Caption>
                                    </View>
                                </View>
                                <Caption>{cls.room} · {cls.time}</Caption>

                                {/* Attendance Bar */}
                                <View style={styles.attendanceRow}>
                                    <View style={styles.attendanceBar}>
                                        <View style={[
                                            styles.attendanceFill,
                                            { width: `${(cls.attended / cls.total) * 100}%` }
                                        ]} />
                                    </View>
                                    <Caption style={styles.attendanceCount}>
                                        {cls.attended}/{cls.total}
                                    </Caption>
                                </View>
                            </TouchableOpacity>
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
        marginBottom: spacing.xl,
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
        backgroundColor: colors.cobalt,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFF',
    },
    scanSection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    scanRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    scanCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        ...shadows.subtle,
    },
    scanIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    scanInIcon: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    scanOutIcon: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    scanTitle: {
        fontSize: 16,
        marginBottom: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    actionMini: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        ...shadows.subtle,
    },
    section: {
        marginBottom: spacing.lg,
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
    classList: {
        gap: spacing.sm,
    },
    classCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    className: {
        fontFamily: 'PlayfairDisplay-Medium',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: colors.cream,
    },
    statusOngoing: {
        backgroundColor: colors.cobalt,
    },
    statusCompleted: {
        backgroundColor: colors.success,
    },
    statusText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        letterSpacing: 0.5,
        color: colors.slate,
    },
    statusTextOngoing: {
        color: '#FFF',
    },
    statusTextCompleted: {
        color: '#FFF',
    },
    attendanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    attendanceBar: {
        flex: 1,
        height: 6,
        backgroundColor: colors.mist,
        borderRadius: 3,
        overflow: 'hidden',
    },
    attendanceFill: {
        height: '100%',
        backgroundColor: colors.cobalt,
        borderRadius: 3,
    },
    attendanceCount: {
        color: colors.cobalt,
        fontFamily: 'Inter-Medium',
        minWidth: 40,
        textAlign: 'right',
    },
});
