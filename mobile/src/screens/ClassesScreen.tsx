import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    DimensionValue,
    Modal,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
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

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

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

const CloseIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ChevronLeftIcon = ({ size = 20, color = colors.charcoal }: { size?: number, color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <Path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ChevronRightIcon = ({ size = 20, color = colors.charcoal }: { size?: number, color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <Path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
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

// Enrollment period (4-year Bachelor's)
const ENROLLMENT_START = { year: 2024, month: 8 }; // September 2024
const ENROLLMENT_END = { year: 2028, month: 5 };   // June 2028

// Month names
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// British academic terms (Oxford-style)
const getTermInfo = (month: number, year: number) => {
    if (month >= 9 && month <= 11) return { name: 'Michaelmas Term', color: colors.cobalt };
    if (month >= 0 && month <= 2) return { name: 'Hilary Term', color: '#6366F1' };
    if (month >= 3 && month <= 5) return { name: 'Trinity Term', color: '#8B5CF6' };
    return { name: 'Summer Vacation', color: colors.slate };
};

// Generate academic data for a specific month/year
const getAcademicData = (month: number, year: number) => {
    const holidays: number[] = [];
    const termDays: number[] = [];
    const examDays: number[] = [];
    
    if (month === 11) holidays.push(24, 25, 26, 27, 28, 29, 30, 31);
    if (month === 0) holidays.push(1, 2);
    if (month === 2) holidays.push(29, 30, 31);
    if (month === 3) holidays.push(1, 2, 3, 4, 5);
    if (month === 4) holidays.push(6, 27);
    if (month === 7) holidays.push(26);
    
    const termMonths = [0, 1, 2, 3, 4, 5, 9, 10, 11];
    if (termMonths.includes(month)) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dayOfWeek = new Date(year, month, d).getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(d)) {
                termDays.push(d);
            }
        }
    }
    
    if (month === 0) examDays.push(13, 14, 15, 16, 17, 20, 21, 22, 23, 24);
    if (month === 4 || month === 5) {
        if (month === 4) examDays.push(19, 20, 21, 22, 23, 26, 27, 28, 29, 30);
        if (month === 5) examDays.push(2, 3, 4, 5, 6, 9, 10, 11, 12, 13);
    }
    
    return { holidays, termDays, examDays };
};

// --- Mock Data ---

const nextClass = {
    code: 'CS101',
    name: 'Data Structures',
    room: 'Room 305',
    startTime: '09:00',
    minutesUntil: 47,
};

const weekDays = [
    { day: 'Mon', date: 19, classCount: 2, active: false },
    { day: 'Tue', date: 20, classCount: 1, active: false },
    { day: 'Wed', date: 21, classCount: 3, active: true },
    { day: 'Thu', date: 22, classCount: 2, active: false },
    { day: 'Fri', date: 23, classCount: 1, active: false },
    { day: 'Sat', date: 24, classCount: 0, active: false },
    { day: 'Sun', date: 25, classCount: 0, active: false },
];

const attendanceMetrics = {
    currentStreak: 12,
    weekAttended: 4,
    weekTotal: 5,
    overallPercent: 92.4,
    status: 'good', // 'good' | 'warning' | 'at-risk'
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
    const animation = useRef(new Animated.Value(0)).current;
    
    const toggleExpand = () => {
        const toValue = expanded ? 0 : 1;
        setExpanded(!expanded);
        
        Animated.spring(animation, {
            toValue,
            useNativeDriver: false,
            friction: 8,
            tension: 40
        }).start();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return colors.success;
            case 'late': return '#F59E0B';
            case 'absent': return colors.error;
            default: return colors.slate;
        }
    };

    const contentHeight = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 480], // Max height for expanded content
    });

    const contentOpacity = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    });

    return (
        <TouchableOpacity 
            style={[styles.courseCard, expanded && styles.courseCardExpanded]} 
            onPress={toggleExpand}
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
                <Animated.View style={{ 
                    transform: [{ 
                        rotate: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg']
                        }) 
                    }] 
                }}>
                    <ChevronDownIcon color={colors.slate} />
                </Animated.View>
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
                        <View style={[styles.progressFill, { width: `${course.attendancePercent}%` as DimensionValue, backgroundColor: course.color }]} />
                    </View>
                    <BodySm style={[styles.attendancePercent, { color: course.color }]}>{course.attendancePercent}%</BodySm>
                </View>
            </View>

            <Animated.View style={{ 
                maxHeight: contentHeight, 
                opacity: contentOpacity,
                overflow: 'hidden'
            }}>
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
            </Animated.View>
        </TouchableOpacity>
    );
};

