import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { Body, HeadingMd, HeadingSm, Caption } from '../Typography';
import { Button } from '../Button';
import Svg, { Path } from 'react-native-svg';

interface MarkPresentModalProps {
    visible: boolean;
    studentName: string;
    onClose: () => void;
    onSubmit: (reason: string, note: string) => void;
}

const CloseIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.slate} strokeWidth={2}>
        <Path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const reasons = [
    'Doctor\'s note',
    'Technical issue',
    'Approved absence',
    'Late arrival (Approved)',
    'Other',
];

export const MarkPresentModal = ({ visible, studentName, onClose, onSubmit }: MarkPresentModalProps) => {
    const [selectedReason, setSelectedReason] = useState(reasons[0]);
    const [note, setNote] = useState('');

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.overlay}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View>
                            <Caption style={styles.subtitle}>MANUAL ATTENDANCE</Caption>
                            <HeadingMd>Mark {studentName} Present</HeadingMd>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <CloseIcon />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <HeadingSm style={styles.label}>Reason for Override</HeadingSm>
                        <View style={styles.reasonsGrid}>
                            {reasons.map((reason) => (
                                <TouchableOpacity 
                                    key={reason}
                                    style={[
                                        styles.reasonChip,
                                        selectedReason === reason && styles.reasonChipActive
                                    ]}
                                    onPress={() => setSelectedReason(reason)}
                                >
                                    <Caption style={[
                                        styles.reasonText,
                                        selectedReason === reason && styles.textWhite
                                    ]}>
                                        {reason}
                                    </Caption>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <HeadingSm style={styles.label}>Additional Note</HeadingSm>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a brief explanation..."
                            multiline
                            numberOfLines={3}
                            value={note}
                            onChangeText={setNote}
                            placeholderTextColor={colors.slate}
                        />

                        <View style={styles.warningBox}>
                            <Caption style={styles.warningText}>
                                This action will be logged and visible to administrators.
                            </Caption>
                        </View>

                        <Button 
                            onPress={() => onSubmit(selectedReason, note)}
                            variant="primary"
                        >
                            Confirm Attendance
                        </Button>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.ivory,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    subtitle: {
        color: colors.cobalt,
        letterSpacing: 1,
        marginBottom: 4,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        gap: spacing.md,
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
    },
    reasonsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    reasonChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
    },
    reasonChipActive: {
        backgroundColor: colors.cobalt,
        borderColor: colors.cobalt,
    },
    reasonText: {
        fontFamily: 'Inter-Medium',
    },
    textWhite: {
        color: '#FFF',
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: colors.mist,
        borderRadius: radius.md,
        padding: spacing.sm,
        height: 80,
        textAlignVertical: 'top',
        fontFamily: 'Inter',
        fontSize: 14,
    },
    warningBox: {
        backgroundColor: colors.cream,
        padding: spacing.sm,
        borderRadius: radius.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.cobalt,
    },
    warningText: {
        fontStyle: 'italic',
    },
});
