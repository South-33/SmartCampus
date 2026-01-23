import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import {
    HeadingLg,
    HeadingMd,
    Body,
    BodySm,
    Caption,
    Button,
} from '../components';
import Svg, { Path, Circle } from 'react-native-svg';

interface AttendanceScreenProps {
    onBack: () => void;
}

// Icons
const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const FaceIdIcon = () => (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={1.5}>
        <Path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
        <Circle cx="9" cy="9" r="1" fill="#FFF" stroke="none" />
        <Circle cx="15" cy="9" r="1" fill="#FFF" stroke="none" />
        <Path d="M9 15c.83 1.17 2.17 2 3.5 2s2.67-.83 3.5-2" strokeLinecap="round" />
    </Svg>
);

const ClockIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M12 6v6l4 2" strokeLinecap="round" />
    </Svg>
);

const CheckmarkIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}>
        <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const AttendanceScreen = ({ onBack }: AttendanceScreenProps) => {
    const [timer, setTimer] = useState(60);
    const [status, setStatus] = useState<'waiting' | 'success' | 'error'>('waiting');
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    // Pulse animation
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    // Timer countdown
    useEffect(() => {
        if (status !== 'waiting' || timer <= 0) return;

        const interval = setInterval(() => {
            setTimer((t) => t - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [status, timer]);

    // Demo: auto-success after 5 seconds
    useEffect(() => {
        const timeout = setTimeout(() => {
            setStatus('success');
        }, 5000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <BackIcon />
                    <BodySm>Back</BodySm>
                </TouchableOpacity>

                {/* Class Info */}
                <View style={styles.classInfo}>
                    <HeadingLg>CS101 — Data Structures</HeadingLg>
                    <BodySm style={styles.classMeta}>
                        Room 305 · 09:00 – 10:30
                    </BodySm>
                </View>

                {/* Biometric Prompt */}
                <View style={styles.biometricArea}>
                    {status === 'waiting' && (
                        <>
                            <Animated.View
                                style={[
                                    styles.biometricIcon,
                                    { transform: [{ scale: pulseAnim }] }
                                ]}
                            >
                                <FaceIdIcon />
                            </Animated.View>
                            <HeadingMd style={styles.promptTitle}>Verify with Face ID</HeadingMd>
                            <BodySm style={styles.promptDesc}>
                                Authenticate to mark your attendance, then tap your phone to the reader.
                            </BodySm>

                            {/* Timer */}
                            <View style={styles.timer}>
                                <ClockIcon />
                                <Body style={styles.timerText}>
                                    <Body style={styles.timerCount}>{timer}</Body> seconds remaining
                                </Body>
                            </View>
                        </>
                    )}

                    {status === 'success' && (
                        <View style={styles.successState}>
                            <View style={styles.successIcon}>
                                <CheckmarkIcon />
                            </View>
                            <HeadingMd style={styles.successTitle}>Attendance Recorded</HeadingMd>
                            <BodySm style={styles.successDesc}>
                                You're checked in for CS101. The door should open now.
                            </BodySm>
                        </View>
                    )}
                </View>

                {/* Action */}
                <View style={styles.footer}>
                    {status === 'success' ? (
                        <Button onPress={onBack}>Done</Button>
                    ) : (
                        <Button variant="secondary" onPress={onBack}>Cancel</Button>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ivory,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.lg,
    },
    classInfo: {
        marginBottom: spacing.xl,
    },
    classMeta: {
        marginTop: 4,
    },
    biometricArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
    },
    biometricIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.cobalt,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        // Glow effect
        shadowColor: colors.cobalt,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 8,
    },
    promptTitle: {
        marginBottom: 8,
        textAlign: 'center',
    },
    promptDesc: {
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 20,
    },
    timer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.cream,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 100,
        marginTop: spacing.lg,
    },
    timerText: {
        fontSize: 14,
    },
    timerCount: {
        fontFamily: 'PlayfairDisplay-Medium',
        color: colors.cobalt,
    },
    successState: {
        alignItems: 'center',
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    successTitle: {
        color: colors.success,
        marginBottom: 8,
    },
    successDesc: {
        textAlign: 'center',
        maxWidth: 260,
    },
    footer: {
        paddingBottom: 60,
    },
});
