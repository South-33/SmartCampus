import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../theme';
import {
    HeadingLg,
    HeadingMd,
    Body,
    BodySm,
    Caption,
    Button,
} from '../components';
import { ArrowLeft, ScanFace, Clock, Check } from 'lucide-react-native';

interface AttendanceScreenProps {
    onBack: () => void;
}

export const AttendanceScreen = ({ onBack }: AttendanceScreenProps) => {
    const insets = useSafeAreaInsets();
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
        <View style={styles.container}>
            <View style={[
                styles.content,
                { paddingTop: Math.max(insets.top, 20) + spacing.md }
            ]}>
                {/* Header Row */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backButton} onPress={onBack}>
                            <ArrowLeft size={18} color={colors.slate} strokeWidth={2} />
                            <BodySm>Back</BodySm>
                        </TouchableOpacity>
                        
                        <HeadingMd style={styles.headerTitle}>CS101 — Data Structures</HeadingMd>
                        
                        {/* Spacer for centering */}
                        <View style={styles.headerSpacer} />
                    </View>
                    
                    <BodySm style={styles.headerMeta}>
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
                                <ScanFace size={48} color="#FFF" strokeWidth={1.5} />
                            </Animated.View>
                            <HeadingMd style={styles.promptTitle}>Verify with Face ID</HeadingMd>
                            <BodySm style={styles.promptDesc}>
                                Authenticate to mark your attendance, then tap your phone to the reader.
                            </BodySm>

                            {/* Timer */}
                            <View style={styles.timer}>
                                <Clock size={18} color={colors.cobalt} strokeWidth={2} />
                                <Body style={styles.timerText}>
                                    <Body style={styles.timerCount}>{timer}</Body> seconds remaining
                                </Body>
                            </View>
                        </>
                    )}

                    {status === 'success' && (
                        <View style={styles.successState}>
                            <View style={styles.successIcon}>
                                <Check size={32} color="#FFF" strokeWidth={3} />
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
        </View>
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
        paddingTop: 0,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: 80, // Fixed width for balancing
    },
    header: {
        marginBottom: spacing.xl,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 80, // Same as backButton width
    },
    headerMeta: {
        textAlign: 'center',
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
        ...Platform.select({
            web: {
                boxShadow: '0 0 24px rgba(59, 94, 232, 0.3)',
            },
            default: {
                shadowColor: colors.cobalt,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
                elevation: 8,
            },
        }),
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
