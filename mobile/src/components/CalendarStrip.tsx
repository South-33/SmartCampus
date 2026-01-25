import React from 'react';
import { ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Body, Caption } from './Typography';

const getWeekDays = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return {
            day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
            date: d.getDate(),
            classCount: i < 5 ? Math.floor(Math.random() * 3) + 1 : 0
        };
    });
};

interface CalendarStripProps {
    selectedDate: number;
    onSelectDate: (date: number) => void;
}

export const CalendarStrip = ({ selectedDate, onSelectDate }: CalendarStripProps) => {
    const weekDays = React.useMemo(() => getWeekDays(), []);
    
    return (
        <View style={styles.calendarStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekContent}>
                {weekDays.map((d) => (
                    <TouchableOpacity 
                        key={d.date} 
                        style={[styles.dayCard, selectedDate === d.date && styles.dayCardActive]} 
                        onPress={() => onSelectDate(d.date)}
                    >
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
    );
};

const styles = StyleSheet.create({
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
});
