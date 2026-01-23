import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Body, BodySm, Caption } from '../Typography';
import Svg, { Path, Circle } from 'react-native-svg';

interface StudentAttendanceRowProps {
    name: string;
    studentId: string;
    status: 'present' | 'late' | 'absent';
    checkInTime: string | null;
    onMarkPresent?: () => void;
}

const CheckIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3}>
        <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const StudentAttendanceRow = ({ name, studentId, status, checkInTime, onMarkPresent }: StudentAttendanceRowProps) => {
    const getStatusColor = () => {
        switch (status) {
            case 'present': return colors.success;
            case 'late': return '#F59E0B';
            case 'absent': return colors.error;
            default: return colors.slate;
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
                {status !== 'absent' && <CheckIcon />}
            </View>
            
            <View style={styles.info}>
                <Body style={styles.name}>{name}</Body>
                <Caption>{studentId}</Caption>
            </View>

            <View style={styles.right}>
                {status !== 'absent' ? (
                    <View style={styles.timeInfo}>
                        <BodySm style={{ color: getStatusColor() }}>{status.toUpperCase()}</BodySm>
                        <Caption>{checkInTime}</Caption>
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={styles.markButton} 
                        onPress={onMarkPresent}
                        activeOpacity={0.7}
                    >
                        <Caption style={styles.markText}>MARK PRESENT</Caption>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.ivory,
    },
    statusIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    info: {
        flex: 1,
    },
    name: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        marginBottom: 2,
    },
    right: {
        alignItems: 'flex-end',
    },
    timeInfo: {
        alignItems: 'flex-end',
    },
    markButton: {
        backgroundColor: colors.cream,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.mist,
    },
    markText: {
        color: colors.cobalt,
        fontFamily: 'Inter-Bold',
        fontSize: 10,
    },
});
