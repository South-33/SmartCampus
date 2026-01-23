import React, { useState, useMemo, useRef } from 'react';
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

const ChevronLeftIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.charcoal} strokeWidth={2}>
        <Path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ChevronRightIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.charcoal} strokeWidth={2}>
        <Path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ChevronDownIcon = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
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

const MONTH_NAMES_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// British academic terms (Oxford-style)
const getTermInfo = (month: number, year: number) => {
    // Michaelmas: Oct - Dec
    // Hilary: Jan - Mar  
    // Trinity: Apr - Jun
    // Summer: Jul - Sep (vacation)
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
    
    // Common UK holidays (simplified)
    // Christmas break: Dec 20 - Jan 5
    if (month === 11) { // December
        holidays.push(24, 25, 26, 27, 28, 29, 30, 31);
    }
    if (month === 0) { // January
        holidays.push(1, 2);
    }
    // Easter break (approximate): Late March / Early April
    if (month === 2) { // March
        holidays.push(29, 30, 31);
    }
    if (month === 3) { // April
        holidays.push(1, 2, 3, 4, 5);
    }
    // Bank holidays
    if (month === 4) { // May
        holidays.push(6, 27); // Early May, Spring Bank
    }
    if (month === 7) { // August
        holidays.push(26); // Summer Bank
    }
    
    // Term days (weekdays during term time)
    const termMonths = [0, 1, 2, 3, 4, 5, 9, 10, 11]; // Jan-Jun, Oct-Dec
    if (termMonths.includes(month)) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dayOfWeek = new Date(year, month, d).getDay();
            // Weekdays only, not holidays
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(d)) {
                termDays.push(d);
            }
        }
    }
    
    // Exam periods
    if (month === 0) { // January exams
        examDays.push(13, 14, 15, 16, 17, 20, 21, 22, 23, 24);
    }
    if (month === 4 || month === 5) { // May/June exams
        if (month === 4) examDays.push(19, 20, 21, 22, 23, 26, 27, 28, 29, 30);
        if (month === 5) examDays.push(2, 3, 4, 5, 6, 9, 10, 11, 12, 13);
    }
    
    return { holidays, termDays, examDays };
};

// Generate list of academic years for picker
const getAcademicYears = () => {
    const years = [];
    for (let y = ENROLLMENT_START.year; y <= ENROLLMENT_END.year; y++) {
        years.push({
            label: `${y}/${(y + 1).toString().slice(-2)}`,
            startYear: y,
        });
    }
    return years;
};

// Mock Data
const weekDays = [
    { day: 'Mon', date: 19, active: false },
    { day: 'Tue', date: 20, active: false },
    { day: 'Wed', date: 21, active: true },
    { day: 'Thu', date: 22, active: false },
    { day: 'Fri', date: 23, active: false },
    { day: 'Sat', date: 24, active: false },
    { day: 'Sun', date: 25, active: false },
];

const enrolledCourses = [
    {
        id: '1',
        code: 'CS101',
        name: 'Data Structures',
        professor: 'Dr. Aris Thorne',
        attendance: '94%',
        classes: '31/33',
        color: colors.cobalt,
    },
    {
        id: '2',
        code: 'MATH201',
        name: 'Linear Algebra',
        professor: 'Prof. Sarah Vance',
        attendance: '88%',
        classes: '22/25',
        color: '#6366F1',
    },
    {
        id: '3',
        code: 'ENG105',
        name: 'Technical Writing',
        professor: 'James Sterling',
        attendance: '100%',
        classes: '12/12',
        color: '#8B5CF6',
    },
];

