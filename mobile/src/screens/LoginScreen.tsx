import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { colors, spacing } from '../theme';
import { Button, Input, Wordmark, BodySm, Caption } from '../components';
import Svg, { Path } from 'react-native-svg';

export type UserRole = 'student' | 'teacher' | 'admin';

interface LoginScreenProps {
    onLogin: (role: UserRole) => void;
}

// Simple crest icon
const CrestIcon = () => (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 2L4 6v6c0 5.5 3.4 10.3 8 12 4.6-1.7 8-6.5 8-12V6l-8-4z"
            stroke="#FFF"
            strokeWidth={1.5}
            fill="none"
        />
        <Path
            d="M12 8v8M8 12h8"
            stroke="#FFF"
            strokeWidth={1.5}
            strokeLinecap="round"
        />
    </Svg>
);

// Demo accounts - simulates backend role lookup
const DEMO_ACCOUNTS: Record<string, UserRole> = {
    'student': 'student',
    'teacher': 'teacher',
    'admin': 'admin',
    '2024001': 'student',
    'prof': 'teacher',
};

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Demo: determine role from ID (in real app, server returns this)
        const role = DEMO_ACCOUNTS[userId.toLowerCase()] || 'student';
        onLogin(role);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Crest Badge */}
                <View style={styles.crest}>
                    <CrestIcon />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Wordmark>Kingsford</Wordmark>
                    <BodySm style={styles.tagline}>Est. 1847</BodySm>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Input
                        label="User ID"
                        placeholder="Enter your ID"
                        value={userId}
                        onChangeText={setUserId}
                        autoCapitalize="none"
                    />
                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <Button onPress={handleLogin}>Sign In</Button>
                    <BodySm style={styles.forgotLink}>Forgot password?</BodySm>
                    
                    <View style={styles.demoContainer}>
                        <Caption style={styles.demoLabel}>Quick Access (Demo)</Caption>
                        <View style={styles.demoButtons}>
                            <TouchableOpacity 
                                style={styles.demoChip} 
                                onPress={() => onLogin('student')}
                                activeOpacity={0.7}
                            >
                                <Caption style={styles.demoChipText}>Student</Caption>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.demoChip} 
                                onPress={() => onLogin('teacher')}
                                activeOpacity={0.7}
                            >
                                <Caption style={styles.demoChipText}>Teacher</Caption>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.demoChip} 
                                onPress={() => onLogin('admin')}
                                activeOpacity={0.7}
                            >
                                <Caption style={styles.demoChipText}>Admin</Caption>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
        justifyContent: 'space-between',
    },
    crest: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.lg,
        width: 48,
        height: 48,
        backgroundColor: colors.cobalt,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        marginBottom: spacing.xl,
    },
    tagline: {
        fontStyle: 'italic',
        marginTop: 4,
    },
    form: {
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    actions: {
        marginTop: 'auto',
        paddingBottom: spacing.lg,
        gap: spacing.md,
    },
    forgotLink: {
        textAlign: 'center',
    },
    demoContainer: {
        marginTop: spacing.md,
        alignItems: 'center',
        gap: spacing.xs,
    },
    demoLabel: {
        fontSize: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: colors.slate,
        fontFamily: 'Inter-SemiBold',
    },
    demoButtons: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    demoChip: {
        backgroundColor: colors.cream,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: colors.mist,
    },
    demoChipText: {
        color: colors.cobalt,
        fontFamily: 'Inter-Medium',
    },
});
