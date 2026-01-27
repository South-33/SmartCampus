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
    HeadingSm,
    HeadingMd,
    Body,
    BodySm,
    Caption,
    ResponsiveContainer,
} from '../components';
import { DoorOpen, CircleCheckBig } from 'lucide-react-native';

import { useAppData } from '../context/AppContext';

interface DashboardScreenProps {
    onOpenGate: () => void;
    onAttendance: () => void;
    onProfile: () => void;
    onViewAllClasses: () => void;
}

// Sample class data (Placeholder until sessions are fully integrated)
const todayClasses = [
    {
        id: '1',
        name: 'CS101 — Data Structures',
        room: 'Room 305, Engineering',
        startTime: '09:00',
        endTime: '10:30',
        status: 'open',
    },
];

export const DashboardScreen = ({ onOpenGate, onAttendance, onProfile, onViewAllClasses }: DashboardScreenProps) => {
    const { viewer, cachedProfile } = useAppData();

    // Use cached profile for instant render, fallback to viewer when loaded
    const displayName = viewer?.name || cachedProfile?.name || 'User';
    const firstName = displayName.split(' ')[0];
    const avatarInitials = viewer?.name?.split(' ').map((n: string) => n[0]).join('')
        || cachedProfile?.avatarInitials
        || firstName[0];

    const insets = useSafeAreaInsets();
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

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
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.greeting}>
                            <HeadingSm>Good morning</HeadingSm>
                            <HeadingLg>{firstName}</HeadingLg>
                            <BodySm style={styles.date}>{dateStr}</BodySm>
                        </View>
                        <TouchableOpacity style={styles.avatar} onPress={onProfile} activeOpacity={0.8}>
                            <HeadingMd style={styles.avatarText}>{avatarInitials}</HeadingMd>
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
                                <DoorOpen size={22} color={colors.cobalt} strokeWidth={2} />
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
                                <CircleCheckBig size={22} color={colors.cobalt} strokeWidth={2} />
                            </View>
                            <HeadingMd style={styles.actionTitle}>Attendance</HeadingMd>
                            <Caption>Check in to class</Caption>
                        </TouchableOpacity>
                    </View>

                    {/* Today's Classes */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <HeadingSm>Today's Classes</HeadingSm>
                            <TouchableOpacity onPress={onViewAllClasses}>
                                <BodySm style={styles.sectionLink}>View all</BodySm>
                            </TouchableOpacity>
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
        marginBottom: spacing.xl,
    },
    greeting: {},
    date: {
        fontFamily: 'PlayfairDisplay-Italic',
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
