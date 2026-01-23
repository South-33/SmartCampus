import React, { useState, useMemo } from 'react';
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
    ResponsiveContainer,
    CalendarStrip,
    AcademicCalendarModal,
} from '../components';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { getTermInfo } from '../data/academicUtils';

interface ClassesScreenProps {
    onBack?: () => void;
}

// Icons
const CalendarIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <Path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const UserIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
    </Svg>
);

const ChevronDownIcon = ({ color = colors.cobalt }: { color?: string }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <Path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ClockIcon = ({ size = 14, color = colors.slate }: { size?: number, color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const FlameIcon = ({ size = 16, color = '#F59E0B' }: { size?: number, color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.5 3.5 6.5 1.5 2 1.5 4.5.5 6a5 5 0 1 1-7.5-1" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const AlertCircleIcon = ({ size = 16, color = colors.error }: { size?: number, color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CheckCircleIcon = ({ size = 16, color = colors.success }: { size?: number, color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const MapPinIcon = ({ size = 14, color = colors.slate }: { size?: number, color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <Circle cx="12" cy="10" r="3" />
    </Svg>
);

// --- Mock Data ---

const nextClass = {
    code: 'CS101',
    name: 'Data Structures',
    room: 'Room 305',
    startTime: '09:00',
    minutesUntil: 47,
};

const attendanceMetrics = {
    currentStreak: 12,
    weekAttended: 4,
    weekTotal: 5,
    overallPercent: 92.4,
    status: 'good',
};

const enrolledCourses = [
    {
        id: '1',
        code: 'CS101',
        name: 'Data Structures',
        professor: 'Dr. Aris Thorne',
        color: colors.cobalt,
        attendancePercent: 94,
        classesAttended: 31,
        classesTotal: 33,
        currentStreak: 8,
        nextClass: {
            day: 'Wed',
            time: '09:00',
            room: 'Room 305',
            status: 'upcoming',
        },
        schedule: [
            { day: 'Mon', time: '09:00 - 10:30', room: 'Room 305' },
            { day: 'Wed', time: '09:00 - 10:30', room: 'Room 305' },
        ],
        recentLog: [
            { date: 'Oct 21', time: '09:02', status: 'present' },
            { date: 'Oct 19', time: '09:01', status: 'present' },
            { date: 'Oct 16', time: '09:15', status: 'late' },
            { date: 'Oct 14', time: '—', status: 'absent' },
            { date: 'Oct 12', time: '09:00', status: 'present' },
        ],
    },
    {
        id: '2',
        code: 'MATH201',
        name: 'Linear Algebra',
        professor: 'Prof. Sarah Vance',
        color: '#6366F1',
        attendancePercent: 78,
        classesAttended: 18,
        classesTotal: 23,
        currentStreak: 0,
        nextClass: {
            day: 'Thu',
            time: '11:00',
            room: 'Room 112',
            status: 'warning',
        },
        schedule: [
            { day: 'Tue', time: '11:00 - 12:30', room: 'Room 112' },
            { day: 'Thu', time: '11:00 - 12:30', room: 'Room 112' },
        ],
        recentLog: [
            { date: 'Oct 20', time: '—', status: 'absent' },
            { date: 'Oct 18', time: '—', status: 'absent' },
            { date: 'Oct 15', time: '11:05', status: 'present' },
            { date: 'Oct 13', time: '11:02', status: 'present' },
            { date: 'Oct 11', time: '11:00', status: 'present' },
        ],
        isAtRisk: true,
        riskMessage: '2 more absences = Academic Probation',
    },
    {
        id: '3',
        code: 'ENG105',
        name: 'Technical Writing',
        professor: 'James Sterling',
        color: '#8B5CF6',
        attendancePercent: 100,
        classesAttended: 12,
        classesTotal: 12,
        currentStreak: 12,
        nextClass: {
            day: 'Fri',
            time: '14:00',
            room: 'Room 408',
            status: 'upcoming',
        },
        schedule: [
            { day: 'Fri', time: '14:00 - 15:30', room: 'Room 408' },
        ],
        recentLog: [
            { date: 'Oct 18', time: '14:00', status: 'present' },
            { date: 'Oct 11', time: '14:01', status: 'present' },
            { date: 'Oct 04', time: '14:00', status: 'present' },
            { date: 'Sep 27', time: '13:58', status: 'present' },
            { date: 'Sep 20', time: '14:00', status: 'present' },
        ],
    },
];

const attendanceAlerts = [
    {
        id: '1',
        type: 'warning',
        course: 'MATH201',
        message: '2 consecutive absences. Next absence triggers warning.',
    },
    {
        id: '2',
        type: 'success',
        course: 'ENG105',
        message: 'Perfect attendance! 12/12 classes attended.',
    },
];

// --- Components ---

const CourseCard = ({ course }: { course: typeof enrolledCourses[0] }) => {
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
                        {course.schedule.map((s, i) => (
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
                        {course.recentLog.map((log, i) => (
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
    const [selectedDate, setSelectedDate] = useState(21);
    const [showCalendar, setShowCalendar] = useState(false);
    
    const viewMonth = 9; // October
    const viewYear = 2024;
    
    const termInfo = useMemo(() => getTermInfo(viewMonth, viewYear), [viewMonth, viewYear]);
    const currentAcademicYear = viewYear.toString();

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveContainer>
                <ScrollView 
                    style={styles.scroll} 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                    stickyHeaderIndices={[1]}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View>
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
                                {attendanceAlerts.map((alert) => (
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
                                {enrolledCourses.map((course) => (
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
    scrollContent: {
        paddingTop: spacing.lg,
        paddingBottom: 72, 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        marginBottom: spacing.md,
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
