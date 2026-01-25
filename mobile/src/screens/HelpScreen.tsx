import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../theme';
import {
    HeadingLg,
    HeadingMd,
    HeadingSm,
    ResponsiveContainer,
    Body,
    BodySm,
    Caption,
} from '../components';
import Svg, { Path, Circle } from 'react-native-svg';

interface HelpScreenProps {
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ChevronRightIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const HelpScreen = ({ onBack }: HelpScreenProps) => {
    const insets = useSafeAreaInsets();
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
                            
                            <HeadingMd style={styles.headerTitle}>Help & Support</HeadingMd>
                            
                            {/* Spacer for centering */}
                            <View style={styles.headerSpacer} />
                        </View>
                    </View>

                    <ScrollView 
                        style={styles.scroll} 
                        contentContainerStyle={styles.scrollContent}
                        alwaysBounceVertical={false}
                    >
                        <View style={styles.section}>
                            <HeadingSm style={styles.sectionTitle}>Resources</HeadingSm>
                            <View style={styles.settingCard}>
                                <TouchableOpacity style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Body style={styles.settingLabel}>App Tutorial</Body>
                                        <Caption>Learn how to use NFC features</Caption>
                                    </View>
                                    <ChevronRightIcon />
                                </TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Body style={styles.settingLabel}>Frequently Asked Questions</Body>
                                        <Caption>Common issues and solutions</Caption>
                                    </View>
                                    <ChevronRightIcon />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <HeadingSm style={styles.sectionTitle}>Contact Support</HeadingSm>
                            <View style={styles.settingCard}>
                                <TouchableOpacity style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Body style={styles.settingLabel}>IT Help Desk</Body>
                                        <Caption>Mon–Fri, 08:00 – 18:00</Caption>
                                    </View>
                                    <ChevronRightIcon />
                                </TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Body style={styles.settingLabel}>Report a Technical Issue</Body>
                                        <Caption>Submit a bug report to developers</Caption>
                                    </View>
                                    <ChevronRightIcon />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.emergencyCard}>
                            <HeadingSm style={styles.emergencyTitle}>Campus Security</HeadingSm>
                            <BodySm style={styles.emergencyText}>If you are in immediate danger or have a security emergency on campus, call the 24/7 hotline.</BodySm>
                            <TouchableOpacity style={styles.emergencyButton}>
                                <Body style={styles.emergencyButtonText}>Call Security Hotline</Body>
                            </TouchableOpacity>
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
        paddingBottom: 72,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    settingCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        ...shadows.subtle,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    settingInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    settingLabel: {
        fontFamily: 'Inter-Medium',
        marginBottom: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.mist,
        marginLeft: spacing.md,
    },
    emergencyCard: {
        backgroundColor: colors.errorBg,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: 'rgba(198, 40, 40, 0.1)',
        marginBottom: spacing.xl,
    },
    emergencyTitle: {
        color: colors.error,
        marginBottom: 8,
    },
    emergencyText: {
        color: colors.error,
        marginBottom: spacing.md,
        lineHeight: 18,
    },
    emergencyButton: {
        backgroundColor: colors.error,
        paddingVertical: 12,
        borderRadius: radius.sm,
        alignItems: 'center',
    },
    emergencyButtonText: {
        color: '#FFF',
        fontFamily: 'Inter-SemiBold',
    },
});
