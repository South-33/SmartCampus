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
    LoadingView,
} from '../components';
import Svg, { Path } from 'react-native-svg';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface StaffTasksScreenProps {
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CheckCircleIcon = ({ completed }: { completed: boolean }) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={completed ? colors.success : colors.slate} strokeWidth={2}>
        <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const StaffTasksScreen = ({ onBack }: StaffTasksScreenProps) => {
    const insets = useSafeAreaInsets();
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    const tasks = useQuery(api.staffTasks.list);
    const updateTaskStatus = useMutation(api.staffTasks.updateStatus);

    if (tasks === undefined) {
        return <LoadingView />;
    }

    const filteredTasks = (tasks || []).filter(task => {
        if (filter === 'all') return true;
        if (filter === 'pending') return task.status !== 'completed';
        return task.status === 'completed';
    });

    const handleToggleStatus = async (taskId: any, currentStatus: string) => {
        const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
            await updateTaskStatus({ taskId, status: nextStatus as any });
        } catch (e) {
            console.error(e);
        }
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
                            
                            <HeadingLg style={styles.headerTitle}>Work Orders</HeadingLg>
                            
                            {/* Spacer for centering */}
                            <View style={styles.headerSpacer} />
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tabScrollContent}
                        >
                            {(['all', 'pending', 'completed'] as const).map((f) => (
                                <TouchableOpacity 
                                    key={f}
                                    style={[styles.tab, filter === f && styles.activeTab]}
                                    onPress={() => setFilter(f)}
                                >
                                    <BodySm style={[styles.tabText, filter === f && styles.activeTabText]}>
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </BodySm>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={{ paddingBottom: spacing.xl }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.taskList}>
                            {filteredTasks.map((task) => (
                                <View key={task._id} style={styles.taskItem}>
                                    <View style={styles.taskContent}>
                                        <View style={styles.taskMain}>
                                            <View>
                                                <Body style={styles.roomName}>{task.roomName}</Body>
                                                {task.homeroomName && (
                                                    <Caption style={{ color: colors.cobalt }}>{task.homeroomName}</Caption>
                                                )}
                                            </View>
                                            <View style={[styles.typeBadge, { backgroundColor: colors.cream }]}>
                                                <Caption style={{ color: colors.cobalt }}>{task.type.toUpperCase()}</Caption>
                                            </View>
                                        </View>
                                        <BodySm style={styles.desc}>{task.description}</BodySm>
                                        <View style={styles.meta}>
                                            <Caption style={[
                                                styles.priority,
                                                task.priority === 'high' && { color: colors.error }
                                            ]}>
                                                {task.priority.toUpperCase()} PRIORITY
                                            </Caption>
                                            <Caption>•</Caption>
                                            <Caption>{task.status.replace('_', ' ').toUpperCase()}</Caption>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.checkAction}
                                        onPress={() => handleToggleStatus(task._id, task.status)}
                                    >
                                        <CheckCircleIcon completed={task.status === 'completed'} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {filteredTasks.length === 0 && (
                                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                    <Caption>No tasks found.</Caption>
                                </View>
                            )}
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
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 68,
        height: 44,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    tabScrollContent: {
        gap: spacing.sm,
        paddingRight: spacing.lg,
    },
    tab: {
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.full,
        backgroundColor: colors.mist,
    },
    activeTab: {
        backgroundColor: colors.cobalt,
    },
    tabText: {
        color: colors.slate,
        fontFamily: 'Inter-Medium',
    },
    activeTabText: {
        color: '#FFF',
    },
    scroll: {
        flex: 1,
    },
    taskList: {
        gap: spacing.md,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.mist,
        ...shadows.subtle,
    },
    taskContent: {
        flex: 1,
    },
    taskMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    roomName: {
        fontFamily: 'Inter-SemiBold',
    },
    typeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    desc: {
        color: colors.slate,
        marginBottom: 8,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priority: {
        fontFamily: 'Inter-SemiBold',
    },
    checkAction: {
        padding: spacing.sm,
    },
});
