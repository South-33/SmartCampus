import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
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
    LoadingView,
    Button,
    Input,
} from '../components';
import Svg, { Path } from 'react-native-svg';
import { useAction, useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { mockUsers } from '../data/adminMockData';
import { useAppData } from '../context/AppContext';

interface AdminUserListScreenProps {
    onBack: () => void;
    onViewUser: (userId: string) => void;
}

const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PlusIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.cobalt} strokeWidth={2}>
        <Path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const AdminUserListScreen = ({ onBack, onViewUser }: AdminUserListScreenProps) => {
    const { allUsers, isAdminDataLoaded } = useAppData();
    const globalLoading = !isAdminDataLoaded;

    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useConvexAuth();
    const [activeTab, setActiveTab] = useState<'all' | 'student' | 'teacher' | 'admin' | 'staff'>('all');
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'student' | 'teacher' | 'admin' | 'staff'>('student');
    const [isCreating, setIsCreating] = useState(false);

    const createUser = useAction(api.users.create);

    // Use real users if authenticated, otherwise use mock users for demo
    const users = isAuthenticated ? (allUsers || []) : (mockUsers as any[]);
    const isLoading = isAuthenticated && globalLoading;

    const handleCreateUser = async () => {
        if (!newUserName || !newUserEmail || !newUserPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // Simple email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newUserEmail)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (newUserPassword.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return;
        }

        setIsCreating(true);
        try {
            await createUser({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                role: newUserRole,
            });
            setIsAddModalVisible(false);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            Alert.alert('Success', 'User created successfully');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'Failed to create user');
        } finally {
            setIsCreating(false);
        }
    };

    const filteredUsers = users.filter(user => {
        if (activeTab === 'all') return true;
        return user.role === activeTab;
    });

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
                            
                            <HeadingMd style={styles.headerTitle}>Users</HeadingMd>
                            
                            <TouchableOpacity 
                                style={styles.searchButton}
                                onPress={() => setIsAddModalVisible(true)}
                            >
                                <PlusIcon />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        {(['all', 'student', 'teacher', 'admin', 'staff'] as const).map((tab) => (
                            <TouchableOpacity 
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <BodySm style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </BodySm>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={{ paddingBottom: spacing.xl }}
                        showsVerticalScrollIndicator={false}
                    >
                        {isLoading ? (
                            <View style={styles.inlineLoading}>
                                <ActivityIndicator color={colors.cobalt} />
                                <Caption style={{ marginTop: spacing.sm }}>Loading users...</Caption>
                            </View>
                        ) : (
                            <View style={styles.userList}>
                                {filteredUsers.map((user) => (
                                    <TouchableOpacity 
                                        key={user._id || user.id} 
                                        style={styles.userRow} 
                                        activeOpacity={0.7}
                                        onPress={() => onViewUser(user._id || user.id)}
                                    >
                                    <View style={styles.avatar}>
                                        <HeadingSm style={styles.avatarText}>
                                            {((user as any).name || 'U').split(' ').map((n: string) => n[0]).join('')}
                                        </HeadingSm>
                                    </View>

                                        <View style={styles.userInfo}>
                                            <Body style={styles.userName}>{user.name || user.email || 'Unnamed'}</Body>
                                            <Caption style={styles.userRole}>{(user.role || 'unknown').toUpperCase()}</Caption>
                                        </View>
                                        <View style={styles.userStatus}>
                                            <Caption>Active</Caption>
                                            <BodySm>Just now</BodySm>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <View style={styles.emptyState}>
                                        <Caption>No users found in this category.</Caption>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </ResponsiveContainer>

            {/* Add User Modal */}
            <Modal
                visible={isAddModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <HeadingMd>Add New User</HeadingMd>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                                <Caption style={{ color: colors.cobalt }}>Cancel</Caption>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <Input
                                label="Full Name"
                                placeholder="John Doe"
                                value={newUserName}
                                onChangeText={setNewUserName}
                            />
                            <Input
                                label="Email Address"
                                placeholder="john@kingsford.edu"
                                value={newUserEmail}
                                onChangeText={setNewUserEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Input
                                label="Password"
                                placeholder="••••••••"
                                value={newUserPassword}
                                onChangeText={setNewUserPassword}
                                secureTextEntry
                            />

                            <View style={styles.roleSelector}>
                                <Caption style={styles.roleLabel}>User Role</Caption>
                                <View style={styles.roleButtons}>
                                    {(['student', 'teacher', 'admin', 'staff'] as const).map((role) => (
                                        <TouchableOpacity
                                            key={role}
                                            style={[styles.roleButton, newUserRole === role && styles.activeRoleButton]}
                                            onPress={() => setNewUserRole(role)}
                                        >
                                            <Caption style={[styles.roleButtonText, newUserRole === role && styles.activeRoleButtonText]}>
                                                {role.toUpperCase()}
                                            </Caption>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Button 
                                onPress={handleCreateUser} 
                                loading={isCreating}
                                disabled={!newUserName || !newUserEmail || !newUserPassword}
                            >
                                Create Account
                            </Button>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
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
    searchButton: {
        width: 80,
        height: 40,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    tab: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: colors.mist,
    },
    activeTab: {
        backgroundColor: colors.cobalt,
    },
    tabText: {
        color: colors.slate,
    },
    activeTabText: {
        color: '#FFF',
        fontFamily: 'Inter-SemiBold',
    },
    scroll: {
        flex: 1,
    },
    userList: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        overflow: 'hidden',
        ...shadows.subtle,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.cobalt,
        marginBottom: 0,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontFamily: 'Inter-SemiBold',
    },
    userRole: {
        marginTop: 2,
    },
    userStatus: {
        alignItems: 'flex-end',
    },
    inlineLoading: {
        paddingVertical: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.ivory,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: Math.max(spacing.xl, 40),
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalForm: {
        marginBottom: spacing.md,
    },
    roleSelector: {
        marginTop: spacing.sm,
    },
    roleLabel: {
        marginBottom: spacing.xs,
        fontFamily: 'Inter-SemiBold',
    },
    roleButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    roleButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.mist,
        backgroundColor: '#FFF',
    },
    activeRoleButton: {
        backgroundColor: colors.cobalt,
        borderColor: colors.cobalt,
    },
    roleButtonText: {
        color: colors.slate,
        fontFamily: 'Inter-Medium',
        fontSize: 10,
    },
    activeRoleButtonText: {
        color: '#FFF',
    },
    modalFooter: {
        marginTop: spacing.xl,
    },
});
