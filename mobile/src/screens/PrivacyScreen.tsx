import React, { useState } from 'react';
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
    Toggle,
} from '../components';
import Svg, { Path } from 'react-native-svg';

interface PrivacyScreenProps {
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const PrivacyScreen = ({ onBack }: PrivacyScreenProps) => {
    const insets = useSafeAreaInsets();
    const [settings, setSettings] = useState({
        faceId: true,
        location: true,
        anonymous: false,
    });

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

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
                            
                            <HeadingLg style={styles.headerTitle}>Privacy & Security</HeadingLg>
                            
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
                            <HeadingSm style={styles.sectionTitle}>Authentication</HeadingSm>
                            <View style={styles.settingCard}>
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Body style={styles.settingLabel}>Use Face ID</Body>
                                        <Caption>Requirement for attendance scans</Caption>
                                    </View>
                                    <Toggle
                                        value={settings.faceId}
                                        onValueChange={() => toggle('faceId')}
                                    />
                                </View>
                                <View style={styles.divider} />
                                <TouchableOpacity style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Body style={styles.settingLabel}>Change Password</Body>
                                        <Caption>Last changed 3 months ago</Caption>
                                    </View>
                                    <Path d="M9 18l6-6-6-6" stroke={colors.slate} strokeWidth={2} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <HeadingSm style={styles.sectionTitle}>Data & Privacy</HeadingSm>
                            <View style={styles.settingCard}>
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Body style={styles.settingLabel}>Location Services</Body>
                                        <Caption>Used to verify campus presence</Caption>
                                    </View>
                                    <Toggle
                                        value={settings.location}
                                        onValueChange={() => toggle('location')}
                                    />
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Body style={styles.settingLabel}>Anonymous Analytics</Body>
                                        <Caption>Help us improve the app experience</Caption>
                                    </View>
                                    <Toggle
                                        value={settings.anonymous}
                                        onValueChange={() => toggle('anonymous')}
                                    />
                                </View>
                            </View>
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
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: 68, // Fixed width for balancing
        height: 44,
    },
    header: {
        marginBottom: spacing.lg,
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
        width: 68, // Same as backButton width
        height: 44,
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
});
