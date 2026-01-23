import React from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import {
    HeadingLg,
    HeadingMd,
    Body,
    BodySm,
    Caption,
    ResponsiveContainer,
} from '../../components';
import { teachingHistory, teachingHours, classHoursProgress } from '../../data/teacherMockData';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const HistoryIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M12 6v6l4 2" />
    </Svg>
);

const BookIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </Svg>
);

export const TeachingHoursScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveContainer>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    alwaysBounceVertical={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Caption style={styles.subtitle}>LOG HISTORY</Caption>
                        <HeadingLg>Teaching Hours</HeadingLg>
                    </View>

                    {/* Summary Cards */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <HeadingMd style={styles.statValue}>{teachingHours.thisWeek}h</HeadingMd>
                            <Caption>This Week</Caption>
                            <View style={styles.miniProgress}>
                                <View style={[styles.miniProgressFill, { width: `${(teachingHours.thisWeek / teachingHours.target) * 100}%` }]} />
                            </View>
                        </View>
                        <View style={styles.statCard}>
                            <HeadingMd style={styles.statValue}>{teachingHours.thisMonth}h</HeadingMd>
                            <Caption>This Month</Caption>
                            <View style={styles.miniProgress}>
                                <View style={[styles.miniProgressFill, { width: '65%', backgroundColor: '#6366F1' }]} />
                            </View>
                        </View>
                    </View>

                    {/* Class Progress Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <BookIcon />
                            <HeadingMd style={styles.sectionTitle}>Course Completion</HeadingMd>
                        </View>
                        <View style={styles.classProgressList}>
                            {classHoursProgress.map((item) => (
                                <View key={item.id} style={styles.classProgressCard}>
                                    <View style={styles.classProgressInfo}>
                                        <View>
                                            <Body style={styles.className}>{item.name}</Body>
                                            <Caption>{item.code}</Caption>
                                        </View>
                                        <View style={styles.classHoursLabel}>
                                            <BodySm style={styles.hoursValue}>{item.completed}/{item.total}h</BodySm>
                                            <Caption>{Math.round((item.completed / item.total) * 100)}%</Caption>
                                        </View>
                                    </View>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${(item.completed / item.total) * 100}%`, backgroundColor: item.color }]} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* History List */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <HistoryIcon />
                            <HeadingMd style={styles.sectionTitle}>Recent Sessions</HeadingMd>
                        </View>

                        <View style={styles.historyList}>
                            {teachingHistory.map((item) => (
                                <View key={item.id} style={styles.historyItem}>
                                    <View style={styles.historyDate}>
                                        <Body style={styles.dateDay}>
                                            {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </Body>
                                        <Caption style={styles.dateWeekday}>{new Date(item.date).toLocaleDateString('en-GB', { weekday: 'short' })}</Caption>
                                    </View>
                                    
                                    <View style={styles.historyDetails}>
                                        <View style={styles.timeRow}>
                                            <View style={styles.timePoint}>
                                                <Caption style={styles.timeLabel}>IN</Caption>
                                                <BodySm style={styles.timeValue}>{item.scanIn}</BodySm>
                                            </View>
                                            <View style={styles.timeDivider} />
                                            <View style={styles.timePoint}>
                                                <Caption style={styles.timeLabel}>OUT</Caption>
                                                <BodySm style={styles.timeValue}>{item.scanOut}</BodySm>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.historyDuration}>
                                        <Body style={styles.durationValue}>{item.duration}</Body>
                                        <View style={styles.completeBadge}>
                                            <Caption style={styles.completeText}>COMPLETE</Caption>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </ResponsiveContainer>
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
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: 72,
    },
    header: {
        marginBottom: spacing.lg,
    },
    subtitle: {
        color: colors.slate,
        letterSpacing: 1,
        marginBottom: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.mist,
        alignItems: 'center',
        ...shadows.subtle,
    },
    statValue: {
        fontSize: 24,
        color: colors.cobalt,
        marginBottom: 2,
    },
    miniProgress: {
        height: 3,
        width: '100%',
        backgroundColor: colors.mist,
        borderRadius: 2,
        marginTop: 12,
        overflow: 'hidden',
    },
    miniProgressFill: {
        height: '100%',
        backgroundColor: colors.cobalt,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
    },
    classProgressList: {
        gap: spacing.sm,
    },
    classProgressCard: {
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.mist,
        ...shadows.subtle,
    },
    classProgressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    className: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        marginBottom: 2,
    },
    classHoursLabel: {
        alignItems: 'flex-end',
    },
    hoursValue: {
        fontFamily: 'Inter-Bold',
        color: colors.charcoal,
    },
    progressBar: {
        height: 6,
        backgroundColor: colors.mist,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    historyList: {
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.mist,
        overflow: 'hidden',
        ...shadows.subtle,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    historyDate: {
        width: 85,
        paddingRight: spacing.md,
        borderRightWidth: 1,
        borderRightColor: colors.mist,
        marginRight: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateDay: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 20,
    },
    dateWeekday: {
        fontSize: 11,
        color: colors.slate,
        textAlign: 'center',
    },
    historyDetails: {
        flex: 1,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    timePoint: {
        alignItems: 'center',
        minWidth: 45,
    },
    timeLabel: {
        fontSize: 8,
        color: colors.slate,
        marginBottom: 2,
    },
    timeValue: {
        fontFamily: 'Inter-Medium',
        fontSize: 13,
    },
    timeDivider: {
        width: 1,
        height: 32,
        backgroundColor: colors.mist,
    },
    historyDuration: {
        alignItems: 'flex-end',
        gap: 4,
    },
    durationValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
    },
    completeBadge: {
        backgroundColor: colors.successBg,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    completeText: {
        color: colors.success,
        fontSize: 8,
        fontFamily: 'Inter-Bold',
    },
});
