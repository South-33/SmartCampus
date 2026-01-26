import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../../theme';
import {
    HeadingLg,
    HeadingSm,
    HeadingMd,
    BodySm,
    Caption,
    ResponsiveContainer,
} from '../../components';
import { useAppData } from '../../context/AppContext';
import {
    AttendanceAlertBanner,
    LiveAttendanceCard,
    TeachingHoursWidget,
} from '../../components/teacher';
import Svg, { Path, Circle } from 'react-native-svg';

interface TeacherDashboardProps {
    onOpenGate: () => void;
    onAttendance: () => void;
    onProfile: () => void;
    onViewClass: (classId: string) => void;
    onViewHours: () => void;
}

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

export const TeacherDashboard = ({ onOpenGate, onAttendance, onProfile, onViewClass, onViewHours }: TeacherDashboardProps) => {
    const { viewer } = useAppData();
    
    if (!viewer) return null;

    const teacherName = viewer.name?.split(' ')[1] || 'Teacher';
    const teacherAvatar = viewer?.name?.split(' ').map((n: string) => n[0]).join('') || 'T';

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
                        { paddingTop: Math.max(insets.top, 20) + spacing.md }
                    ]}
                    alwaysBounceVertical={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.greeting}>
                            <HeadingSm>Good morning</HeadingSm>
                            <HeadingLg>{teacherName}</HeadingLg>
                            <BodySm style={styles.date}>{dateStr}</BodySm>
                        </View>
                        <TouchableOpacity style={styles.avatar} onPress={onProfile} activeOpacity={0.8}>
                            <HeadingMd style={styles.avatarText}>{teacherAvatar}</HeadingMd>
                        </TouchableOpacity>
                    </View>

                    {/* Primary Actions */}
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
                            <Caption>Log teaching session</Caption>
                        </TouchableOpacity>
                    </View>

                    {/* Scan Status & Hours */}
                    <TeachingHoursWidget 
                        thisWeek={12.5} 
                        target={20} 
                        status={'teaching'}
                        onPress={onViewHours}
                    />

                    {/* Live Class Widget - Placeholder */}
                    <LiveAttendanceCard 
                        courseName={"Data Structures"}
                        room={"Room 305"}
                        present={28}
                        total={32}
                        onPress={() => {}}
                    />

                    {/* Alerts */}
                    <AttendanceAlertBanner alerts={[]} />
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
        paddingBottom: 96,
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
});
