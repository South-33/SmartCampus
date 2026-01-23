import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    TouchableOpacityProps,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors, radius } from '../theme';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'ghost';
    children: React.ReactNode;
}

export const Button = ({
    variant = 'primary',
    children,
    style,
    disabled,
    ...props
}: ButtonProps) => {
    const buttonStyles: ViewStyle[] = [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        style as ViewStyle,
    ];

    const textStyles: TextStyle[] = [
        styles.text,
        styles[`${variant}Text` as keyof typeof styles] as TextStyle,
        disabled && styles.disabledText,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            activeOpacity={0.85}
            disabled={disabled}
            {...props}
        >
            <Text style={textStyles}>{children}</Text>
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
