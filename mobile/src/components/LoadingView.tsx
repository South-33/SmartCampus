import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

export const LoadingView = () => (
    <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.cobalt} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.ivory,
    },
});