export const ClassesScreen = () => {
    const [selectedDate, setSelectedDate] = useState(21);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);
    
    // Animation refs
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const yearPickerAnim = useRef(new Animated.Value(0)).current;
    
    // Current viewing month/year in calendar
    const [viewMonth, setViewMonth] = useState(9); // October (0-indexed)
    const [viewYear, setViewYear] = useState(2024);

    const animateMonthTransition = (direction: 'next' | 'prev', updateFn: () => void) => {
        // Slide and fade out
        Animated.parallel([
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
        ]).start(() => {
            updateFn();
            // Reset position to opposite side for entrance
            slideAnim.setValue(direction === 'next' ? 30 : -30);
            
            // Slide and fade in
            Animated.parallel([
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
            ]).start();
        });
    };
    
    const toggleYearPicker = () => {
        const toValue = showYearPicker ? 0 : 1;
        
        if (!showYearPicker) {
            setShowYearPicker(true);
        }
        
        Animated.spring(yearPickerAnim, {
            toValue,
            tension: 50,
            friction: 8,
            useNativeDriver: false, // Height cannot be animated with native driver
        }).start(() => {
            if (toValue === 0) {
                setShowYearPicker(false);
            }
        });
    };
    
    const today = new Date();
    const academicYears = useMemo(() => getAcademicYears(), []);
    const termInfo = useMemo(() => getTermInfo(viewMonth, viewYear), [viewMonth, viewYear]);
    const academicData = useMemo(() => getAcademicData(viewMonth, viewYear), [viewMonth, viewYear]);

    const calendarDays = useMemo(() => {
        const days: (null | { day: number; isHoliday: boolean; isTermDay: boolean; isExamDay: boolean; isSelected: boolean; isToday: boolean })[] = [];
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const padding = firstDay === 0 ? 6 : firstDay - 1;
        
        // Add leading padding
        for (let i = 0; i < padding; i++) days.push(null);
        
        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = today.getDate() === i && 
                           today.getMonth() === viewMonth && 
                           today.getFullYear() === viewYear;
            days.push({
                day: i,
                isHoliday: academicData.holidays.includes(i),
                isTermDay: academicData.termDays.includes(i),
                isExamDay: academicData.examDays.includes(i),
                isSelected: i === selectedDate && viewMonth === 9 && viewYear === 2024,
                isToday,
            });
        }
        
        // Always pad to 42 cells (6 rows x 7 days) for consistent height
        while (days.length < 42) {
            days.push(null);
        }
        
        return days;
    }, [viewYear, viewMonth, selectedDate, academicData]);

    // Navigation functions
    const goToPrevMonth = () => {
        if (viewYear === ENROLLMENT_START.year && viewMonth <= ENROLLMENT_START.month) return;
        
        animateMonthTransition('prev', () => {
            if (viewMonth === 0) {
                setViewMonth(11);
                setViewYear(viewYear - 1);
            } else {
                setViewMonth(viewMonth - 1);
            }
        });
    };

    const goToNextMonth = () => {
        if (viewYear === ENROLLMENT_END.year && viewMonth >= ENROLLMENT_END.month) return;

        animateMonthTransition('next', () => {
            if (viewMonth === 11) {
                setViewMonth(0);
                setViewYear(viewYear + 1);
            } else {
                setViewMonth(viewMonth + 1);
            }
        });
    };

    const jumpToAcademicYear = (startYear: number) => {
        Animated.spring(yearPickerAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: false,
        }).start(() => {
            setViewYear(startYear);
            setViewMonth(9); // Start of academic year (October)
            setShowYearPicker(false);
        });
    };

    const canGoPrev = !(viewYear === ENROLLMENT_START.year && viewMonth <= ENROLLMENT_START.month);
    const canGoNext = !(viewYear === ENROLLMENT_END.year && viewMonth >= ENROLLMENT_END.month);

    // Get current academic year label
    const currentAcademicYear = viewMonth >= 8 
        ? `${viewYear}/${(viewYear + 1).toString().slice(-2)}`
        : `${viewYear - 1}/${viewYear.toString().slice(-2)}`;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Caption style={styles.headerSubtitle}>Academic Year 2024/25</Caption>
                    <HeadingLg style={styles.headerTitle}>Michaelmas Term</HeadingLg>
                </View>
                <TouchableOpacity 
                    style={styles.calendarButton} 
                    onPress={() => setShowCalendar(true)}
                >
                    <CalendarIcon />
                </TouchableOpacity>
            </View>

            <Modal
                visible={showCalendar}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCalendar(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModal}>
                        {/* Header with close (Fixed at top) */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleArea}>
                                <Caption style={styles.modalSub}>ACADEMIC CALENDAR</Caption>
                                <TouchableOpacity 
                                    style={styles.yearPickerBtn}
                                    onPress={toggleYearPicker}
                                >
                                    <HeadingSm style={styles.yearPickerText}>{currentAcademicYear}</HeadingSm>
                                    <Animated.View style={{
                                        transform: [{
                                            rotate: yearPickerAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0deg', '180deg'],
                                            })
                                        }]
                                    }}>
                                        <ChevronDownIcon />
                                    </Animated.View>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.closeBtn}>
                                <CloseIcon />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            showsVerticalScrollIndicator={false}
                            alwaysBounceVertical={false}
                        >
                            {/* Year picker dropdown */}
                            <Animated.View style={[
                                styles.yearPickerDropdown,
                                {
                                    opacity: yearPickerAnim,
                                    maxHeight: yearPickerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 140], 
                                    }),
                                    marginBottom: yearPickerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, spacing.md],
                                    }),
                                    paddingVertical: yearPickerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, spacing.md],
                                    }),
                                    overflow: 'hidden',
                                }
                            ]}>
                                <Caption style={styles.yearPickerLabel}>Jump to Academic Year</Caption>
                                <View style={styles.yearGrid}>
                                    {academicYears.map((ay) => (
                                        <TouchableOpacity
                                            key={ay.startYear}
                                            style={[
                                                styles.yearChip,
                                                viewYear === ay.startYear && viewMonth >= 8 && styles.yearChipActive,
                                                (viewYear === ay.startYear + 1 && viewMonth < 8) && styles.yearChipActive,
                                            ]}
                                            onPress={() => jumpToAcademicYear(ay.startYear)}
                                        >
                                            <BodySm style={[
                                                styles.yearChipText,
                                                (viewYear === ay.startYear && viewMonth >= 8) && styles.yearChipTextActive,
                                                (viewYear === ay.startYear + 1 && viewMonth < 8) && styles.yearChipTextActive,
                                            ]}>
                                                {ay.label}
                                            </BodySm>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Animated.View>

                            {/* Month content (Animated) */}
                            <Animated.View style={{ 
                                opacity: fadeAnim,
                                transform: [{ translateX: slideAnim }]
                            }}>
                                {/* Month navigation */}
                                <View style={styles.monthNav}>
                                    <TouchableOpacity 
                                        style={[styles.navArrow, !canGoPrev && styles.navArrowDisabled]} 
                                        onPress={goToPrevMonth}
                                        disabled={!canGoPrev}
                                    >
                                        <ChevronLeftIcon />
                                    </TouchableOpacity>
                                    <View style={styles.monthDisplay}>
                                        <HeadingMd>{MONTH_NAMES[viewMonth]} {viewYear}</HeadingMd>
                                        <Caption style={[styles.termBadge, { backgroundColor: termInfo.color + '15' }]}>
                                            <BodySm style={{ color: termInfo.color, fontSize: 10 }}>{termInfo.name}</BodySm>
                                        </Caption>
                                    </View>
                                    <TouchableOpacity 
                                        style={[styles.navArrow, !canGoNext && styles.navArrowDisabled]} 
                                        onPress={goToNextMonth}
                                        disabled={!canGoNext}
                                    >
                                        <ChevronRightIcon />
                                    </TouchableOpacity>
                                </View>

                                {/* Calendar grid */}
                                <View style={styles.monthGrid}>
                                    <View style={styles.weekHeader}>
                                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                            <Caption key={i} style={styles.weekDayLabel}>{d}</Caption>
                                        ))}
                                    </View>
                                    <View style={styles.daysGrid}>
                                        {calendarDays.map((d, i) => (
                                            <View key={i} style={styles.dayCell}>
                                                {d && (
                                                <TouchableOpacity 
                                                    style={[
                                                        styles.dayInner,
                                                        d.isSelected && styles.daySelected,
                                                        d.isHoliday && styles.dayHoliday,
                                                        d.isExamDay && styles.dayExam,
                                                        d.isToday && !d.isSelected && styles.dayToday,
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedDate(d.day);
                                                    }}
                                                >
                                                    <BodySm style={[
                                                        styles.dayText,
                                                        d.isSelected && styles.textWhite,
                                                        d.isHoliday && !d.isSelected && styles.textError,
                                                        d.isExamDay && !d.isSelected && styles.textExam,
                                                        d.isToday && !d.isSelected && styles.textCobalt,
                                                    ]}>
                                                        {d.day}
                                                    </BodySm>
                                                    {d.isTermDay && !d.isSelected && !d.isHoliday && !d.isExamDay && (
                                                        <View style={styles.termDot} />
                                                    )}
                                                </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </Animated.View>

                        {/* Legend */}
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={styles.termDotLegend} />
                                <Caption>Term Day</Caption>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} />
                                <Caption>Holiday</Caption>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]} />
                                <Caption>Exam</Caption>
                            </View>
                        </View>

                            {/* Quick jump buttons */}
                            <View style={styles.quickJump}>
                                <TouchableOpacity 
                                    style={styles.quickJumpBtn}
                                    onPress={() => {
                                        setViewMonth(today.getMonth());
                                        setViewYear(today.getFullYear());
                                    }}
                                >
                                    <Caption style={styles.quickJumpText}>Today</Caption>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Week Strip */}
            <View style={styles.calendarStrip}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekContent}>
                    {weekDays.map((d) => (
                        <TouchableOpacity 
                            key={d.date} 
                            style={[styles.dayCard, selectedDate === d.date && styles.dayCardActive]}
                            onPress={() => setSelectedDate(d.date)}
                        >
                            <Caption style={[styles.dayName, selectedDate === d.date && styles.textCobalt]}>{d.day}</Caption>
                            <Body style={[styles.dayDate, selectedDate === d.date && styles.textCobalt]}>{d.date}</Body>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.academicOverview}>
                    <View style={styles.overviewHeader}>
                        <HeadingSm style={styles.overviewTitle}>Performance Index</HeadingSm>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Caption style={styles.statusText}>In Good Standing</Caption>
                        </View>
                    </View>
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <HeadingMd style={styles.statValue}>92.4%</HeadingMd>
                            <Caption>Attendance</Caption>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <HeadingMd style={styles.statValue}>3.82</HeadingMd>
                            <Caption>Current GPA</Caption>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <HeadingMd style={styles.statValue}>12</HeadingMd>
                            <Caption>Credits</Caption>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <HeadingSm style={styles.sectionTitle}>Course Catalog</HeadingSm>
                        <Caption style={styles.filterLink}>Filter by Dept</Caption>
                    </View>
                    {enrolledCourses.map((course) => (
                        <TouchableOpacity key={course.id} style={styles.courseCard} activeOpacity={0.8}>
                            <View style={styles.courseTop}>
                                <View style={styles.courseIdentity}>
                                    <Caption style={styles.courseCode}>{course.code}</Caption>
                                    <HeadingMd style={styles.courseName}>{course.name}</HeadingMd>
                                </View>
                            </View>
                            <View style={styles.courseMeta}>
                                <View style={styles.metaItem}>
                                    <UserIcon />
                                    <Caption style={styles.metaText}>{course.professor}</Caption>
                                </View>
                                <View style={styles.metaDivider} />
                                <View style={styles.metaItem}>
                                    <Caption style={styles.metaText}>{course.classes} lectures</Caption>
                                </View>
                            </View>
                            <View style={styles.attendanceSection}>
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: course.attendance as DimensionValue }]} />
                                    </View>
                                    <Caption style={styles.attendancePercent}>{course.attendance}</Caption>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <HeadingSm style={styles.sectionTitle}>Academic Ledger</HeadingSm>
                    </View>
                    <View style={styles.ledger}>
                        <View style={styles.ledgerRow}>
                            <View style={styles.ledgerInfo}>
                                <BodySm style={styles.ledgerLabel}>Midterm Examination</BodySm>
                                <Caption>Data Structures • Oct 12</Caption>
                            </View>
                            <HeadingSm style={styles.ledgerValue}>94/100</HeadingSm>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.ledgerRow}>
                            <View style={styles.ledgerInfo}>
                                <BodySm style={styles.ledgerLabel}>Programming Lab 04</BodySm>
                                <Caption>Data Structures • Oct 08</Caption>
                            </View>
                            <HeadingSm style={styles.ledgerValue}>10/10</HeadingSm>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.ledgerRow}>
                            <View style={styles.ledgerInfo}>
                                <BodySm style={styles.ledgerLabel}>Linear Algebra Quiz</BodySm>
                                <Caption>Mathematics • Oct 05</Caption>
                            </View>
                            <HeadingSm style={styles.ledgerValue}>18/20</HeadingSm>
                        </View>
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
    calendarStrip: {
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    weekContent: {
        paddingHorizontal: spacing.lg,
        gap: 12,
    },
    dayCard: {
        width: 52,
        height: 68,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.mist,
        gap: 6,
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
    textCobalt: {
        color: colors.cobalt,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: 120, 
    },
    academicOverview: {
        backgroundColor: colors.cream,
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.mist,
        marginBottom: spacing.xl,
    },
    overviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(59, 94, 232, 0.1)',
    },
    overviewTitle: {
        fontSize: 12,
        letterSpacing: 0.5,
        color: colors.cobalt,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
    },
    statusText: {
        fontSize: 10,
        fontFamily: 'Inter-Medium',
        color: colors.success,
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
        fontSize: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: colors.slate,
    },
    filterLink: {
        color: colors.cobalt,
        fontFamily: 'Inter-Medium',
    },
    courseCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.sm,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    courseTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    courseIdentity: {
        flex: 1,
    },
    courseCode: {
        fontSize: 11,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    courseName: {
        fontSize: 20,
        lineHeight: 24,
    },
    courseMeta: {
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
        height: 12,
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
        height: 3,
        backgroundColor: colors.mist,
        borderRadius: 1.5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.cobalt,
    },
    attendancePercent: {
        fontSize: 11,
        fontFamily: 'Inter-SemiBold',
        color: colors.cobalt,
        minWidth: 32,
    },
    ledger: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.sm,
    },
    ledgerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    ledgerInfo: {
        flex: 1,
    },
    ledgerLabel: {
        fontFamily: 'Inter-Medium',
        marginBottom: 2,
    },
    ledgerValue: {
        fontSize: 14,
        color: colors.cobalt,
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
        maxWidth: 460, // Increased by 15%
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
    yearPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    yearPickerText: {
        color: colors.cobalt,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    yearPickerDropdown: {
        backgroundColor: colors.cream,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.md,
    },
    yearPickerLabel: {
        fontSize: 10,
        letterSpacing: 0.5,
        color: colors.slate,
        marginBottom: spacing.sm,
    },
    yearGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    yearChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 100,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
    },
    yearChipActive: {
        backgroundColor: colors.cobalt,
        borderColor: colors.cobalt,
    },
    yearChipText: {
        fontFamily: 'Inter-Medium',
        color: colors.charcoal,
    },
    yearChipTextActive: {
        color: '#FFF',
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
        height: 52, // Increased from 44 (~15%)
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
    },
    dayInner: {
        width: '100%',
        height: '100%',
        borderRadius: 10, // Slightly more rounded for larger size
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
