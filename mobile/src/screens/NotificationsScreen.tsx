import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { colors, spacing, radius, shadows } from '../theme';
import {
    HeadingLg,
    Body,
    BodySm,
    Caption,
    Toggle,
} from '../components';
import Svg, { Path } from 'react-native-svg';

interface NotificationsScreenProps {
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const NotificationsScreen = ({ onBack }: NotificationsScreenProps) => {
    const [settings, setSettings] = useState({
        attendance: true,
        security: true,
        university: false,
        reminders: true,
    });

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <BackIcon />
                    <BodySm>Back</BodySm>
                </TouchableOpacity>

                <HeadingLg style={styles.title}>Notifications</HeadingLg>

                <ScrollView style={styles.scroll} alwaysBounceVertical={false}>
                    <View style={styles.section}>
                        <View style={styles.settingCard}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Body style={styles.settingLabel}>Attendance Alerts</Body>
                                    <Caption>Confirmations when you check in</Caption>
                                </View>
                                <Toggle
                                    value={settings.attendance}
                                    onValueChange={() => toggle('attendance')}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Body style={styles.settingLabel}>Security Alerts</Body>
                                    <Caption>Notify on new device logins</Caption>
                                </View>
                                <Toggle
                                    value={settings.security}
                                    onValueChange={() => toggle('security')}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Body style={styles.settingLabel}>University News</Body>
                                    <Caption>Campus updates and events</Caption>
                                </View>
                                <Toggle
                                    value={settings.university}
                                    onValueChange={() => toggle('university')}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Body style={styles.settingLabel}>Class Reminders</Body>
                                    <Caption>15 mins before lecture starts</Caption>
                                </View>
                                <Toggle
                                    value={settings.reminders}
                                    onValueChange={() => toggle('reminders')}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
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
    title: {
        marginBottom: spacing.xl,
    },
    scroll: {
        flex: 1,
    },
    section: {
        marginBottom: spacing.xl,
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
