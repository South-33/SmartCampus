import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    TouchableOpacityProps,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
} from 'react-native';
import { colors, radius } from '../theme';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'ghost';
    children: React.ReactNode;
    loading?: boolean;
}

export const Button = ({
    variant = 'primary',
    children,
    style,
    disabled,
    loading,
    ...props
}: ButtonProps) => {
    const buttonStyles: any[] = [
        styles.base,
        styles[variant],
        (disabled || loading) ? styles.disabled : {},
        style,
    ];

    const textStyles: any[] = [
        styles.text,
        styles[`${variant}Text` as keyof typeof styles],
        (disabled || loading) ? styles.disabledText : {},
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            activeOpacity={0.85}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.cobalt} />
            ) : (
                <Text style={textStyles}>{children}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primary: {
        backgroundColor: colors.cobalt,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.cobalt,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    disabled: {
        backgroundColor: colors.mist,
        borderColor: colors.mist,
    },
    text: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        letterSpacing: 0.3,
    },
    primaryText: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: colors.cobalt,
    },
    ghostText: {
        color: colors.cobalt,
    },
    disabledText: {
        color: colors.slate,
    },
});
