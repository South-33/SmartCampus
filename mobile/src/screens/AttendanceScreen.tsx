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
import Constants from 'expo-constants';
import { useAppData } from '../context/AppContext';
import { useAttendance } from '../hooks/useAttendance';
import { colors, spacing } from '../theme';
import { loadNfcManager, NfcModule } from '../lib/nfc';
import {
    HeadingLg,
    HeadingMd,
    Body,
    BodySm,
    Caption,
    Button,
} from '../components';
import { ArrowLeft, ScanFace, Clock, Check, ShieldAlert, WifiOff } from 'lucide-react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface AttendanceScreenProps {
    onBack: () => void;
}

export const AttendanceScreen = ({ onBack }: AttendanceScreenProps) => {
    const insets = useSafeAreaInsets();
    const [timer, setTimer] = useState(60);
    const [status, setStatus] = useState<'waiting' | 'authenticating' | 'success' | 'offline_success' | 'error'>('waiting');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [nfcMode, setNfcMode] = useState<'unknown' | 'real' | 'demo'>('unknown');
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const nfcRef = React.useRef<NfcModule | null>(null);

    const { viewer, activeSemester, deviceId, isDemo } = useAppData();
    const isExpoGo = Constants.appOwnership === 'expo';
    const isAttendanceDemo = isDemo || isExpoGo;
    const { submitAttendance, processQueue } = useAttendance(
        viewer?._id,
        deviceId || viewer?.deviceId,
        { demoMode: isAttendanceDemo }
    );
    
    // We need to find the physical roomId for the student's current homeroom
    const homeroom = useQuery(api.homerooms.list, activeSemester ? { semesterId: activeSemester._id } : "skip");
    const myHomeroom = homeroom?.find(hr => hr._id === viewer?.currentHomeroomId);

    const isNfcDemo = nfcMode !== 'real';

    useEffect(() => {
        let isMounted = true;

        const checkNfc = async () => {
            try {
                const module = await loadNfcManager();
                if (!module) {
                    if (isMounted) setNfcMode('demo');
                    return;
                }

                nfcRef.current = module;
                const supported = await module.default.isSupported();
                if (!supported) {
                    if (isMounted) setNfcMode('demo');
                    return;
                }
                const enabled = await module.default.isEnabled();
                if (isMounted) setNfcMode(enabled ? 'real' : 'demo');
            } catch (err) {
                console.warn('NFC Check Error:', err);
                if (isMounted) setNfcMode('demo');
            }
        };

        checkNfc();

        return () => {
            isMounted = false;
        };
    }, []);

    // Initialize Services
    useEffect(() => {
        processQueue(); // Sync pending items on mount
    }, [processQueue]);

    useEffect(() => {
        if (nfcMode !== 'real') return;

        const module = nfcRef.current;
        if (!module) return;

        module.default.start().catch(err => console.warn('NFC Start Error:', err));
        return () => {
            module.default.cancelTechnologyRequest().catch(() => {});
        };
    }, [nfcMode]);

    const handleAttendance = async () => {
        if (!viewer || !myHomeroom) {
            Alert.alert('Error', 'No homeroom assigned or semester not active.');
            return;
        }

        setStatus('authenticating');
        
        try {
            // 1. Trigger the hybrid attendance flow (Biometric + GPS + Online/Offline submission)
            const result = await submitAttendance(myHomeroom.roomId);
            
            if (result.success) {
                if (nfcMode === 'real') {
                    // 2. Also trigger NFC Broadcast for the Gatekeeper (Hardware path)
                    // This is redundant but ensures the physical door opens even if backend sync lags
                    const module = nfcRef.current;
                    if (!module) {
                        setStatus(result.mode === 'online' ? 'success' : 'offline_success');
                        return;
                    }

                    const { default: NfcManager, NfcTech, Ndef } = module;

                    await NfcManager.cancelTechnologyRequest().catch(() => {});
                    await NfcManager.requestTechnology(NfcTech.Ndef);
                    
                    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    const lat = location?.coords.latitude || 0;
                    const lng = location?.coords.longitude || 0;
                    const deviceId = viewer.deviceId || 'unknown';
                    
                    const payload = `ATTENDANCE|${viewer._id}|${Date.now()}|${lat}|${lng}|${deviceId}|${result.mode === 'online'}|ntp`;
                    const bytes = Ndef.encodeMessage([Ndef.textRecord(payload)]);
                    
                    if (bytes) {
                        await NfcManager.ndefHandler.writeNdefMessage(bytes);
                    }
                }

                const nextStatus = result.mode === 'offline' ? 'offline_success' : 'success';
                setStatus(nextStatus);
            } else {
                if (result.reason === 'biometric_failed') {
                    setStatus('waiting');
                } else {
                    setStatus('error');
                    setErrorMsg('Verification failed');
                }
            }

        } catch (ex) {
            console.warn('Attendance Error:', ex);
            setStatus('error');
            setErrorMsg('System error occurred');
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
                    {isNfcDemo && (
                        <View style={styles.demoBadge}>
                            <Caption style={styles.demoBadgeText}>NFC unavailable - demo mode</Caption>
                        </View>
                    )}
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

                    {status === 'offline_success' && (
                        <View style={styles.successState}>
                            <View style={[styles.successIcon, { backgroundColor: '#F59E0B' }]}>
                                <WifiOff size={32} color="#FFF" strokeWidth={2} />
                            </View>
                            <HeadingMd style={[styles.successTitle, { color: '#F59E0B' }]}>Stored Locally</HeadingMd>
                            <BodySm style={styles.successDesc}>
                                You're offline. Attendance saved and will sync automatically when you have internet.
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
                    {(status === 'success' || status === 'offline_success') && (
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
    demoBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: colors.cream,
        borderRadius: 999,
        marginBottom: spacing.md,
    },
    demoBadgeText: {
        color: colors.slate,
        fontSize: 12,
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
