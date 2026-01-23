import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface ResponsiveContainerProps {
    children: React.ReactNode;
    style?: any;
}

export const ResponsiveContainer = ({ children, style }: ResponsiveContainerProps) => {
    return (
        <View style={[styles.inner, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    inner: {
        width: '100%',
        flex: 1,
        backgroundColor: colors.ivory,
    }
});
