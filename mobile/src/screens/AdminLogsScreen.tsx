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
    Body,
    BodySm,
    Caption,
    ResponsiveContainer,
} from '../components';
import Svg, { Path, Circle } from 'react-native-svg';
import { mockLogs } from '../data/adminMockData';

interface AdminLogsScreenProps {
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
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
                            
                            <HeadingMd style={styles.headerTitle}>Access Logs</HeadingMd>
                            
                            <TouchableOpacity style={styles.filterButton}>
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

                    <View style={styles.logsList}>
                        {mockLogs.map((log) => (
                            <View key={log.id} style={styles.logItem}>
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
    filterButton: {
        width: 80, // Same as backButton width for balancing
        height: 40,
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
});
