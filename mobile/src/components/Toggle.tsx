import React, { useEffect, useRef } from 'react';
import { 
    TouchableOpacity, 
    Animated, 
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { colors } from '../theme';

interface ToggleProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    style?: ViewStyle;
}

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 24;
const THUMB_OFFSET = 2;

export const Toggle = ({ value, onValueChange, disabled, style }: ToggleProps) => {
    const translateX = useRef(new Animated.Value(value ? TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET : THUMB_OFFSET)).current;

    useEffect(() => {
        Animated.spring(translateX, {
            toValue: value ? TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET : THUMB_OFFSET,
            useNativeDriver: true,
            bounciness: 2,
            speed: 20,
        }).start();
    }, [value, translateX]);

    const handlePress = () => {
        if (!disabled) {
            onValueChange(!value);
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            disabled={disabled}
            style={style}
        >
            <Animated.View 
                style={[
                    styles.track, 
                    { backgroundColor: value ? colors.cobalt : colors.mist },
                    disabled && styles.trackDisabled,
                ]}
            >
                <Animated.View 
                    style={[
                        styles.thumb,
                        { transform: [{ translateX }] },
                        disabled && styles.thumbDisabled,
                    ]} 
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    track: {
        width: TRACK_WIDTH,
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        justifyContent: 'center',
    },
    trackDisabled: {
        opacity: 0.5,
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    thumbDisabled: {
        backgroundColor: '#F0F0F0',
    },
});