export const ClassesScreen = () => {
    const [selectedDate, setSelectedDate] = useState(21);
    const [showCalendar, setShowCalendar] = useState(false);
    
    // Animation refs
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const yearSlideAnim = useRef(new Animated.Value(0)).current;
    const yearFadeAnim = useRef(new Animated.Value(1)).current;
    
    // Current viewing month/year in calendar
    const [viewMonth, setViewMonth] = useState(9); // October
    const [viewYear, setViewYear] = useState(2024);

    const animateTransition = (direction: 'next' | 'prev', updateFn: () => void, animateYear = false) => {
        const outAnimations = [
            Animated.timing(slideAnim, {
                toValue: direction === 'next' ? -30 : 30,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
        ];

        if (animateYear) {
            outAnimations.push(
                Animated.timing(yearSlideAnim, {
                    toValue: direction === 'next' ? -20 : 20,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(yearFadeAnim, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                })
            );
        }

        Animated.parallel(outAnimations).start(() => {
            updateFn();
            
            slideAnim.setValue(direction === 'next' ? 30 : -30);
            if (animateYear) {
                yearSlideAnim.setValue(direction === 'next' ? 20 : -20);
            }

            const inAnimations = [
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ];

            if (animateYear) {
                inAnimations.push(
                    Animated.timing(yearSlideAnim, {
                        toValue: 0,
                        duration: 220,
                        useNativeDriver: true,
                    }),
                    Animated.timing(yearFadeAnim, {
                        toValue: 1,
                        duration: 220,
                        useNativeDriver: true,
                    })
                );
            }

            Animated.parallel(inAnimations).start();
        });
    };
    
    const today = new Date();
    const termInfo = useMemo(() => getTermInfo(viewMonth, viewYear), [viewMonth, viewYear]);
    const academicData = useMemo(() => getAcademicData(viewMonth, viewYear), [viewMonth, viewYear]);

    const calendarDays = useMemo(() => {
        const days: (null | { day: number; isHoliday: boolean; isTermDay: boolean; isExamDay: boolean; isSelected: boolean; isToday: boolean })[] = [];
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const padding = firstDay === 0 ? 6 : firstDay - 1;
        
        for (let i = 0; i < padding; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = today.getDate() === i && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
            days.push({
                day: i,
                isHoliday: academicData.holidays.includes(i),
                isTermDay: academicData.termDays.includes(i),
                isExamDay: academicData.examDays.includes(i),
                isSelected: i === selectedDate && viewMonth === 9 && viewYear === 2024,
                isToday,
            });
        }
        while (days.length < 42) days.push(null);
        return days;
    }, [viewYear, viewMonth, selectedDate, academicData]);

    const goToPrevMonth = () => {
        if (viewYear === ENROLLMENT_START.year && viewMonth <= ENROLLMENT_START.month) return;
        animateTransition('prev', () => {
            if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
            else setViewMonth(viewMonth - 1);
        }, viewMonth === 0);
    };

    const goToNextMonth = () => {
        if (viewYear === ENROLLMENT_END.year && viewMonth >= ENROLLMENT_END.month) return;
        animateTransition('next', () => {
            if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
            else setViewMonth(viewMonth + 1);
        }, viewMonth === 11);
    };

    const goToPrevYear = () => {
        if (viewYear > ENROLLMENT_START.year) {
            animateTransition('prev', () => setViewYear(viewYear - 1), true);
        }
    };

    const goToNextYear = () => {
        if (viewYear < ENROLLMENT_END.year) {
            animateTransition('next', () => setViewYear(viewYear + 1), true);
        }
    };

    const canGoPrevYear = viewYear > ENROLLMENT_START.year;
    const canGoNextYear = viewYear < ENROLLMENT_END.year;

    const canGoPrev = !(viewYear === ENROLLMENT_START.year && viewMonth <= ENROLLMENT_START.month);
    const canGoNext = !(viewYear === ENROLLMENT_END.year && viewMonth >= ENROLLMENT_END.month);
    const currentAcademicYear = viewYear.toString();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                style={styles.scroll} 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[1]}
            >
                {/* Header - Now scrolls away */}
                <View style={styles.header}>
                    <View>
                        <Caption style={styles.headerSubtitle}>Academic Year {currentAcademicYear}</Caption>
                        <HeadingLg style={styles.headerTitle}>{termInfo.name}</HeadingLg>
                    </View>
                    <TouchableOpacity style={styles.calendarButton} onPress={() => setShowCalendar(true)}>
                        <CalendarIcon />
                    </TouchableOpacity>
                </View>

                {/* Week Strip - Sticky */}
                <View style={styles.calendarStrip}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekContent}>
                        {weekDays.map((d) => (
                            <TouchableOpacity key={d.date} style={[styles.dayCard, selectedDate === d.date && styles.dayCardActive]} onPress={() => setSelectedDate(d.date)}>
                                <Caption style={[styles.dayName, selectedDate === d.date && styles.textCobalt]}>{d.day}</Caption>
                                <Body style={[styles.dayDate, selectedDate === d.date && styles.textCobalt]}>{d.date}</Body>
                                {d.classCount > 0 && (
                                    <View style={styles.dayIndicators}>
                                        {[...Array(Math.min(d.classCount, 3))].map((_, i) => (
                                            <View key={i} style={[styles.indicatorDot, selectedDate === d.date && styles.indicatorDotActive]} />
                                        ))}
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.mainContent}>
                    {/* Next Class Countdown Section - Now below the sticky strip */}
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

                    {/* Enhanced Attendance Overview */}
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

                    {/* Attendance Alerts Section */}
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
                            <HeadingSm style={styles.sectionTitle}>Course Catalog</HeadingSm>
                            <Caption style={styles.filterLink}>Filter by Dept</Caption>
                        </View>
                        {enrolledCourses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </View>
                </View>
            </ScrollView>

            <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModal}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleArea}>
                                <Caption style={styles.modalSub}>ACADEMIC CALENDAR</Caption>
                                <View style={styles.yearSwitcher}>
                                    <TouchableOpacity 
                                        onPress={goToPrevYear} 
                                        disabled={!canGoPrevYear} 
                                        style={[styles.yearNavArrow, !canGoPrevYear && styles.navArrowDisabled]}
                                    >
                                        <ChevronLeftIcon size={16} />
                                    </TouchableOpacity>
                                    <Animated.View style={{ opacity: yearFadeAnim, transform: [{ translateX: yearSlideAnim }] }}>
                                        <HeadingSm style={styles.yearSwitcherText}>{currentAcademicYear}</HeadingSm>
                                    </Animated.View>
                                    <TouchableOpacity 
                                        onPress={goToNextYear} 
                                        disabled={!canGoNextYear} 
                                        style={[styles.yearNavArrow, !canGoNextYear && styles.navArrowDisabled]}
                                    >
                                        <ChevronRightIcon size={16} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.closeBtn}><CloseIcon /></TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} alwaysBounceVertical={false}>
                            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                                <View style={styles.monthNav}>
                                    <TouchableOpacity style={[styles.navArrow, !canGoPrev && styles.navArrowDisabled]} onPress={goToPrevMonth} disabled={!canGoPrev}><ChevronLeftIcon /></TouchableOpacity>
                                    <View style={styles.monthDisplay}>
                                        <HeadingMd>{MONTH_NAMES[viewMonth]} {viewYear}</HeadingMd>
                                        <Caption style={[styles.termBadge, { backgroundColor: termInfo.color + '15' }]}><BodySm style={{ color: termInfo.color, fontSize: 10 }}>{termInfo.name}</BodySm></Caption>
                                    </View>
                                    <TouchableOpacity style={[styles.navArrow, !canGoNext && styles.navArrowDisabled]} onPress={goToNextMonth} disabled={!canGoNext}><ChevronRightIcon /></TouchableOpacity>
                                </View>
                                <View style={styles.monthGrid}>
                                    <View style={styles.weekHeader}>
                                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (<Caption key={i} style={styles.weekDayLabel}>{d}</Caption>))}
                                    </View>
                                    <View style={styles.daysGrid}>
                                        {calendarDays.map((d, i) => (
                                            <View key={i} style={styles.dayCell}>
                                                {d && (
                                                <TouchableOpacity style={[styles.dayInner, d.isSelected && styles.daySelected, d.isHoliday && styles.dayHoliday, d.isExamDay && styles.dayExam, d.isToday && !d.isSelected && styles.dayToday]} onPress={() => setSelectedDate(d.day)}>
                                                    <BodySm style={[styles.dayText, d.isSelected && styles.textWhite, d.isHoliday && !d.isSelected && styles.textError, d.isExamDay && !d.isSelected && styles.textExam, d.isToday && !d.isSelected && styles.textCobalt]}>{d.day}</BodySm>
                                                    {d.isTermDay && !d.isSelected && !d.isHoliday && !d.isExamDay && (<View style={styles.termDot} />)}
                                                </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </Animated.View>
                            <View style={styles.legend}>
                                <View style={styles.legendItem}><View style={styles.termDotLegend} /><Caption>Term Day</Caption></View>
                                <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} /><Caption>Holiday</Caption></View>
                                <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]} /><Caption>Exam</Caption></View>
                            </View>
                            <View style={styles.quickJump}><TouchableOpacity style={styles.quickJumpBtn} onPress={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}><Caption style={styles.quickJumpText}>Today</Caption></TouchableOpacity></View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ivory,
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
    calendarStrip: {
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
        backgroundColor: colors.ivory,
    },
    weekContent: {
        paddingHorizontal: spacing.lg,
        gap: 12,
    },
    dayCard: {
        width: 52,
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.mist,
        gap: 4,
    },
    dayCardActive: {
        borderColor: colors.cobalt,
        borderWidth: 2,
    },
    dayName: {
        fontSize: 10,
        textTransform: 'uppercase',
        fontFamily: 'Inter-Medium',
        color: colors.slate,
    },
    dayDate: {
        fontFamily: 'PlayfairDisplay-Medium',
        fontSize: 18,
        color: colors.charcoal,
    },
    dayIndicators: {
        flexDirection: 'row',
        gap: 2,
    },
    indicatorDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.mist,
    },
    indicatorDotActive: {
        backgroundColor: colors.cobalt,
    },
    textCobalt: {
        color: colors.cobalt,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: spacing.lg,
        paddingBottom: 120, 
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
    filterLink: {
        color: colors.cobalt,
        fontFamily: 'Inter-Medium',
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
    divider: {
        height: 1,
        backgroundColor: colors.ivory,
        marginHorizontal: spacing.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(26, 26, 26, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    calendarModal: {
        width: '100%',
        maxWidth: 460,
        maxHeight: '85%',
        backgroundColor: colors.ivory,
        borderRadius: radius.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.mist,
        ...shadows.card,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    modalTitleArea: {
        flex: 1,
    },
    modalSub: {
        fontSize: 10,
        letterSpacing: 1,
        color: colors.slate,
        marginBottom: 6,
    },
    yearSwitcher: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    yearSwitcherText: {
        color: colors.cobalt,
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
    yearNavArrow: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    navArrow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navArrowDisabled: {
        opacity: 0.3,
    },
    monthDisplay: {
        alignItems: 'center',
        gap: 4,
    },
    termBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 100,
    },
    monthGrid: {
        marginBottom: spacing.md,
    },
    weekHeader: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    weekDayLabel: {
        flex: 1,
        textAlign: 'center',
        color: colors.slate,
        fontSize: 10,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
    },
    dayInner: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    daySelected: {
        backgroundColor: colors.cobalt,
    },
    dayHoliday: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    dayExam: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    dayToday: {
        borderWidth: 2,
        borderColor: colors.cobalt,
    },
    dayText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
    },
    textWhite: {
        color: '#FFF',
    },
    textError: {
        color: colors.error,
    },
    textExam: {
        color: '#D97706',
    },
    termDot: {
        position: 'absolute',
        bottom: 6,
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: colors.cobalt,
    },
    legend: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.mist,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendBox: {
        width: 14,
        height: 14,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    termDotLegend: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.cobalt,
        marginHorizontal: 5,
    },
    quickJump: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
    quickJumpBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 100,
        backgroundColor: colors.cream,
    },
    quickJumpText: {
        color: colors.cobalt,
        fontFamily: 'Inter-Medium',
    },
});
