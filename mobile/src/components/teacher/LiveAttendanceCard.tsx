import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { Body, BodySm, HeadingMd, Caption } from '../Typography';
import Svg, { Circle, Path } from 'react-native-svg';

interface LiveAttendanceCardProps {
    courseName: string;
    room: string;
    present: number;
    total: number;
    onPress?: () => void;
}

export const LiveAttendanceCard = ({ courseName, room, present, total, onPress }: LiveAttendanceCardProps) => {
    const percentage = (present / total) * 100;
    const radiusCirc = 36;
    const circumference = 2 * Math.PI * radiusCirc;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
            <View style={styles.header}>
                <View style={styles.liveIndicator}>
                    <View style={styles.pulseDot} />
                    <Caption style={styles.liveText}>LIVE SESSION</Caption>
                </View>
                <Caption style={styles.room}>{room}</Caption>
            </View>

            <View style={styles.content}>
                <View style={styles.info}>
                    <HeadingMd style={styles.courseName}>{courseName}</HeadingMd>
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Body style={styles.statValue}>{present}</Body>
                            <Caption>Present</Caption>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <Body style={styles.statValue}>{total - present}</Body>
                            <Caption>Absent</Caption>
                        </View>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <Svg width={90} height={90} viewBox="0 0 100 100">
                        <Circle
                            cx="50"
                            cy="50"
                            r={radiusCirc}
                            stroke={colors.mist}
                            strokeWidth="8"
                            fill="none"
                        />
                        <Circle
                            cx="50"
                            cy="50"
                            r={radiusCirc}
                            stroke={colors.cobalt}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="none"
                            transform="rotate(-90 50 50)"
                        />
                    </Svg>
                    <View style={styles.percentageOverlay}>
                        <BodySm style={styles.percentageText}>{Math.round(percentage)}%</BodySm>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <BodySm style={styles.footerAction}>View Full Roster</BodySm>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
                    <Path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        borderRadius: radius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.mist,
        ...shadows.card,
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.cobaltAlpha10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 100,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.cobalt,
    },
    liveText: {
        color: colors.cobalt,
        fontFamily: 'Inter-Bold',
        fontSize: 10,
    },
    room: {
        color: colors.slate,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    info: {
        flex: 1,
    },
    courseName: {
        fontSize: 22,
        marginBottom: spacing.sm,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stat: {
        alignItems: 'flex-start',
    },
    statValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        lineHeight: 24,
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: colors.mist,
    },
    progressContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentageOverlay: {
        position: 'absolute',
    },
    percentageText: {
        fontFamily: 'Inter-Bold',
        color: colors.charcoal,
    },
    footer: {
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.ivory,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    footerAction: {
        color: colors.cobalt,
        fontFamily: 'Inter-SemiBold',
    },
});
