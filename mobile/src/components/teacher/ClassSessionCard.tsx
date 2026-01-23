import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { Body, BodySm, Caption } from '../Typography';
import Svg, { Path, Circle } from 'react-native-svg';

interface ClassSessionCardProps {
    code: string;
    name: string;
    room: string;
    time: string;
    status: 'completed' | 'ongoing' | 'upcoming';
    attendance?: {
        present: number;
        total: number;
    };
    onPress?: () => void;
}

const ClockIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M12 6v6l4 2" />
    </Svg>
);

const MapPinIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <Circle cx="12" cy="10" r="3" />
    </Svg>
);

export const ClassSessionCard = ({ code, name, room, time, status, attendance, onPress }: ClassSessionCardProps) => {
    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.8} onPress={onPress}>
            <View style={styles.header}>
                <View style={styles.titleArea}>
                    <Caption style={styles.code}>{code}</Caption>
                    <Body style={styles.name} numberOfLines={1}>{name}</Body>
                </View>
                <View style={[
                    styles.statusBadge,
                    status === 'ongoing' && styles.statusOngoing,
                    status === 'completed' && styles.statusCompleted,
                ]}>
                    <Caption style={[
                        styles.statusText,
                        status === 'ongoing' && styles.textWhite,
                        status === 'completed' && styles.textWhite,
                    ]}>
                        {status.toUpperCase()}
                    </Caption>
                </View>
            </View>

            <View style={styles.details}>
                <View style={styles.detailItem}>
                    <ClockIcon />
                    <Caption>{time}</Caption>
                </View>
                <View style={styles.detailItem}>
                    <MapPinIcon />
                    <Caption>{room}</Caption>
                </View>
            </View>

            {attendance && (
                <View style={styles.attendance}>
                    <View style={styles.attendanceBar}>
                        <View style={[
                            styles.attendanceFill,
                            { width: `${(attendance.present / attendance.total) * 100}%` }
                        ]} />
                    </View>
                    <Caption style={styles.attendanceCount}>
                        {attendance.present}/{attendance.total} Students
                    </Caption>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.mist,
        marginBottom: spacing.sm,
        ...shadows.subtle,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    titleArea: {
        flex: 1,
        marginRight: spacing.sm,
    },
    code: {
        color: colors.cobalt,
        fontFamily: 'Inter-SemiBold',
        fontSize: 10,
        marginBottom: 2,
    },
    name: {
        fontFamily: 'PlayfairDisplay-Medium',
        fontSize: 18,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: colors.cream,
    },
    statusOngoing: {
        backgroundColor: colors.cobalt,
    },
    statusCompleted: {
        backgroundColor: colors.success,
    },
    statusText: {
        fontSize: 9,
        fontFamily: 'Inter-Bold',
        color: colors.slate,
    },
    textWhite: {
        color: '#FFF',
    },
    details: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: spacing.sm,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    attendance: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    attendanceBar: {
        flex: 1,
        height: 4,
        backgroundColor: colors.mist,
        borderRadius: 2,
        overflow: 'hidden',
    },
    attendanceFill: {
        height: '100%',
        backgroundColor: colors.cobalt,
    },
    attendanceCount: {
        minWidth: 70,
        textAlign: 'right',
    },
});
