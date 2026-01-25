import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import {
    HeadingLg,
    HeadingMd,
    Body,
    BodySm,
    Caption,
    Button,
} from '../components';
import { ArrowLeft, Nfc, Clock, DoorOpen, XCircle } from 'lucide-react-native';

interface OpenGateScreenProps {
    onBack: () => void;
}

export const OpenGateScreen = ({ onBack }: OpenGateScreenProps) => {
    const insets = useSafeAreaInsets();
    const [timer, setTimer] = useState(60);
    const [status, setStatus] = useState<'waiting' | 'success' | 'timeout'>('waiting');
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const waveAnim = React.useRef(new Animated.Value(0)).current;

    // Pulse animation
    useEffect(() => {
        if (status !== 'waiting') return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.03,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        );

        const wave = Animated.loop(
            Animated.sequence([
                Animated.timing(waveAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(waveAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();
        wave.start();
        return () => {
            pulse.stop();
            wave.stop();
        };
    }, [pulseAnim, waveAnim, status]);

    // Timer countdown
    useEffect(() => {
        if (status !== 'waiting' || timer <= 0) {
            if (timer <= 0 && status === 'waiting') {
                setStatus('timeout');
            }
            return;
        }

        const interval = setInterval(() => {
            setTimer((t) => t - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [status, timer]);

    // Demo: auto-success after 4 seconds
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (status === 'waiting') {
                setStatus('success');
            }
        }, 4000);
        return () => clearTimeout(timeout);
    }, [status]);

    const handleRetry = () => {
        setTimer(60);
        setStatus('waiting');
    };

    const waveScale = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.8],
    });

    const waveOpacity = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 0],
    });

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
                        
                        <HeadingMd style={styles.headerTitle}>Open Gate</HeadingMd>
                        
                        {/* Spacer for centering */}
                        <View style={styles.headerSpacer} />
                    </View>
                    
                    <BodySm style={styles.headerMeta}>
                        Tap your phone to the NFC reader
                    </BodySm>
                </View>

                {/* NFC Prompt */}
                <View style={styles.nfcArea}>
                    {status === 'waiting' && (
                        <>
                            <View style={styles.nfcContainer}>
                                {/* Ripple wave */}
                                <Animated.View
                                    style={[
                                        styles.wave,
                                        {
                                            transform: [{ scale: waveScale }],
                                            opacity: waveOpacity,
                                        },
                                    ]}
                                />
                                <Animated.View
                                    style={[
                                        styles.nfcIcon,
                                        { transform: [{ scale: pulseAnim }] }
                                    ]}
                                >
                                    <Nfc size={48} color="#FFF" strokeWidth={1.5} />
                                </Animated.View>
                            </View>
                            <HeadingMd style={styles.promptTitle}>Ready to Scan</HeadingMd>
                            <BodySm style={styles.promptDesc}>
                                Hold your phone near the door reader. The door will unlock automatically.
                            </BodySm>

                            {/* Timer */}
                            <View style={styles.timer}>
                                <Clock size={18} color={colors.cobalt} strokeWidth={2} />
                                <Body style={styles.timerText}>
                                    <Body style={styles.timerCount}>{timer}</Body> seconds remaining
                                </Body>
                            </View>

                            {/* Having trouble link */}
                            {timer <= 45 && (
                                <TouchableOpacity style={styles.troubleLink}>
                                    <Caption style={styles.troubleText}>Having trouble?</Caption>
                                </TouchableOpacity>
                            )}
                        </>
                    )}

                    {status === 'success' && (
                        <View style={styles.successState}>
                            <View style={styles.successIcon}>
                                <DoorOpen size={40} color="#FFF" strokeWidth={2} />
                            </View>
                            <HeadingMd style={styles.successTitle}>Door Unlocked!</HeadingMd>
                            <BodySm style={styles.successDesc}>
                                The door should open now. You have 5 seconds to enter.
                            </BodySm>
                        </View>
                    )}

                    {status === 'timeout' && (
                        <View style={styles.timeoutState}>
                            <View style={styles.timeoutIcon}>
                                <XCircle size={32} color={colors.error} strokeWidth={2} />
                            </View>
                            <HeadingMd style={styles.timeoutTitle}>Time Expired</HeadingMd>
                            <BodySm style={styles.timeoutDesc}>
                                The scan window has closed. Tap below to try again.
                            </BodySm>
                        </View>
                    )}
                </View>

                {/* Action */}
                <View style={styles.footer}>
                    {status === 'success' && (
                        <Button onPress={onBack}>Done</Button>
                    )}
                    {status === 'timeout' && (
                        <Button onPress={handleRetry}>Try Again</Button>
                    )}
                    {status === 'waiting' && (
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
    nfcArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
    },
    nfcContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    wave: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: colors.cobalt,
    },
    nfcIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.cobalt,
        alignItems: 'center',
        justifyContent: 'center',
        // Glow effect
        ...Platform.select({
            web: {
                boxShadow: '0 0 28px rgba(59, 94, 232, 0.35)',
            },
            default: {
                shadowColor: colors.cobalt,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 28,
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
        maxWidth: 280,
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
    troubleLink: {
        marginTop: spacing.md,
        padding: spacing.sm,
    },
    troubleText: {
        color: colors.cobalt,
        textDecorationLine: 'underline',
    },
    successState: {
        alignItems: 'center',
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        // Glow
        ...Platform.select({
            web: {
                boxShadow: '0 0 20px rgba(46, 125, 50, 0.4)',
            },
            default: {
                shadowColor: colors.success,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 8,
            },
        }),
    },
    successTitle: {
        color: colors.success,
        marginBottom: 8,
    },
    successDesc: {
        textAlign: 'center',
        maxWidth: 260,
    },
    timeoutState: {
        alignItems: 'center',
    },
    timeoutIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.cream,
        borderWidth: 2,
        borderColor: colors.error,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    timeoutTitle: {
        color: colors.error,
        marginBottom: 8,
    },
    timeoutDesc: {
        textAlign: 'center',
        maxWidth: 260,
    },
    footer: {
        paddingBottom: spacing.lg,
    },
});
