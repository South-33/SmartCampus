import React, { useState, useMemo } from 'react';
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
    CalendarStrip,
    AcademicCalendarModal,
} from '../components';
import { 
    Calendar as CalendarIcon, 
    User as UserIcon, 
    ChevronDown as ChevronDownIcon, 
    Clock as ClockIcon, 
    Flame as FlameIcon, 
    AlertCircle as AlertCircleIcon, 
    CheckCircle as CheckCircleIcon, 
    MapPin as MapPinIcon 
} from 'lucide-react-native';
import { getTermInfo } from '../data/academicUtils';
import { useAppData } from '../context/AppContext';

interface ClassesScreenProps {
    onBack?: () => void;
}

// --- Components ---

const CourseCard = ({ course }: { course: any }) => {
    const [expanded, setExpanded] = useState(false);
    
    const color = course.color || colors.cobalt;
    const nextClassInfo = course.nextClass || { day: 'N/A', time: 'N/A', room: 'N/A' };

    return (
        <TouchableOpacity 
            style={[styles.courseCard, expanded && styles.courseCardExpanded]} 
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.9}
        >
            <View style={styles.courseTop}>
                <View style={styles.courseIdentity}>
                    <View style={styles.codeRow}>
                        <Caption style={styles.courseCode}>{course.code}</Caption>
                    </View>
                    <HeadingMd style={styles.courseName}>{course.name}</HeadingMd>
                </View>
                <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                    <ChevronDownIcon color={colors.slate} />
                </View>
            </View>

            <View style={styles.courseMeta}>
                <View style={styles.metaItem}>
                    <UserIcon size={12} color={colors.slate} />
                    <Caption style={styles.metaText}>{course.professor}</Caption>
                </View>
            </View>

            <View style={styles.nextClassRow}>
                <View style={styles.metaItem}>
                    <ClockIcon size={12} color={colors.slate} />
                    <Caption style={styles.metaText}>Next: {nextClassInfo.day} {nextClassInfo.time}</Caption>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <MapPinIcon size={12} color={colors.slate} />
                    <Caption style={styles.metaText}>{nextClassInfo.room}</Caption>
                </View>
            </View>

            {expanded && (
                <View style={styles.expandedContent}>
                    <View style={styles.expandedSection}>
                        <HeadingSm style={styles.expandedSectionTitle}>COURSE DETAILS</HeadingSm>
                        <BodySm style={{ color: colors.slate }}>
                            Course ID: {course._id}
                        </BodySm>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
};

export const ClassesScreen = () => {
    const insets = useSafeAreaInsets();
    const { studentStats, homeroomSchedule, todaySessions } = useAppData();
    const today = useMemo(() => new Date(), []);
    const [selectedDate, setSelectedDate] = useState(today.getDate());
    const [showCalendar, setShowCalendar] = useState(false);
    
    const viewMonth = today.getMonth();
    const viewYear = today.getFullYear();
    
    const termInfo = useMemo(() => getTermInfo(viewMonth, viewYear), [viewMonth, viewYear]);
    const currentAcademicYear = viewYear.toString();

    // Derived Data
    const metrics = studentStats || {
        currentStreak: 0,
        weekAttended: 0,
        weekTotal: 1,
        overallPercent: 0,
        status: 'at_risk',
    };

    const nextClass = todaySessions?.find(s => s.status === 'upcoming' || s.status === 'open') || null;

    return (
        <View style={styles.container}>
            <ResponsiveContainer>
                <ScrollView 
                    style={styles.scroll} 
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + spacing.lg }
                    ]} 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <HeadingLg style={styles.headerTitle}>{termInfo.name}</HeadingLg>
                            <Caption style={styles.headerSubtitle}>Academic Year {currentAcademicYear}</Caption>
                        </View>
                        <TouchableOpacity 
                            style={styles.calendarButton} 
                            onPress={() => setShowCalendar(true)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <CalendarIcon color={colors.cobalt} />
                        </TouchableOpacity>
                    </View>

                    <CalendarStrip 
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />

                    <View style={styles.mainContent}>
                        {nextClass && (
                            <View style={styles.nextClassContainer}>
                                <View style={styles.nextClassBadge}>
                                    <ClockIcon size={12} color={colors.cobalt} />
                                    <Caption style={styles.nextClassBadgeText}>NEXT CLASS AT {nextClass.startTime}</Caption>
                                </View>
                                <View style={styles.nextClassInfo}>
                                    <HeadingSm style={styles.nextClassName}>{nextClass.subjectName}</HeadingSm>
                                    <Caption style={styles.nextClassRoom}>{nextClass.homeroomName}</Caption>
                                </View>
                            </View>
                        )}

                        <View style={styles.academicOverview}>
                            <View style={styles.overviewHeader}>
                                <HeadingSm style={styles.overviewTitle}>ATTENDANCE OVERVIEW</HeadingSm>
                                <View style={styles.statusBadgeLarge}>
                                    <View style={[styles.statusDot, { backgroundColor: metrics.status === 'good' ? colors.success : colors.error }]} />
                                    <Caption style={[styles.statusTextLarge, { color: metrics.status === 'good' ? colors.success : colors.error }]}>
                                        {metrics.status === 'good' ? 'In Good Standing' : 'At Risk'}
                                    </Caption>
                                </View>
                            </View>
                            <View style={styles.statsGrid}>
                                <View style={styles.statBox}>
                                    <View style={styles.statValueRow}>
                                        <FlameIcon size={18} color={metrics.currentStreak > 0 ? "#D97706" : colors.slate} />
                                        <HeadingMd style={styles.statValue}>{metrics.currentStreak}</HeadingMd>
                                    </View>
                                    <Caption>Streak</Caption>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <HeadingMd style={styles.statValue}>{metrics.weekAttended}/{metrics.weekTotal}</HeadingMd>
                                    <Caption>Attendance</Caption>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <HeadingMd style={[styles.statValue, { color: colors.cobalt }]}>{metrics.overallPercent}%</HeadingMd>
                                    <Caption>Overall</Caption>
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <HeadingSm style={styles.sectionTitle}>Enrolled Classes</HeadingSm>
                            </View>
                            <View style={styles.classList}>
                                {homeroomSchedule && homeroomSchedule.length > 0 ? homeroomSchedule.map((course: any) => (
                                    <CourseCard key={course._id} course={{
                                        ...course,
                                        name: course.subjectName,
                                        professor: course.teacherName,
                                        nextClass: { day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][course.dayOfWeek - 1], time: course.startTime, room: course.homeroomName }
                                    }} />
                                )) : (
                                    <BodySm style={{ color: colors.slate, textAlign: 'center', marginTop: spacing.lg }}>
                                        No courses found for your major.
                                    </BodySm>
                                )}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </ResponsiveContainer>

            <AcademicCalendarModal 
                visible={showCalendar}
                onClose={() => setShowCalendar(false)}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />
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
    scrollContent: {
        paddingBottom: spacing.xxl, 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    headerLeft: {
        flex: 1,
    },
    headerSubtitle: {
        fontSize: 10,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: colors.slate,
        marginTop: 4,
    },
    headerTitle: {
    },
    calendarButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextClassContainer: {
        padding: spacing.md,
        backgroundColor: colors.cream,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.mist,
        marginBottom: spacing.xl,
    },
    nextClassBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    nextClassBadgeText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        color: colors.cobalt,
        letterSpacing: 0.5,
    },
    nextClassInfo: {
        flexDirection: 'column',
    },
    nextClassName: {
        fontSize: 14,
        marginBottom: 2,
    },
    nextClassRoom: {
        fontSize: 12,
    },
    mainContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    academicOverview: {
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.mist,
        marginBottom: spacing.xl,
        ...shadows.subtle,
    },
    overviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.ivory,
    },
    overviewTitle: {
        fontSize: 10,
        letterSpacing: 1,
        color: colors.slate,
    },
    statusBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 100,
        backgroundColor: colors.ivory,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusTextLarge: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 22,
        marginBottom: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.mist,
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
    sectionTitle: {
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: colors.slate,
    },
    alertsContainer: {
        gap: spacing.sm,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderRadius: radius.sm,
    },
    alertContent: {
        flex: 1,
    },
    alertCourse: {
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    alertMessage: {
        fontSize: 11,
    },
    classList: {
        gap: spacing.sm,
    },
    courseCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.sm,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.subtle,
    },
    courseCardExpanded: {
        borderColor: colors.cobalt,
    },
    courseTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    courseIdentity: {
        flex: 1,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    courseCode: {
        fontSize: 11,
        letterSpacing: 0.5,
    },
    atRiskBadge: {
        backgroundColor: colors.error,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    atRiskBadgeText: {
        fontSize: 8,
        color: '#FFF',
        fontFamily: 'Inter-Bold',
    },
    courseName: {
        fontSize: 20,
        lineHeight: 24,
    },
    courseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    nextClassRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 12,
    },
    metaDivider: {
        width: 1,
        height: 10,
        backgroundColor: colors.mist,
    },
    attendanceSection: {
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.ivory,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: colors.mist,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    attendancePercent: {
        fontSize: 12,
        fontFamily: 'Inter-Bold',
        minWidth: 38,
        textAlign: 'right',
    },
    expandedContent: {
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.ivory,
        gap: spacing.lg,
    },
    expandedSection: {
        gap: spacing.sm,
    },
    expandedSectionTitle: {
        fontSize: 10,
        letterSpacing: 1,
        color: colors.slate,
        marginBottom: 4,
    },
    scheduleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    scheduleDay: {
        width: 40,
        fontFamily: 'Inter-SemiBold',
    },
    scheduleTime: {
        flex: 1,
    },
    scheduleRoom: {
        color: colors.slate,
    },
    patternHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    streakText: {
        color: '#D97706',
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
    },
    riskWarningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.error + '10',
        padding: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.error + '20',
    },
    riskWarningText: {
        color: colors.error,
        flex: 1,
    },
    logRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.ivory,
    },
    logDate: {
        width: 60,
        fontFamily: 'Inter-Medium',
    },
    logTime: {
        flex: 1,
        color: colors.slate,
    },
    logStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    logStatusText: {
        fontSize: 9,
        fontFamily: 'Inter-Bold',
    },
});
