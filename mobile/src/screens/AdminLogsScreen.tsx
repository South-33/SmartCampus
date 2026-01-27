import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
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
import Svg, { Path } from 'react-native-svg';
import { useConvexAuth } from 'convex/react';
import { useAppData } from '../context/AppContext';

interface AdminLogsScreenProps {
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const FilterIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const AdminLogsScreen = ({ onBack }: AdminLogsScreenProps) => {
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useConvexAuth();
    const { recentLogs: allLogs, isAdminDataLoaded } = useAppData();
    
    const isLoading = isAuthenticated && !isAdminDataLoaded;
    const logs = allLogs || [];

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
                            
                            <HeadingLg style={styles.headerTitle}>Access Logs</HeadingLg>
                            
                            <TouchableOpacity 
                                style={styles.filterButton} 
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <FilterIcon />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={{ paddingBottom: spacing.xl }}
                        showsVerticalScrollIndicator={false}
                    >
                        <HeadingSm style={styles.sectionTitle}>RECENT ACTIVITY</HeadingSm>

                        {isLoading ? (
                            <View style={styles.inlineLoading}>
                                <ActivityIndicator color={colors.cobalt} />
                            </View>
                        ) : (
                            <View style={styles.logsList}>
                                {logs.map((log: any) => (
                                    <View key={log._id || log.id} style={styles.logItem}>
                                        <View style={[
                                            styles.resultIndicator,
                                            { backgroundColor: log.result === 'granted' ? colors.success : colors.error }
                                        ]} />
                                        
                                        <View style={styles.logContent}>
                                            <View style={styles.logHeader}>
                                                <Body style={styles.logUser}>{log.userName}</Body>
                                                <Caption>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Caption>
                                            </View>
                                            
                                            <BodySm style={styles.logAction}>
                                                {log.action.replace('_', ' ')} • {log.roomName}
                                            </BodySm>
                                            
                                            <View style={styles.logFooter}>
                                                <Caption>Via {log.method.toUpperCase()}</Caption>
                                                {log.details && <Caption style={styles.logDetails}>{log.details}</Caption>}
                                            </View>
                                        </View>
                                    </View>
                                ))}
                                {logs.length === 0 && (
                                    <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                        <Caption>No activity logged yet.</Caption>
                                    </View>
                                )}
                            </View>
                        )}
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
    filterButton: {
        width: 68, // Same as backButton width for balancing
        height: 44,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    scroll: {
        flex: 1,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    logsList: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        overflow: 'hidden',
        ...shadows.subtle,
    },
    logItem: {
        flexDirection: 'row',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    resultIndicator: {
        width: 4,
        borderRadius: 2,
        marginRight: spacing.md,
    },
    logContent: {
        flex: 1,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    logUser: {
        fontFamily: 'Inter-SemiBold',
    },
    logAction: {
        color: colors.slate,
        marginBottom: 4,
    },
    logFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    logDetails: {
        color: colors.error,
    },
    inlineLoading: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
