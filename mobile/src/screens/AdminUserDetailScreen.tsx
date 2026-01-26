import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../theme';
import {
    HeadingMd,
    HeadingSm,
    Body,
    BodySm,
    Caption,
    ResponsiveContainer,
    Button,
    LoadingView,
} from '../components';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAppData } from '../context/AppContext';

interface AdminUserDetailScreenProps {
    userId: string;
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CardIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Rect x="2" y="5" width="20" height="14" rx="2" />
        <Path d="M2 10h20" />
    </Svg>
);

const FingerprintIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M12 11c0 3.517-2.167 6.524-5.222 7.75M12 11c0-3.517 2.167-6.524 5.222-7.75M12 11c0 3.517 2.167 6.524 5.222 7.75M12 11c0-3.517-2.167-6.524-5.222-7.75" />
        <Path d="M7 21a10 10 0 0 1 10-10" />
        <Path d="M12 21a10 10 0 0 1 10-10" />
    </Svg>
);

export const AdminUserDetailScreen = ({ userId, onBack }: AdminUserDetailScreenProps) => {
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useConvexAuth();
    const { rooms: allRooms } = useAppData();
    
    // Fetch live user data
    const realUser = useQuery(api.users.get, isAuthenticated ? { id: userId as any } : 'skip' as any);
    const deleteUser = useMutation(api.users.remove);
    
    const user = realUser;

    const [isActive, setIsActive] = useState(true);

    if (isAuthenticated && realUser === undefined) {
        return <LoadingView />;
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <View style={[styles.content, { paddingTop: insets.top + spacing.xl, alignItems: 'center' }]}>
                    <Body style={{ textAlign: 'center', marginBottom: spacing.lg }}>User not found</Body>
                    <Button onPress={onBack}>Go Back</Button>
                </View>
            </View>
        );
    }
    
    const handleResetUID = () => {
        Alert.alert("Link Card", "Place the new NFC card near an Admin Gatekeeper to sync.");
    };

    const handleDelete = () => {
        if (!isAuthenticated) {
            return;
        }

        const confirmMessage = `Are you sure you want to permanently remove ${user?.name || 'this user'}? This action cannot be undone.`;

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Delete User\n\n${confirmMessage}`);
            if (confirmed) {
                performDelete();
            }
            return;
        }

        Alert.alert(
            "Delete User",
            confirmMessage,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: performDelete
                }
            ]
        );
    };

    const performDelete = async () => {
        try {
            await deleteUser({ id: userId as any });
            onBack();
        } catch (error: any) {
            const errorMsg = error.message || "Failed to delete user";
            if (Platform.OS === 'web') {
                window.alert("Error: " + errorMsg);
            } else {
                Alert.alert("Error", errorMsg);
            }
        }
    };

    const userName = user.name || user.email || 'Unnamed User';
    const userRoleText = (user.role || 'unknown').toUpperCase();

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
                            
                            <HeadingMd style={styles.headerTitle}>User Profile</HeadingMd>
                            
                            <View style={styles.headerSpacer} />
                        </View>
                    </View>

                    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
                        <View style={styles.heroCard}>
                            <View style={styles.avatar}>
                                <HeadingMd style={styles.avatarText}>
                                    {userName.split(' ').map((n: string) => n[0]).join('')}
                                </HeadingMd>
                            </View>
                            <HeadingMd style={styles.userName}>{userName}</HeadingMd>
                            <Caption style={styles.userRole}>{userRoleText}</Caption>
                            
                            <View style={styles.statusToggle}>
                                <BodySm>Account Active</BodySm>
                                <Switch 
                                    value={isActive} 
                                    onValueChange={setIsActive}
                                    trackColor={{ false: colors.mist, true: colors.cobalt }}
                                />
                            </View>
                        </View>

                        <HeadingSm style={styles.sectionTitle}>CREDENTIALS</HeadingSm>
                        <View style={styles.card}>
                            <View style={styles.credentialRow}>
                                <View style={styles.credentialIcon}>
                                    <CardIcon />
                                </View>
                                <View style={styles.credentialInfo}>
                                    <Body>NFC Card UID</Body>
                                    <Caption>{user.cardUID || 'Not linked'}</Caption>
                                </View>
                                <TouchableOpacity onPress={handleResetUID}>
                                    <BodySm style={styles.actionText}>RE-LINK</BodySm>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={[styles.credentialRow, { borderBottomWidth: 0 }]}>
                                <View style={styles.credentialIcon}>
                                    <FingerprintIcon />
                                </View>
                                <View style={styles.credentialInfo}>
                                    <Body>Biometrics</Body>
                                    <Caption>Fingerprint Template #42</Caption>
                                </View>
                                <TouchableOpacity>
                                    <BodySm style={styles.actionText}>RE-SCAN</BodySm>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <HeadingSm style={styles.sectionTitle}>ROOM ACCESS</HeadingSm>
                        <View style={styles.card}>
                            {(allRooms || []).map((room, idx) => {
                                const allowedRooms = user.allowedRooms || [];
                                const hasAccess = allowedRooms.includes(room._id);
                                return (
                                    <View key={room._id} style={[
                                        styles.roomRow, 
                                        idx === (allRooms?.length || 0) - 1 && { borderBottomWidth: 0 }
                                    ]}>
                                        <View style={styles.roomInfo}>
                                            <Body>{room.name}</Body>
                                            <Caption>{room._id.toUpperCase()}</Caption>
                                        </View>
                                        <Switch 
                                            value={hasAccess}
                                            trackColor={{ false: colors.mist, true: colors.cobalt }}
                                        />
                                    </View>
                                );
                            })}
                        </View>

                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                            <BodySm style={styles.deleteText}>REMOVE USER FROM SYSTEM</BodySm>
                        </TouchableOpacity>
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
        width: 80,
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
        width: 80,
    },
    scroll: {
        flex: 1,
    },
    heroCard: {
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.mist,
        ...shadows.subtle,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    avatarText: {
        color: colors.cobalt,
        fontSize: 24,
    },
    userName: {
        marginBottom: 4,
    },
    userRole: {
        marginBottom: spacing.md,
    },
    statusToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.mist,
        width: '100%',
        justifyContent: 'center',
    },
    sectionTitle: {
        marginBottom: spacing.sm,
        fontSize: 12,
        letterSpacing: 1,
        color: colors.slate,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.mist,
        marginBottom: spacing.xl,
        overflow: 'hidden',
        ...shadows.subtle,
    },
    credentialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    credentialIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    credentialInfo: {
        flex: 1,
    },
    actionText: {
        color: colors.cobalt,
        fontFamily: 'Inter-SemiBold',
    },
    roomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    roomInfo: {
        flex: 1,
    },
    deleteButton: {
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    deleteText: {
        color: colors.error,
        fontFamily: 'Inter-SemiBold',
        letterSpacing: 0.5,
    },
});
