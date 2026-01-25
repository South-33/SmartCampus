import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../theme';
import {
    HeadingLg,
    HeadingMd,
    HeadingSm,
    Body,
    BodySm,
    Caption,
    ResponsiveContainer,
    Button,
} from '../components';
import Svg, { Path, Circle } from 'react-native-svg';

interface AdminSecurityScreenProps {
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ShieldAlertIcon = () => (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth={2}>
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const AdminSecurityScreen = ({ onBack }: AdminSecurityScreenProps) => {
    const insets = useSafeAreaInsets();
    const [activeMode, setActiveMode] = React.useState<string | null>(null);

    const handleOverride = (title: string) => {
        if (activeMode === title) {
            Alert.alert(
                "Reset Security",
                `Are you sure you want to deactivate ${title}?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Deactivate", onPress: () => setActiveMode(null) }
                ]
            );
            return;
        }

        Alert.alert(
            "Security Override",
            `Are you sure you want to trigger ${title}? This will affect all connected hardware nodes immediately.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Confirm", 
                    style: "destructive", 
                    onPress: () => {
                        setActiveMode(title);
                        console.log(`${title} triggered`);
                    } 
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ResponsiveContainer>
                <View style={[
                    styles.content,
                    { paddingTop: Math.max(insets.top, 20) + spacing.md }
                ]}>
                    {/* Header Row */}
                    <View style={styles.header}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity style={styles.backButton} onPress={onBack}>
                                <BackIcon />
                                <BodySm>Back</BodySm>
                            </TouchableOpacity>
                            
                            <HeadingMd style={styles.headerTitle}>Security Hub</HeadingMd>
                            
                            {/* Spacer for centering */}
                            <View style={styles.headerSpacer} />
                        </View>
                    </View>

                    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.heroCard}>
                            <View style={styles.heroIcon}>
                                <ShieldAlertIcon />
                            </View>
                            <HeadingMd style={styles.heroTitle}>Emergency Overrides</HeadingMd>
                            <BodySm style={styles.heroSubtitle}>
                                Global controls for critical campus safety events. Actions are logged and notified to all staff.
                            </BodySm>
                        </View>

                        <HeadingSm style={styles.sectionTitle}>SYSTEM-WIDE ACTIONS</HeadingSm>
                        
                        <TouchableOpacity 
                            style={[
                                styles.overrideCard, 
                                styles.lockdownCard,
                                activeMode === "Global Lockdown" && styles.activeOverrideCard
                            ]} 
                            activeOpacity={0.9}
                            onPress={() => handleOverride("Global Lockdown")}
                        >
                            <View style={styles.overrideInfo}>
                                <View style={styles.titleRow}>
                                    <Body style={styles.overrideTitle}>Global Lockdown</Body>
                                    {activeMode === "Global Lockdown" && (
                                        <View style={styles.activeBadge}>
                                            <Caption style={styles.activeBadgeText}>ACTIVE</Caption>
                                        </View>
                                    )}
                                </View>
                                <Caption style={styles.overrideDesc}>Forces all door locks to stay CLOSED. Disables all NFC and Phone access.</Caption>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[
                                styles.overrideCard, 
                                styles.fireDrillCard,
                                activeMode === "Fire Safety Mode" && styles.activeOverrideCard
                            ]} 
                            activeOpacity={0.9}
                            onPress={() => handleOverride("Fire Safety Mode")}
                        >
                            <View style={styles.overrideInfo}>
                                <View style={styles.titleRow}>
                                    <Body style={styles.overrideTitle}>Fire Safety Mode</Body>
                                    {activeMode === "Fire Safety Mode" && (
                                        <View style={[styles.activeBadge, { backgroundColor: colors.success }]}>
                                            <Caption style={styles.activeBadgeText}>ACTIVE</Caption>
                                        </View>
                                    )}
                                </View>
                                <Caption style={styles.overrideDesc}>Unlocks all doors immediately and forces power relays to stay ON.</Caption>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.overrideCard} 
                            activeOpacity={0.9}
                            onPress={() => handleOverride("Maintenance Mode")}
                        >
                            <View style={styles.overrideInfo}>
                                <Body style={styles.overrideTitle}>Maintenance Mode</Body>
                                <Caption style={styles.overrideDesc}>Keeps system operational but ignores all attendance logging.</Caption>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Caption style={styles.footerText}>
                                Note: All security overrides require a physical key turn or secondary admin confirmation on the hardware nodes to reset.
                            </Caption>
                        </View>
                    </ScrollView>
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
        paddingTop: spacing.xl,
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
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 80, // Same as backButton width
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
    },
    heroCard: {
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.mist,
        ...shadows.subtle,
    },
    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.errorBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    heroTitle: {
        textAlign: 'center',
        marginBottom: 8,
    },
    heroSubtitle: {
        textAlign: 'center',
        color: colors.slate,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    overrideCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.subtle,
    },
    lockdownCard: {
        ...Platform.select({
            web: {
                boxShadow: '0 6px 15px rgba(198, 40, 40, 0.15)',
            },
            default: {
                shadowColor: colors.error,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 15,
                elevation: 10,
            },
        }),
        borderColor: '#FFEBEB',
    },
    fireDrillCard: {
        ...Platform.select({
            web: {
                boxShadow: '0 6px 15px rgba(46, 125, 50, 0.15)',
            },
            default: {
                shadowColor: colors.success,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 15,
                elevation: 10,
            },
        }),
        borderColor: '#F0FDF4',
    },
    activeOverrideCard: {
        borderColor: colors.cobalt,
        borderWidth: 2,
        ...Platform.select({
            web: {
                boxShadow: `0 8px 20px ${colors.cobaltAlpha20}`,
            },
            default: {
                shadowColor: colors.cobalt,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 12,
            },
        }),
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    activeBadge: {
        backgroundColor: colors.error,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
    },
    overrideInfo: {
        flex: 1,
    },
    overrideTitle: {
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    overrideDesc: {
        color: colors.slate,
    },
    footer: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    footerText: {
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
