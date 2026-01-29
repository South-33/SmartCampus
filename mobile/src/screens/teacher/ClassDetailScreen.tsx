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
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

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
    const markOverride = useMutation(api.attendance.teacherOverride);
    
    // Fetch live data from Convex
    const sessionData = useQuery(api.sessions.getDetails, { sessionId: classId as any });
    const attendanceRecords = useQuery(api.attendance.getSessionAttendance, { dailySessionId: classId as any });
    
    const [selectedStudent, setSelectedStudent] = useState<{name: string, id: string} | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    // ... rest of imports

    if (sessionData === undefined || attendanceRecords === undefined) {
        return <LoadingView />;
    }

    if (!sessionData) {
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
                                <HeadingLg style={styles.headerTitleText}>Session Not Found</HeadingLg>
                                <View style={styles.headerSpacer} />
                            </View>
                        </View>
                    </View>
                </ResponsiveContainer>
            </View>
        );
    }

    const classInfo = {
        code: sessionData.subjectCode || "N/A",
        room: sessionData.roomName || "Unknown Room",
        name: sessionData.subjectName || "Unknown Subject",
        attendance: {
            present: attendanceRecords.filter(r => r.status === 'present').length,
            late: attendanceRecords.filter(r => r.status === 'late').length,
            absent: attendanceRecords.filter(r => r.status === 'absent').length,
            total: attendanceRecords.length
        }
    };
    
    const roster = attendanceRecords;

    const handleMarkPresent = (student: {name: string, id: string}) => {
        setSelectedStudent(student);
        setModalVisible(true);
    };

    const handleModalSubmit = async (reason: string, note: string) => {
        if (selectedStudent) {
            try {
                await markOverride({
                    attendanceId: selectedStudent.id as Id<"attendance">,
                    status: reason === 'Late' ? 'late' : 'present',
                    note: note || reason,
                });
            } catch (err) {
                console.error("Failed to mark attendance:", err);
            }
        }
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
                            {roster.map((record) => (
                                <StudentAttendanceRow
                                    key={record._id}
                                    name={record.studentName || "Unknown"}
                                    studentId={record.studentId}
                                    status={record.status as any}
                                    checkInTime={record.scanTime ? new Date(record.scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined}
                                    onMarkPresent={() => handleMarkPresent({ name: record.studentName || "Unknown", id: record._id })}
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
