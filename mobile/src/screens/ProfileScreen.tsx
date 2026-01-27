import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
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
} from '../components';
import { 
    ArrowLeft, 
    CreditCard, 
    CheckCircle, 
    ChevronRight, 
    Bell, 
    Shield, 
    CircleHelp 
} from 'lucide-react-native';

import { useAppData } from '../context/AppContext';

interface ProfileScreenProps {
    onBack: () => void;
    onLinkCard: () => void;
    onNotifications: () => void;
    onPrivacy: () => void;
    onHelp: () => void;
    onSignOut: () => void;
}

export const ProfileScreen = ({ 
    onBack, 
    onLinkCard, 
    onNotifications, 
    onPrivacy, 
    onHelp, 
    onSignOut,
}: ProfileScreenProps) => {
    const insets = useSafeAreaInsets();
    const { viewer } = useAppData();
    
    if (!viewer) return null;

    const name = viewer.name || 'User';
    const email = viewer.email || '';
    const initials = name.split(' ').map((n: string) => n[0]).join('');
    const roleLabel = (viewer.role || 'student').toUpperCase();
    const statusLabel = (viewer.status || 'active').toUpperCase();
    const cardLinked = !!viewer.cardUID;
    const cardLastDigits = viewer.cardUID ? viewer.cardUID.slice(-4) : '';

    return (
        <View style={styles.container}>
            <ResponsiveContainer>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[
                        styles.content,
                        { paddingTop: insets.top + spacing.lg }
                    ]}
                    alwaysBounceVertical={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Row */}
                    <View style={styles.header}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <ArrowLeft size={20} color={colors.slate} strokeWidth={2} />
                            </TouchableOpacity>
                            
                            <HeadingLg style={styles.headerTitle}>Profile</HeadingLg>
                            
                            {/* Spacer for centering */}
                            <View style={styles.headerSpacer} />
                        </View>
                    </View>

                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <View style={styles.avatar}>
                            <HeadingLg style={styles.avatarText}>
                                {initials}
                            </HeadingLg>
                        </View>
                        <HeadingLg style={styles.userName}>{name}</HeadingLg>
                        <BodySm style={styles.userEmail}>{email}</BodySm>
                        <View style={styles.badge}>
                            <Caption style={styles.badgeText}>{roleLabel} • {statusLabel}</Caption>
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
                                <CreditCard size={22} color={colors.cobalt} strokeWidth={2} />
                            </View>
                            <View style={styles.cardInfo}>
                                <Body style={styles.cardTitle}>
                                    {cardLinked ? 'NFC Card Linked' : 'Link Your Card'}
                                </Body>
                                {cardLinked ? (
                                    <View style={styles.cardStatus}>
                                        <CheckCircle size={16} color={colors.success} strokeWidth={2} />
                                        <Caption style={styles.cardStatusText}>
                                            •••• {cardLastDigits}
                                        </Caption>
                                    </View>
                                ) : (
                                    <Caption>Tap to scan your student card</Caption>
                                )}
                            </View>
                            <ChevronRight size={18} color={colors.slate} strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    {/* Settings Section */}
                    <View style={styles.section}>
                        <HeadingSm style={styles.sectionTitle}>Settings</HeadingSm>

                        <View style={styles.settingsList}>
                            <TouchableOpacity 
                                style={styles.settingRow} 
                                activeOpacity={0.7}
                                onPress={onNotifications}
                            >
                                <Bell size={20} color={colors.slate} strokeWidth={2} />
                                <Body style={styles.settingText}>Notifications</Body>
                                <ChevronRight size={18} color={colors.slate} strokeWidth={2} />
                            </TouchableOpacity>

                            <View style={styles.settingDivider} />

                            <TouchableOpacity 
                                style={styles.settingRow} 
                                activeOpacity={0.7}
                                onPress={onPrivacy}
                            >
                                <Shield size={20} color={colors.slate} strokeWidth={2} />
                                <Body style={styles.settingText}>Privacy & Security</Body>
                                <ChevronRight size={18} color={colors.slate} strokeWidth={2} />
                            </TouchableOpacity>

                            <View style={styles.settingDivider} />

                            <TouchableOpacity 
                                style={styles.settingRow} 
                                activeOpacity={0.7}
                                onPress={onHelp}
                            >
                                <CircleHelp size={20} color={colors.slate} strokeWidth={2} />
                                <Body style={styles.settingText}>Help & Support</Body>
                                <ChevronRight size={18} color={colors.slate} strokeWidth={2} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={onSignOut}>
                        <Body style={styles.logoutText}>Sign Out</Body>
                    </TouchableOpacity>

                    {/* Version */}
                    <Caption style={styles.version}>Version 1.0.0</Caption>
                </ScrollView>
            </ResponsiveContainer>
        </View>
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
        paddingBottom: 96,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: 68,
        height: 44,
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
        width: 68,
        height: 44,
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
        ...Platform.select({
            web: {
                boxShadow: `0 4px 12px ${colors.cobaltAlpha20}`,
            },
            default: {
                shadowColor: colors.cobalt,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 6,
            },
        }),
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
