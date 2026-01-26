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

interface ClassesScreenProps {
    onBack?: () => void;
}

// --- Placeholders (To be replaced by real queries) ---

const nextClass = {
    code: 'CS101',
    name: 'Data Structures',
    room: 'Room 305',
    startTime: '09:00',
    minutesUntil: 45,
};

const attendanceMetrics = {
    currentStreak: 0,
    weekAttended: 0,
    weekTotal: 0,
    overallPercent: 0,
    status: 'good',
};

const enrolledCourses: any[] = [];
const attendanceAlerts: any[] = [];

// --- Components ---

const CourseCard = ({ course }: { course: any }) => {
    const [expanded, setExpanded] = useState(false);
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return colors.success;
            case 'late': return '#F59E0B';
            case 'absent': return colors.error;
            default: return colors.slate;
        }
    };

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
                        {course.isAtRisk && (
                            <View style={styles.atRiskBadge}>
                                <AlertCircleIcon size={10} color="#FFF" />
                                <Caption style={styles.atRiskBadgeText}>AT RISK</Caption>
                            </View>
                        )}
                    </View>
                    <HeadingMd style={styles.courseName}>{course.name}</HeadingMd>
                </View>
                <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                    <ChevronDownIcon color={colors.slate} />
                </View>
            </View>

            <View style={styles.courseMeta}>
                <View style={styles.metaItem}>
                    <UserIcon />
                    <Caption style={styles.metaText}>{course.professor}</Caption>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <Caption style={styles.metaText}>{course.classesAttended}/{course.classesTotal} lectures</Caption>
                </View>
            </View>

            <View style={styles.nextClassRow}>
                <View style={styles.metaItem}>
                    <ClockIcon size={12} color={colors.slate} />
                    <Caption style={styles.metaText}>Next: {course.nextClass.day} {course.nextClass.time}</Caption>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <MapPinIcon size={12} color={colors.slate} />
                    <Caption style={styles.metaText}>{course.nextClass.room}</Caption>
                </View>
            </View>

            <View style={styles.attendanceSection}>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${course.attendancePercent}%`, backgroundColor: course.color }]} />
                    </View>
                    <BodySm style={[styles.attendancePercent, { color: course.color }]}>{course.attendancePercent}%</BodySm>
                </View>
            </View>

            {expanded && (
                <View style={styles.expandedContent}>
                    <View style={styles.expandedSection}>
                        <HeadingSm style={styles.expandedSectionTitle}>WEEKLY SCHEDULE</HeadingSm>
                        {course.schedule.map((s: any, i: number) => (
                            <View key={i} style={styles.scheduleRow}>
                                <BodySm style={styles.scheduleDay}>{s.day}</BodySm>
                                <BodySm style={styles.scheduleTime}>{s.time}</BodySm>
                                <BodySm style={styles.scheduleRoom}>{s.room}</BodySm>
                            </View>
                        ))}
                    </View>

                    <View style={styles.expandedSection}>
                        <View style={styles.patternHeader}>
                            <HeadingSm style={styles.expandedSectionTitle}>ATTENDANCE PATTERN</HeadingSm>
                            {course.currentStreak > 0 && (
                                <View style={styles.streakBadge}>
                                    <FlameIcon size={12} />
                                    <Caption style={styles.streakText}>{course.currentStreak} class streak</Caption>
                                </View>
                            )}
                        </View>
                        {course.isAtRisk && (
                            <View style={styles.riskWarningBox}>
                                <AlertCircleIcon size={14} />
                                <BodySm style={styles.riskWarningText}>{course.riskMessage}</BodySm>
                            </View>
                        )}
                    </View>

                    <View style={styles.expandedSection}>
                        <HeadingSm style={styles.expandedSectionTitle}>RECENT CHECK-INS</HeadingSm>
                        {course.recentLog.map((log: any, i: number) => (
                            <View key={i} style={styles.logRow}>
                                <BodySm style={styles.logDate}>{log.date}</BodySm>
                                <BodySm style={styles.logTime}>{log.time}</BodySm>
                                <View style={[styles.logStatus, { backgroundColor: getStatusColor(log.status) + '15' }]}>
                                    <BodySm style={[styles.logStatusText, { color: getStatusColor(log.status) }]}>
                                        {log.status.toUpperCase()}
                                    </BodySm>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
};

export const ClassesScreen = () => {
    const insets = useSafeAreaInsets();
    const today = useMemo(() => new Date(), []);
    const [selectedDate, setSelectedDate] = useState(today.getDate());
    const [showCalendar, setShowCalendar] = useState(false);
    
    const viewMonth = today.getMonth();
    const viewYear = today.getFullYear();
    
    const termInfo = useMemo(() => getTermInfo(viewMonth, viewYear), [viewMonth, viewYear]);
    const currentAcademicYear = viewYear.toString();

    return (
        <View style={styles.container}>
            <ResponsiveContainer>
                <ScrollView 
                    style={styles.scroll} 
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: Math.max(insets.top, 20) + spacing.md }
                    ]} 
                    showsVerticalScrollIndicator={false}
                    stickyHeaderIndices={[1]}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Caption style={styles.headerSubtitle}>Academic Year {currentAcademicYear}</Caption>
                            <HeadingLg style={styles.headerTitle}>{termInfo.name}</HeadingLg>
                        </View>
                        <TouchableOpacity style={styles.calendarButton} onPress={() => setShowCalendar(true)}>
                            <CalendarIcon />
                        </TouchableOpacity>
                    </View>

                    <CalendarStrip 
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />

                    <View style={styles.mainContent}>
                        <View style={styles.nextClassContainer}>
                            <View style={styles.nextClassBadge}>
                                <ClockIcon size={12} color={colors.cobalt} />
                                <Caption style={styles.nextClassBadgeText}>NEXT CLASS IN {nextClass.minutesUntil} MIN</Caption>
                            </View>
                            <View style={styles.nextClassInfo}>
                                <HeadingSm style={styles.nextClassName}>{nextClass.code} • {nextClass.name}</HeadingSm>
                                <Caption style={styles.nextClassRoom}>{nextClass.room} @ {nextClass.startTime}</Caption>
                            </View>
                        </View>

                        <View style={styles.academicOverview}>
                            <View style={styles.overviewHeader}>
                                <HeadingSm style={styles.overviewTitle}>ATTENDANCE OVERVIEW</HeadingSm>
                                <View style={styles.statusBadgeLarge}>
                                    <View style={[styles.statusDot, { backgroundColor: attendanceMetrics.status === 'good' ? colors.success : colors.error }]} />
                                    <Caption style={[styles.statusTextLarge, { color: attendanceMetrics.status === 'good' ? colors.success : colors.error }]}>
                                        {attendanceMetrics.status === 'good' ? 'In Good Standing' : 'At Risk'}
                                    </Caption>
                                </View>
                            </View>
                            <View style={styles.statsGrid}>
                                <View style={styles.statBox}>
                                    <View style={styles.statValueRow}>
                                        <FlameIcon size={18} />
                                        <HeadingMd style={styles.statValue}>{attendanceMetrics.currentStreak}</HeadingMd>
                                    </View>
                                    <Caption>Streak</Caption>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <HeadingMd style={styles.statValue}>{attendanceMetrics.weekAttended}/{attendanceMetrics.weekTotal}</HeadingMd>
                                    <Caption>This Week</Caption>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <HeadingMd style={[styles.statValue, { color: colors.cobalt }]}>{attendanceMetrics.overallPercent}%</HeadingMd>
                                    <Caption>Overall</Caption>
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <HeadingSm style={styles.sectionTitle}>ATTENDANCE ALERTS</HeadingSm>
                            </View>
                            <View style={styles.alertsContainer}>
                                {attendanceAlerts.map((alert: any) => (
                                    <View key={alert.id} style={[styles.alertCard, { borderColor: alert.type === 'warning' ? colors.error + '30' : colors.success + '30' }]}>
                                        {alert.type === 'warning' ? <AlertCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
                                        <View style={styles.alertContent}>
                                            <BodySm style={styles.alertCourse}>{alert.course}</BodySm>
                                            <Caption style={styles.alertMessage}>{alert.message}</Caption>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <HeadingSm style={styles.sectionTitle}>Enrolled Classes</HeadingSm>
                            </View>
                            <View style={styles.classList}>
                                {enrolledCourses.map((course: any) => (
                                    <CourseCard key={course.id} course={course} />
                                ))}
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
        paddingBottom: 72, 
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
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 28,
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
