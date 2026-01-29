import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import * as Haptics from 'expo-haptics';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing, radius } from '../theme';
import {
    HeadingLg,
    HeadingMd,
    ResponsiveContainer,
    Body,
    BodySm,
    Caption,
    Button,
} from '../components';
import Svg, { Path, Rect } from 'react-native-svg';

interface LinkCardScreenProps {
    onBack: () => void;
    onSuccess?: () => void;
}

// Icons
const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CardScanIcon = () => (
    <Svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={1.5}>
        <Rect x="2" y="5" rx="2" width="20" height="14" />
        <Path d="M2 10h20" />
        <Path d="M6 15h4" strokeLinecap="round" />
    </Svg>
);

const CheckmarkIcon = () => (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}>
        <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PhoneIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Rect x="5" y="2" width="14" height="20" rx="2" />
        <Path d="M12 18h.01" strokeLinecap="round" />
    </Svg>
);

export const LinkCardScreen = ({ onBack, onSuccess }: LinkCardScreenProps) => {
    const insets = useSafeAreaInsets();
    const [status, setStatus] = useState<'ready' | 'scanning' | 'success'>('ready');
    const [lastUID, setLastUID] = useState<string | null>(null);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const scanLineAnim = React.useRef(new Animated.Value(0)).current;

    const linkCard = useMutation(api.users.linkCard);

    // Initialize NFC
    useEffect(() => {
        NfcManager.start();
        return () => {
            NfcManager.cancelTechnologyRequest().catch(() => {});
        };
    }, []);

    // Pulse animation for ready state
    useEffect(() => {
        if (status !== 'scanning') return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        const scanLine = Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();
        scanLine.start();
        return () => {
            pulse.stop();
            scanLine.stop();
        };
    }, [status, pulseAnim, scanLineAnim]);

    const handleStartScan = async () => {
        try {
            setStatus('scanning');
            // Clean up any existing session
            await NfcManager.cancelTechnologyRequest().catch(() => {});
            
            await NfcManager.requestTechnology(NfcTech.Ndef);
            const tag = await NfcManager.getTag();
            
            if (tag?.id) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await linkCard({ cardUID: tag.id });
                setLastUID(tag.id);
                setStatus('success');
            } else {
                setStatus('ready');
            }
        } catch (ex: any) {
            console.warn('NFC Error:', ex);
            setStatus('ready');
        } finally {
            NfcManager.cancelTechnologyRequest().catch(() => {});
        }
    };

    const handleDone = () => {
        onSuccess?.();
        onBack();
    };

    const scanLineTranslate = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-40, 40],
    });

    const displayUID = lastUID ? `•••• •••• ${lastUID.slice(-4).toUpperCase()}` : '•••• •••• ----';

    return (
        <View style={styles.container}>
            <ResponsiveContainer>
                <View style={[
                    styles.content,
                    { paddingTop: insets.top + spacing.lg }
                ]}>
                    {/* Header Row */}
                    <View style={styles.header}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <BackIcon />
                            </TouchableOpacity>
                            
                            <HeadingLg style={styles.headerTitle}>Link Your Card</HeadingLg>
                            
                            {/* Spacer for centering */}
                            <View style={styles.headerSpacer} />
                        </View>
                        
                        <BodySm style={styles.headerMeta}>
                            Connect your physical NFC card to your account
                        </BodySm>
                    </View>

                    {/* Scan Area */}
                    <View style={styles.scanArea}>
                        {status === 'ready' && (
                            <>
                                <View style={styles.cardPreview}>
                                    <CardScanIcon />
                                </View>
                                <HeadingMd style={styles.promptTitle}>Ready to Scan</HeadingMd>
                                <BodySm style={styles.promptDesc}>
                                    Place your student NFC card on the back of your phone to link it to your account.
                                </BodySm>

                                {/* Instructions */}
                                <View style={styles.instructions}>
                                    <View style={styles.instructionItem}>
                                        <View style={styles.instructionNumber}>
                                            <Caption style={styles.instructionNumberText}>1</Caption>
                                        </View>
                                        <BodySm>Hold your card ready</BodySm>
                                    </View>
                                    <View style={styles.instructionItem}>
                                        <View style={styles.instructionNumber}>
                                            <Caption style={styles.instructionNumberText}>2</Caption>
                                        </View>
                                        <BodySm>Tap "Start Scanning" below</BodySm>
                                    </View>
                                    <View style={styles.instructionItem}>
                                        <View style={styles.instructionNumber}>
                                            <Caption style={styles.instructionNumberText}>3</Caption>
                                        </View>
                                        <BodySm>Place card on phone back</BodySm>
                                    </View>
                                </View>
                            </>
                        )}

                        {status === 'scanning' && (
                            <>
                                <Animated.View
                                    style={[
                                        styles.scanningCard,
                                        { transform: [{ scale: pulseAnim }] }
                                    ]}
                                >
                                    <CardScanIcon />
                                    {/* Scan line effect */}
                                    <Animated.View
                                        style={[
                                            styles.scanLine,
                                            { transform: [{ translateY: scanLineTranslate }] }
                                        ]}
                                    />
                                </Animated.View>
                                <HeadingMd style={styles.promptTitle}>Scanning...</HeadingMd>
                                <BodySm style={styles.promptDesc}>
                                    Hold the card steady against the back of your phone
                                </BodySm>

                                <View style={styles.phoneHint}>
                                    <PhoneIcon />
                                    <Caption style={styles.phoneHintText}>
                                        NFC is usually near the top of your phone
                                    </Caption>
                                </View>
                            </>
                        )}

                        {status === 'success' && (
                            <View style={styles.successState}>
                                <View style={styles.successIcon}>
                                    <CheckmarkIcon />
                                </View>
                                <HeadingMd style={styles.successTitle}>Card Linked!</HeadingMd>
                                <BodySm style={styles.successDesc}>
                                    Your NFC card is now connected to your account. You can use it to access doors.
                                </BodySm>

                                <View style={styles.cardInfo}>
                                    <Caption style={styles.cardInfoLabel}>Card ID</Caption>
                                    <Body style={styles.cardInfoValue}>{displayUID}</Body>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Action */}
                    <View style={styles.footer}>
                        {status === 'ready' && (
                            <Button onPress={handleStartScan}>Start Scanning</Button>
                        )}
                        {status === 'scanning' && (
                            <Button variant="secondary" onPress={onBack}>Cancel</Button>
                        )}
                        {status === 'success' && (
                            <Button onPress={handleDone}>Done</Button>
                        )}
                    </View>
                </View>
            </ResponsiveContainer>
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
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: 68,
        height: 44,
    },
    header: {
        marginBottom: spacing.lg,
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
        width: 68,
        height: 44,
    },
    headerMeta: {
        textAlign: 'center',
    },
    scanArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
    },
    cardPreview: {
        width: 140,
        height: 90,
        borderRadius: radius.md,
        backgroundColor: colors.cobalt,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        // Shadow
        ...Platform.select({
            web: {
                boxShadow: `0 8px 16px ${colors.cobaltAlpha20}`,
            },
            default: {
                shadowColor: colors.cobalt,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 8,
            },
        }),
    },
    scanningCard: {
        width: 140,
        height: 90,
        borderRadius: radius.md,
        backgroundColor: colors.cobalt,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        overflow: 'hidden',
        // Glow
        ...Platform.select({
            web: {
                boxShadow: `0 0 24px ${colors.cobaltAlpha20}`,
            },
            default: {
                shadowColor: colors.cobalt,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 24,
                elevation: 10,
            },
        }),
    },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.7)',
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
    instructions: {
        marginTop: spacing.xl,
        gap: spacing.md,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    instructionNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instructionNumberText: {
        color: colors.cobalt,
        fontFamily: 'Inter-SemiBold',
    },
    phoneHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.cream,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 100,
        marginTop: spacing.xl,
    },
    phoneHintText: {
        color: colors.cobalt,
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
        marginBottom: spacing.lg,
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
        maxWidth: 280,
        marginBottom: spacing.lg,
    },
    cardInfo: {
        backgroundColor: colors.cream,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.sm,
        alignItems: 'center',
    },
    cardInfoLabel: {
        color: colors.slate,
        marginBottom: 2,
    },
    cardInfoValue: {
        fontFamily: 'Inter-SemiBold',
        color: colors.cobalt,
        letterSpacing: 1,
    },
    footer: {
        paddingBottom: spacing.xl,
    },
});
