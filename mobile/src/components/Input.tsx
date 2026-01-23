import React from 'react';
import {
    TextInput,
    View,
    Text,
    StyleSheet,
    TextInputProps,
} from 'react-native';
import { colors } from '../theme';

interface InputProps extends TextInputProps {
    label: string;
}

export const Input = ({ label, style, ...props }: InputProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor={colors.mist}
                {...props}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 6,
    },
    label: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: colors.slate,
    },
    input: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: colors.charcoal,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
});
