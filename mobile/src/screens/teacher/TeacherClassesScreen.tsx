import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import {
    HeadingLg,
    HeadingMd,
    Caption,
    ResponsiveContainer,
} from '../../components';
import {
    ClassSessionCard,
    CalendarStrip,
    AcademicCalendarModal,
} from '../../components';
import { getTermInfo } from '../../data/academicUtils';
import Svg, { Path, Rect } from 'react-native-svg';

interface TeacherClassesScreenProps {
    onViewClass: (classId: string) => void;
}

const CalendarIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <Path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const TeacherClassesScreen = ({ onViewClass }: TeacherClassesScreenProps) => {
    const insets = useSafeAreaInsets();
    const today = useMemo(() => new Date(), []);
    const [selectedDate, setSelectedDate] = useState(today.getDate());
    const [showCalendar, setShowCalendar] = useState(false);
    
    const viewYear = today.getFullYear();
    const viewMonth = today.getMonth();
    
    const termInfo = useMemo(() => getTermInfo(viewMonth, viewYear), [viewMonth, viewYear]);

    // Placeholder until Convex sessions are queryable
    const filteredClasses: any[] = []; 


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
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Caption style={styles.headerSubtitle}>Academic Year {viewYear}</Caption>
                            <HeadingLg style={styles.headerTitle}>{termInfo.name}</HeadingLg>
                        </View>
                        <TouchableOpacity style={styles.calendarButton} onPress={() => setShowCalendar(true)}>
                            <CalendarIcon />
                        </TouchableOpacity>
                    </View>

                    {/* Week Strip - Sticky */}
                    <CalendarStrip 
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />

                    <View style={styles.mainContent}>
                        <View style={styles.section}>
                            <Caption style={styles.sectionTitle}>
                                {new Date(viewYear, viewMonth, selectedDate).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </Caption>
                            
                            {filteredClasses.map((cls) => (
                                <ClassSessionCard
                                    key={cls.id}
                                    code={cls.code}
                                    name={cls.name}
                                    room={cls.room}
                                    time={`${cls.startTime} - ${cls.endTime}`}
                                    status={cls.status}
                                    attendance={cls.status !== 'upcoming' ? {
                                        present: cls.attendance.present + cls.attendance.late,
                                        total: cls.attendance.total
                                    } : undefined}
                                    onPress={() => onViewClass(cls.id)}
                                />
                            ))}
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
        paddingBottom: 120, 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
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
    mainContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    section: {
        gap: spacing.sm,
    },
    sectionTitle: {
        marginBottom: spacing.sm,
        color: colors.slate,
        letterSpacing: 0.5,
    }
});
