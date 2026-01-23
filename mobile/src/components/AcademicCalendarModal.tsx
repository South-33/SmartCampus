import React, { useState, useMemo, useRef } from 'react';
import { Modal, View, TouchableOpacity, ScrollView, Animated, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme';
import { HeadingMd, HeadingSm, BodySm, Caption } from './Typography';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { 
    ENROLLMENT_START, 
    ENROLLMENT_END, 
    MONTH_NAMES, 
    getTermInfo, 
    getAcademicData 
} from '../data/academicUtils';

// Icons
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

interface AcademicCalendarModalProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: number;
    onSelectDate: (date: number) => void;
}

export const AcademicCalendarModal = ({ visible, onClose, selectedDate, onSelectDate }: AcademicCalendarModalProps) => {
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
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}><CloseIcon /></TouchableOpacity>
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
                                            <TouchableOpacity style={[styles.dayInner, d.isSelected && styles.daySelected, d.isHoliday && styles.dayHoliday, d.isExamDay && styles.dayExam, d.isToday && !d.isSelected && styles.dayToday]} onPress={() => { onSelectDate(d.day); onClose(); }}>
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
    );
};

const styles = StyleSheet.create({
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
    textCobalt: {
        color: colors.cobalt,
    },
});
