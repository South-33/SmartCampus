import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../../theme';
import {
    HeadingLg,
    HeadingMd,
    HeadingSm,
    Body,
    BodySm,
    Caption,
    ResponsiveContainer,
    LoadingView,
} from '../../components';
import {
    StudentAttendanceRow,
    MarkPresentModal,
} from '../../components/teacher';
import Svg, { Path } from 'react-native-svg';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ClassDetailScreenProps {
    classId: string;
    onBack: () => void;
}

const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const ClassDetailScreen = ({ classId, onBack }: ClassDetailScreenProps) => {
    const insets = useSafeAreaInsets();
    
    // Fetch live data from Convex
    const classData = useQuery(api.classes.getDetails, { classId: classId as any });
    
    const [selectedStudent, setSelectedStudent] = useState<{name: string, id: string} | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    if (classData === undefined) {
        return <LoadingView />;
    }

    if (!classData) {
        return (
            <View style={styles.container}>
                <ResponsiveContainer>
                    <View style={[
                        styles.content,
                        { paddingTop: insets.top + spacing.lg }
                    ]}>
                        <View style={styles.header}>
                            <View style={styles.headerRow}>
                                <TouchableOpacity 
                                    style={styles.backButton} 
                                    onPress={onBack}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <BackIcon />
                                </TouchableOpacity>
                                <HeadingLg style={styles.headerTitleText}>Class Not Found</HeadingLg>
                                <View style={styles.headerSpacer} />
                            </View>
                        </View>
                    </View>
                </ResponsiveContainer>
            </View>
        );
    }

    const classInfo = {
        code: classData.code,
        room: "Room 305", // Default for now
        name: classData.name,
        attendance: { present: 0, late: 0, absent: 0, total: 0 }
    };
    
    const roster: any[] = []; // Roster logic will follow in next phase

    const handleMarkPresent = (student: {name: string, id: string}) => {
        setSelectedStudent(student);
        setModalVisible(true);
    };

    const handleModalSubmit = (reason: string, note: string) => {
        console.log(`Marking ${selectedStudent?.name} present. Reason: ${reason}, Note: ${note}`);
        setModalVisible(false);
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
                            
                            <View style={styles.headerTitleContainer}>
                                <HeadingLg style={styles.headerTitleText} numberOfLines={1}>{classInfo.name}</HeadingLg>
                                <Caption style={styles.subtitle}>{classInfo.code} • {classInfo.room}</Caption>
                            </View>
                            
                            {/* Spacer for centering */}
                            <View style={styles.headerSpacer} />
                        </View>
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={{ paddingBottom: 72 }}
                        alwaysBounceVertical={false}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                    {/* Session Stats */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <HeadingLg style={styles.statValue}>
                                {classInfo.attendance.present + classInfo.attendance.late}
                            </HeadingLg>
                            <Caption>Present</Caption>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <HeadingLg style={[styles.statValue, { color: colors.error }]}>
                                {classInfo.attendance.absent}
                            </HeadingLg>
                            <Caption>Absent</Caption>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <HeadingLg style={styles.statValue}>{classInfo.attendance.total}</HeadingLg>
                            <Caption>Total</Caption>
                        </View>
                    </View>

                    {/* Roster Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <HeadingSm>STUDENT ROSTER</HeadingSm>
                            <Caption>{roster.length} Enrolled</Caption>
                        </View>

                        <View style={styles.rosterList}>
                            {roster.map((student) => (
                                <StudentAttendanceRow
                                    key={student.id}
                                    name={student.name}
                                    studentId={student.studentId}
                                    status={student.status as any}
                                    checkInTime={student.checkInTime}
                                    onMarkPresent={() => handleMarkPresent({ name: student.name, id: student.id })}
                                />
                            ))}
                            {roster.length === 0 && (
                                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                    <Caption>No students enrolled yet.</Caption>
                                </View>
                            )}
                        </View>
                    </View>
                    </ScrollView>
                </View>
            </ResponsiveContainer>

            <MarkPresentModal 
                visible={modalVisible}
                studentName={selectedStudent?.name || ''}
                onClose={() => setModalVisible(false)}
                onSubmit={handleModalSubmit}
            />
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
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitleText: {
        textAlign: 'center',
    },
    headerSpacer: {
        width: 68,
        height: 44,
    },
    subtitle: {
        color: colors.cobalt,
        fontFamily: 'Inter-SemiBold',
        marginTop: 2,
    },
    scroll: {
        flex: 1,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.mist,
        marginBottom: spacing.xl,
        ...shadows.subtle,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        marginBottom: 4,
    },
    statDivider: {
        width: 1,
        height: '80%',
        alignSelf: 'center',
        backgroundColor: colors.mist,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    rosterList: {
        backgroundColor: '#FFF',
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.mist,
    },
});
