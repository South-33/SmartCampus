import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

interface UseFadeInOptions {
    duration?: number;
    delay?: number;
    trigger?: boolean;
}

export const useFadeIn = (options: UseFadeInOptions = {}) => {
    const { duration = 300, delay = 0, trigger = true } = options;
    // If trigger is already true on mount, we can optionally start at 1 to skip the animation
    const opacity = useRef(new Animated.Value(trigger ? 1 : 0)).current;
    const hasAnimated = useRef(trigger); // If it started at 1, we mark it as having animated

    useEffect(() => {
        if (trigger && !hasAnimated.current) {
            hasAnimated.current = true;
            const animation = Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: Platform.OS !== 'web',
            });
            animation.start();
            return () => animation.stop();
        }
    }, [trigger, duration, delay, opacity]);

    return opacity;
};

export const useStaggeredFadeIn = (itemCount: number, options: UseFadeInOptions = {}) => {
    const { duration = 300, delay: baseDelay = 0 } = options;
    const opacities = useRef(Array.from({ length: itemCount }, () => new Animated.Value(0))).current;

    useEffect(() => {
        const animations = opacities.map((opacity, index) =>
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay: baseDelay + index * 50,
                useNativeDriver: Platform.OS !== 'web',
            })
        );

        Animated.stagger(50, animations).start();

        return () => animations.forEach(anim => anim.stop());
    }, [opacities, duration, baseDelay, itemCount]);

    return opacities;
};
