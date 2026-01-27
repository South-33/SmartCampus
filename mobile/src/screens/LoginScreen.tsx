import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { Button, Input, Wordmark, BodySm, Caption } from '../components';
import Svg, { Path } from 'react-native-svg';

import { useAuthActions } from "@convex-dev/auth/react";
import { Alert } from 'react-native';

export type UserRole = 'student' | 'teacher' | 'admin' | 'staff';

interface LoginScreenProps {
    onLogin: (role: UserRole) => void;
}

// ... icons ...

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
            strokeLinejoin="round"
        />
    </Svg>
);

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signOut } = useAuthActions();

    const handleQuickAccess = (role: UserRole) => {
        const credentials = {
            admin: { email: 'admin@kingsford.edu', password: 'password123' },
            teacher: { email: 'sarah.williams@kingsford.edu', password: 'password123' },
            student: { email: 'john.doe@kingsford.edu', password: 'password123' },
            staff: { email: 'mike.miller@kingsford.edu', password: 'password123' },
        };
        const { email, password } = credentials[role];
        setEmail(email);
        setPassword(password);
        
        // Auto-login after a brief delay to show the credentials being entered
        setTimeout(() => {
            handleLoginWithCreds(email, password);
        }, 100);
    };

    const handleLoginWithCreds = async (e: string, p: string) => {
        setLoading(true);
        try {
            // Force sign out first to clear any stale sessions
            await signOut();
            await signIn("password", { email: e, password: p, flow: "signIn" });
            // Note: We keep setLoading(true) here intentionally.
            // The screen will be unmounted by MainLayout once hydration is complete.
        } catch (error) {
            console.error(error);
            setLoading(false); // Only stop loading if there was an error
            Alert.alert('Login Failed', 'Invalid email or password. If you just seeded, wait 5s for deployment.');
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }
        await handleLoginWithCreds(email, password);
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[
                    styles.content,
                    { paddingTop: insets.top + spacing.lg }
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerMain}>
                        <View>
                            <Wordmark>Kingsford</Wordmark>
                            <BodySm style={styles.tagline}>Est. 1847</BodySm>
                        </View>
                        <View style={styles.crest}>
                            <CrestIcon />
                        </View>
                    </View>
                </View>

                {/* Form */}
                <View 
                    style={styles.form}
                    // @ts-ignore - web only prop
                    accessibilityRole={Platform.OS === 'web' ? 'form' : undefined}
                >
                    <Input
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                    />
                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="current-password"
                    />
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <Button onPress={handleLogin} loading={loading}>Sign In</Button>

                    <BodySm style={styles.forgotLink}>Forgot password?</BodySm>
                    
                    <View style={styles.demoContainer}>
                        <Caption style={styles.demoLabel}>Quick Access (Demo)</Caption>
                        <View style={styles.demoButtons}>
                            <TouchableOpacity 
                                style={styles.demoChip} 
                                onPress={() => handleQuickAccess('student')}
                                activeOpacity={0.7}
                            >
                                <Caption style={styles.demoChipText}>Student</Caption>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.demoChip} 
                                onPress={() => handleQuickAccess('teacher')}
                                activeOpacity={0.7}
                            >
                                <Caption style={styles.demoChipText}>Teacher</Caption>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.demoChip} 
                                onPress={() => handleQuickAccess('admin')}
                                activeOpacity={0.7}
                            >
                                <Caption style={styles.demoChipText}>Admin</Caption>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.demoChip} 
                                onPress={() => handleQuickAccess('staff')}
                                activeOpacity={0.7}
                            >
                                <Caption style={styles.demoChipText}>Staff</Caption>
                            </TouchableOpacity>
                         </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
    },
    crest: {
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
    headerMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
