import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { Body, BodySm, HeadingMd, Caption } from '../Typography';
import Svg, { Path } from 'react-native-svg';

interface TeachingHoursWidgetProps {
    thisWeek: number;
    target: number;
    status: 'teaching' | 'break' | 'idle';
    onPress?: () => void;
}

export const TeachingHoursWidget = ({ thisWeek, target, status, onPress }: TeachingHoursWidgetProps) => {
    const progress = Math.min((thisWeek / target) * 100, 100);

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.8} onPress={onPress}>
            <View style={styles.header}>
                <Caption style={styles.title}>TEACHING HOURS</Caption>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: status === 'teaching' ? colors.successBg : colors.cream }
                ]}>
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: status === 'teaching' ? colors.success : colors.slate }
                    ]} />
                    <Caption style={{ color: status === 'teaching' ? colors.success : colors.slate }}>
                        {status === 'teaching' ? 'In Session' : 'Off Duty'}
                    </Caption>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.stats}>
                    <View style={styles.valueRow}>
                        <HeadingMd style={styles.value}>{thisWeek.toFixed(1)}</HeadingMd>
                        <BodySm style={styles.target}>/ {target}h</BodySm>
                    </View>
                    <Caption>Weekly Progress</Caption>
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Caption style={styles.remaining}>
                        {target - thisWeek > 0 ? `${(target - thisWeek).toFixed(1)}h remaining` : 'Target reached'}
                    </Caption>
                </View>
            </View>
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
        ...shadows.subtle,
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        letterSpacing: 1,
        color: colors.slate,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 100,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.lg,
    },
    stats: {
        flex: 1,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        marginBottom: 2,
    },
    value: {
        fontSize: 28,
    },
    target: {
        color: colors.slate,
        fontFamily: 'Inter-Medium',
    },
    progressSection: {
        flex: 1.5,
        gap: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.mist,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.cobalt,
        borderRadius: 4,
    },
    remaining: {
        textAlign: 'right',
        color: colors.slate,
    },
});
