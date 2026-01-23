import React from 'react';
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
    HeadingMd,
    HeadingSm,
    Body,
    BodySm,
    Caption,
    Button,
} from '../components';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface ProfileScreenProps {
    onBack: () => void;
    onLinkCard: () => void;
}

// Icons
const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CardIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Rect x="2" y="5" rx="2" width="20" height="14" />
        <Path d="M2 10h20" />
        <Path d="M6 15h4" strokeLinecap="round" />
    </Svg>
);

const CheckCircleIcon = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth={2}>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ChevronRightIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const BellIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
    </Svg>
);

const ShieldIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const HelpIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="12" cy="17" r="0.5" fill={colors.slate} />
    </Svg>
);

const LogoutIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth={2}>
        <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// Sample user data
const userData = {
    name: 'Jonathan Doe',
    email: 'jonathan.doe@university.edu',
    studentId: 'STU-2024-0847',
    department: 'Computer Science',
    year: '3rd Year',
    cardLinked: true,
    cardLastDigits: '7D00',
};

export const ProfileScreen = ({ onBack, onLinkCard }: ProfileScreenProps) => {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                alwaysBounceVertical={false}
            >
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <BackIcon />
                    <BodySm>Back</BodySm>
                </TouchableOpacity>

                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <HeadingLg style={styles.avatarText}>
                            {userData.name.split(' ').map(n => n[0]).join('')}
                        </HeadingLg>
                    </View>
                    <HeadingLg style={styles.userName}>{userData.name}</HeadingLg>
                    <BodySm style={styles.userEmail}>{userData.email}</BodySm>
                    <View style={styles.badge}>
                        <Caption style={styles.badgeText}>{userData.studentId}</Caption>
                    </View>
                </View>

                {/* Student Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <BodySm style={styles.infoLabel}>Department</BodySm>
                        <Body style={styles.infoValue}>{userData.department}</Body>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <BodySm style={styles.infoLabel}>Academic Year</BodySm>
                        <Body style={styles.infoValue}>{userData.year}</Body>
                    </View>
                </View>

                {/* NFC Card Section */}
                <View style={styles.section}>
                    <HeadingSm style={styles.sectionTitle}>Access Card</HeadingSm>

                    <TouchableOpacity
                        style={styles.cardRow}
                        onPress={onLinkCard}
                        activeOpacity={0.7}
                    >
                        <View style={styles.cardIconContainer}>
                            <CardIcon />
                        </View>
                        <View style={styles.cardInfo}>
                            <Body style={styles.cardTitle}>
                                {userData.cardLinked ? 'NFC Card Linked' : 'Link Your Card'}
                            </Body>
                            {userData.cardLinked ? (
                                <View style={styles.cardStatus}>
                                    <CheckCircleIcon />
                                    <Caption style={styles.cardStatusText}>
                                        •••• {userData.cardLastDigits}
                                    </Caption>
                                </View>
                            ) : (
                                <Caption>Tap to scan your student card</Caption>
                            )}
                        </View>
                        <ChevronRightIcon />
                    </TouchableOpacity>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <HeadingSm style={styles.sectionTitle}>Settings</HeadingSm>

                    <View style={styles.settingsList}>
                        <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                            <BellIcon />
                            <Body style={styles.settingText}>Notifications</Body>
                            <ChevronRightIcon />
                        </TouchableOpacity>

                        <View style={styles.settingDivider} />

                        <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                            <ShieldIcon />
                            <Body style={styles.settingText}>Privacy & Security</Body>
                            <ChevronRightIcon />
                        </TouchableOpacity>

                        <View style={styles.settingDivider} />

                        <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                            <HelpIcon />
                            <Body style={styles.settingText}>Help & Support</Body>
                            <ChevronRightIcon />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7}>
                    <Body style={styles.logoutText}>Sign Out</Body>
                </TouchableOpacity>

                {/* Version */}
                <Caption style={styles.version}>Version 1.0.0</Caption>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ivory,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: 0,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.lg,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.cobalt,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        // Glow
        shadowColor: colors.cobalt,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 32,
    },
    userName: {
        marginBottom: 4,
    },
    userEmail: {
        color: colors.slate,
        marginBottom: spacing.sm,
    },
    badge: {
        backgroundColor: colors.cream,
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
        borderRadius: 100,
    },
    badgeText: {
        color: colors.cobalt,
        fontFamily: 'Inter-SemiBold',
        letterSpacing: 0.5,
    },
    infoCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.xl,
        ...shadows.subtle,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    infoLabel: {
        color: colors.slate,
    },
    infoValue: {
        fontFamily: 'Inter-Medium',
    },
    divider: {
        height: 1,
        backgroundColor: colors.mist,
        marginVertical: spacing.sm,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.md,
        ...shadows.subtle,
    },
    cardIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontFamily: 'Inter-Medium',
        marginBottom: 2,
    },
    cardStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardStatusText: {
        color: colors.success,
        fontFamily: 'Inter-Medium',
    },
    settingsList: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        ...shadows.subtle,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    settingText: {
        flex: 1,
    },
    settingDivider: {
        height: 1,
        backgroundColor: colors.mist,
        marginLeft: 52,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
    },
    logoutText: {
        color: colors.error,
        fontFamily: 'Inter-Medium',
    },
    version: {
        textAlign: 'center',
        color: colors.slate,
        paddingVertical: spacing.lg,
    },
});
