import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import {
    HeadingLg,
    HeadingMd,
    HeadingSm,
    Body,
    BodySm,
    Caption,
    ResponsiveContainer,
} from '../../components';
import {
    StudentAttendanceRow,
    MarkPresentModal,
} from '../../components/teacher';
import { teacherClasses, classRoster } from '../../data/teacherMockData';
import Svg, { Path, Circle } from 'react-native-svg';

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
    const classInfo = teacherClasses.find(c => c.id === classId) || teacherClasses[0];
    const roster = classRoster[classId as keyof typeof classRoster] || classRoster['2'];
    
    const [selectedStudent, setSelectedStudent] = useState<{name: string, id: string} | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const handleMarkPresent = (student: {name: string, id: string}) => {
        setSelectedStudent(student);
        setModalVisible(true);
    };

    const handleModalSubmit = (reason: string, note: string) => {
        console.log(`Marking ${selectedStudent?.name} present. Reason: ${reason}, Note: ${note}`);
        setModalVisible(false);
        // In real app, update state/backend here
    };

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveContainer>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <BackIcon />
                    </TouchableOpacity>
                    <View style={styles.headerTitle}>
                        <Caption style={styles.subtitle}>{classInfo.code} • {classInfo.room}</Caption>
                        <HeadingMd numberOfLines={1}>{classInfo.name}</HeadingMd>
                    </View>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    alwaysBounceVertical={false}
                    keyboardShouldPersistTaps="handled"
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
                        </View>
                    </View>
                </ScrollView>
            </ResponsiveContainer>

            <MarkPresentModal 
                visible={modalVisible}
                studentName={selectedStudent?.name || ''}
                onClose={() => setModalVisible(false)}
                onSubmit={handleModalSubmit}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ivory,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
        backgroundColor: colors.ivory,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    headerTitle: {
        flex: 1,
    },
    subtitle: {
        color: colors.cobalt,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: 72,
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
