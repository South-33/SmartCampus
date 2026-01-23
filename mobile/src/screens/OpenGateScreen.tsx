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
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface OpenGateScreenProps {
    onBack: () => void;
}

// Icons
const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const NfcIcon = () => (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={1.5}>
        <Path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" strokeLinecap="round" />
        <Path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" strokeLinecap="round" />
        <Path d="M12.91 4.1a16.1 16.1 0 0 1 0 15.8" strokeLinecap="round" />
        <Rect x="16" y="8" width="5" height="8" rx="1" strokeLinecap="round" />
    </Svg>
);

const ClockIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M12 6v6l4 2" strokeLinecap="round" />
    </Svg>
);

const DoorOpenIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2}>
        <Path d="M3 21h18M9 21V3h12v18" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="15" cy="12" r="1" fill="#FFF" stroke="none" />
    </Svg>
);

const CloseIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth={2}>
        <Path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const OpenGateScreen = ({ onBack }: OpenGateScreenProps) => {
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
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <BackIcon />
                    <BodySm>Back</BodySm>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <HeadingLg>Open Gate</HeadingLg>
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
                                    <NfcIcon />
                                </Animated.View>
                            </View>
                            <HeadingMd style={styles.promptTitle}>Ready to Scan</HeadingMd>
                            <BodySm style={styles.promptDesc}>
                                Hold your phone near the door reader. The door will unlock automatically.
                            </BodySm>

                            {/* Timer */}
                            <View style={styles.timer}>
                                <ClockIcon />
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
                                <DoorOpenIcon />
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
                                <CloseIcon />
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
    header: {
        marginBottom: spacing.xl,
    },
    headerMeta: {
        marginTop: 4,
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
        shadowColor: colors.cobalt,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
        elevation: 8,
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
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 8,
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
