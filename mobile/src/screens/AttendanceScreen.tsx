import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, spacing } from '../theme';
import {
    HeadingLg,
    HeadingMd,
    Body,
    BodySm,
    Caption,
    Button,
} from '../components';
import { ArrowLeft, ScanFace, Clock, Check, ShieldAlert } from 'lucide-react-native';

interface AttendanceScreenProps {
    onBack: () => void;
}

export const AttendanceScreen = ({ onBack }: AttendanceScreenProps) => {
    const insets = useSafeAreaInsets();
    const [timer, setTimer] = useState(60);
    const [status, setStatus] = useState<'waiting' | 'authenticating' | 'success' | 'error'>('waiting');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    const user = useQuery(api.users.viewer);

    // Initialize Services
    useEffect(() => {
        NfcManager.start().catch(err => console.warn('NFC Start Error:', err));
        
        // Request Location permissions early
        Location.requestForegroundPermissionsAsync();

        return () => {
            NfcManager.cancelTechnologyRequest().catch(() => {});
        };
    }, []);

    const handleAttendance = async () => {
        if (!user) return;

        try {
            setStatus('authenticating');

            // 1. Biometric Auth
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                Alert.alert('Security Error', 'Biometric authentication is required for attendance.');
                setStatus('error');
                setErrorMsg('Biometrics not available');
                return;
            }

            const auth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verify identity for attendance',
                fallbackLabel: 'Enter Passcode',
            });

            if (!auth.success) {
                setStatus('waiting');
                return;
            }

            // 2. Get Location (Geofencing)
            let location = null;
            try {
                const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
                if (locStatus === 'granted') {
                    location = await Location.getCurrentPositionAsync({ 
                        accuracy: Location.Accuracy.Balanced 
                    });
                }
            } catch (err) {
                console.warn('Location Error:', err);
            }

            // 3. NFC Broadcast
            await NfcManager.cancelTechnologyRequest().catch(() => {});
            await NfcManager.requestTechnology(NfcTech.Ndef);
            
            // Payload: ATTENDANCE|userId|timestamp|lat|lng
            const lat = location?.coords.latitude || 0;
            const lng = location?.coords.longitude || 0;
            const payload = `ATTENDANCE|${user._id}|${Date.now()}|${lat}|${lng}`;
            const bytes = Ndef.encodeMessage([Ndef.textRecord(payload)]);
            
            if (bytes) {
                await NfcManager.ndefHandler.writeNdefMessage(bytes);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setStatus('success');
            }

        } catch (ex) {
            console.warn('Attendance Error:', ex);
            setStatus('error');
            setErrorMsg('Connection failed');
        } finally {
            // Keep session open until success or manual close
        }
    };

    // Pulse animation
    useEffect(() => {
        if (status === 'success' || status === 'error') return;
        
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
    }, [pulseAnim, status]);

    // Timer countdown
    useEffect(() => {
        if (status !== 'waiting' || timer <= 0) return;

        const interval = setInterval(() => {
            setTimer((t) => t - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [status, timer]);

    return (
        <View style={styles.container}>
            <View style={[
                styles.content,
                { paddingTop: insets.top + spacing.lg }
            ]}>
                {/* Header Row */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <ArrowLeft size={20} color={colors.slate} strokeWidth={2} />
                        </TouchableOpacity>
                        
                        <HeadingLg style={styles.headerTitle}>Class Attendance</HeadingLg>
                        
                        {/* Spacer for centering */}
                        <View style={styles.headerSpacer} />
                    </View>
                    
                    <BodySm style={styles.headerMeta}>
                        Verify identity and tap reader
                    </BodySm>
                </View>

                {/* Biometric Area */}
                <View style={styles.biometricArea}>
                    {(status === 'waiting' || status === 'authenticating') && (
                        <>
                            <Animated.View
                                style={[
                                    styles.biometricIcon,
                                    status === 'authenticating' && styles.authenticatingIcon,
                                    { transform: [{ scale: pulseAnim }] }
                                ]}
                            >
                                <ScanFace size={48} color="#FFF" strokeWidth={1.5} />
                            </Animated.View>
                            <HeadingMd style={styles.promptTitle}>
                                {status === 'authenticating' ? 'Verifying...' : 'Ready to Start'}
                            </HeadingMd>
                            <BodySm style={styles.promptDesc}>
                                Tap the button below to authenticate with Face ID and mark your attendance.
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
                                You're checked in. The door should open now.
                            </BodySm>
                        </View>
                    )}

                    {status === 'error' && (
                        <View style={styles.errorState}>
                            <View style={styles.errorIcon}>
                                <ShieldAlert size={32} color={colors.error} strokeWidth={2} />
                            </View>
                            <HeadingMd style={styles.errorTitle}>Failed</HeadingMd>
                            <BodySm style={styles.errorDesc}>{errorMsg || 'Could not verify identity.'}</BodySm>
                            <Button 
                                variant="secondary" 
                                style={{ marginTop: spacing.lg }}
                                onPress={() => setStatus('waiting')}
                            >
                                Try Again
                            </Button>
                        </View>
                    )}
                </View>

                {/* Action */}
                <View style={styles.footer}>
                    {status === 'waiting' && (
                        <Button onPress={handleAttendance}>Start Verification</Button>
                    )}
                    {status === 'success' && (
                        <Button onPress={onBack}>Done</Button>
                    )}
                    {(status === 'authenticating' || status === 'error') && (
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
    authenticatingIcon: {
        backgroundColor: colors.slate,
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
    errorState: {
        alignItems: 'center',
    },
    errorIcon: {
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
    errorTitle: {
        color: colors.error,
        marginBottom: 8,
    },
    errorDesc: {
        textAlign: 'center',
        maxWidth: 260,
        color: colors.slate,
    },
    footer: {
        paddingBottom: spacing.xl,
    },
});
