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
import Svg, { Path, Circle } from 'react-native-svg';

interface DashboardScreenProps {
    onOpenGate: () => void;
    onAttendance: () => void;
    onProfile: () => void;
}

// Icons
const DoorIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M3 21h18M9 21V3h12v18" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="15" cy="12" r="1" fill={colors.cobalt} stroke="none" />
    </Svg>
);

const CheckIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="12" cy="12" r="9" />
    </Svg>
);

// Sample class data
const todayClasses = [
    {
        id: '1',
        name: 'CS101 — Data Structures',
        room: 'Room 305, Engineering',
        startTime: '09:00',
        endTime: '10:30',
        status: 'open',
    },
    {
        id: '2',
        name: 'MATH201 — Linear Algebra',
        room: 'Room 112, Science',
        startTime: '11:00',
        endTime: '12:30',
        status: 'upcoming',
    },
    {
        id: '3',
        name: 'ENG105 — Technical Writing',
        room: 'Room 408, Liberal Arts',
        startTime: '14:00',
        endTime: '15:30',
        status: 'upcoming',
    },
];

export const DashboardScreen = ({ onOpenGate, onAttendance, onProfile }: DashboardScreenProps) => {
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
                        <HeadingLg>Jonathan</HeadingLg>
                        <BodySm style={styles.date}>{dateStr}</BodySm>
                    </View>
                    <TouchableOpacity style={styles.avatar} onPress={onProfile} activeOpacity={0.8}>
                        <HeadingMd style={styles.avatarText}>J</HeadingMd>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={onOpenGate}
                        activeOpacity={0.85}
                    >
                        <View style={styles.actionIcon}>
                            <DoorIcon />
                        </View>
                        <HeadingMd style={styles.actionTitle}>Open Gate</HeadingMd>
                        <Caption>Tap to unlock door</Caption>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={onAttendance}
                        activeOpacity={0.85}
                    >
                        <View style={styles.actionIcon}>
                            <CheckIcon />
                        </View>
                        <HeadingMd style={styles.actionTitle}>Attendance</HeadingMd>
                        <Caption>Check in to class</Caption>
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
                            <View key={cls.id} style={styles.classCard}>
                                <View style={styles.classTime}>
                                    <HeadingMd style={styles.timeStart}>{cls.startTime}</HeadingMd>
                                    <Caption>{cls.endTime}</Caption>
                                </View>
                                <View style={styles.classInfo}>
                                    <Body style={styles.className}>{cls.name}</Body>
                                    <Caption>{cls.room}</Caption>
                                    <View style={[styles.status, cls.status === 'open' && styles.statusOpen]}>
                                        <View style={[styles.statusDot, cls.status === 'open' && styles.statusDotOpen]} />
                                        <Caption style={cls.status === 'open' ? styles.statusTextOpen : undefined}>
                                            {cls.status === 'open' ? 'Attendance Open' : 'Upcoming'}
                                        </Caption>
                                    </View>
                                </View>
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
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        ...shadows.subtle,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    actionTitle: {
        fontSize: 18,
        marginBottom: 2,
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
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
    },
    classTime: {
        minWidth: 60,
        alignItems: 'flex-end',
        paddingRight: spacing.sm,
        borderRightWidth: 2,
        borderRightColor: colors.cobalt,
        marginRight: spacing.md,
    },
    timeStart: {
        fontSize: 18,
        lineHeight: 22,
    },
    classInfo: {
        flex: 1,
    },
    className: {
        fontFamily: 'PlayfairDisplay-Medium',
        marginBottom: 2,
    },
    status: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    statusOpen: {},
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.slate,
    },
    statusDotOpen: {
        backgroundColor: colors.cobalt,
    },
    statusTextOpen: {
        color: colors.cobalt,
        fontFamily: 'Inter-SemiBold',
        textTransform: 'uppercase',
        fontSize: 10,
        letterSpacing: 0.5,
    },
});
