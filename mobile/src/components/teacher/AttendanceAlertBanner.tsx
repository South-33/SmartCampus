import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { BodySm, Caption } from '../Typography';
import Svg, { Path, Circle } from 'react-native-svg';

interface Alert {
    id: string;
    type: 'low_attendance' | 'at_risk' | 'suspicious';
    message: string;
    course?: string;
    priority: 'high' | 'medium';
}

const AlertIcon = ({ color }: { color: string }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
        <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <Path d="M12 9v4M12 17h.01" />
    </Svg>
);

export const AttendanceAlertBanner = ({ alerts }: { alerts: Alert[] }) => {
    if (alerts.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Caption style={styles.title}>ATTENTION REQUIRED</Caption>
                <View style={styles.badge}>
                    <Caption style={styles.badgeText}>{alerts.length}</Caption>
                </View>
            </View>
            <View style={styles.list}>
                {alerts.map((alert) => (
                    <TouchableOpacity key={alert.id} style={styles.alertCard} activeOpacity={0.8}>
                        <View style={[
                            styles.iconContainer,
                            { backgroundColor: alert.priority === 'high' ? colors.errorBg : colors.cream }
                        ]}>
                            <AlertIcon color={alert.priority === 'high' ? colors.error : colors.slate} />
                        </View>
                        <View style={styles.content}>
                            {alert.course && <Caption style={styles.course}>{alert.course}</Caption>}
                            <BodySm style={styles.message} numberOfLines={2}>{alert.message}</BodySm>
                        </View>
                        <View style={[
                            styles.priorityDot,
                            { backgroundColor: alert.priority === 'high' ? colors.error : '#F59E0B' }
                        ]} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.sm,
    },
    title: {
        letterSpacing: 1,
        color: colors.slate,
    },
    badge: {
        backgroundColor: colors.error,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Inter-Bold',
    },
    list: {
        gap: spacing.xs,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.mist,
        ...shadows.subtle,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    content: {
        flex: 1,
    },
    course: {
        fontSize: 10,
        color: colors.cobalt,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    message: {
        lineHeight: 18,
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginLeft: spacing.sm,
    },
});
