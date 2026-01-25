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
    Body,
    BodySm,
    Caption,
    ResponsiveContainer,
} from '../components';
import Svg, { Path, Circle } from 'react-native-svg';
import { mockUsers, AdminUser } from '../data/adminMockData';

interface AdminUserListScreenProps {
    onBack: () => void;
    onViewUser: (userId: string) => void;
}

const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const SearchIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Circle cx="11" cy="11" r="8" />
        <Path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const AdminUserListScreen = ({ onBack, onViewUser }: AdminUserListScreenProps) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'all' | 'student' | 'teacher'>('all');

    const filteredUsers = mockUsers.filter(user => {
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
                            
                            <TouchableOpacity style={styles.searchButton}>
                                <SearchIcon />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                            onPress={() => setActiveTab('all')}
                        >
                            <BodySm style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</BodySm>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'student' && styles.activeTab]}
                            onPress={() => setActiveTab('student')}
                        >
                            <BodySm style={[styles.tabText, activeTab === 'student' && styles.activeTabText]}>Students</BodySm>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'teacher' && styles.activeTab]}
                            onPress={() => setActiveTab('teacher')}
                        >
                            <BodySm style={[styles.tabText, activeTab === 'teacher' && styles.activeTabText]}>Teachers</BodySm>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={{ paddingBottom: spacing.xl }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.userList}>
                            {filteredUsers.map((user) => (
                                <TouchableOpacity 
                                    key={user.id} 
                                    style={styles.userRow} 
                                    activeOpacity={0.7}
                                    onPress={() => onViewUser(user.id)}
                                >
                                    <View style={styles.avatar}>
                                        <HeadingSm style={styles.avatarText}>
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </HeadingSm>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Body style={styles.userName}>{user.name}</Body>
                                        <Caption style={styles.userRole}>{user.role.toUpperCase()} • {user.id}</Caption>
                                    </View>
                                    <View style={styles.userStatus}>
                                        <Caption>Active</Caption>
                                        <BodySm>{user.lastActive}</BodySm>
                                    </View>
                                </TouchableOpacity>
                            ))}
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
    searchButton: {
        width: 80, // Same as backButton width for balancing
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
});
