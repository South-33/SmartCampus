import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface TypographyProps extends TextProps {
    children: React.ReactNode;
}

export const Wordmark = ({ style, ...props }: TypographyProps) => (
    <Text style={[styles.wordmark, style]} {...props} />
);

export const HeadingLg = ({ style, ...props }: TypographyProps) => (
    <Text style={[styles.headingLg, style]} {...props} />
);

export const HeadingMd = ({ style, ...props }: TypographyProps) => (
    <Text style={[styles.headingMd, style]} {...props} />
);

export const HeadingSm = ({ style, ...props }: TypographyProps) => (
    <Text style={[styles.headingSm, style]} {...props} />
);

export const BodyLg = ({ style, ...props }: TypographyProps) => (
    <Text style={[styles.bodyLg, style]} {...props} />
);

export const Body = ({ style, ...props }: TypographyProps) => (
    <Text style={[styles.body, style]} {...props} />
);

export const BodySm = ({ style, ...props }: TypographyProps) => (
    <Text style={[styles.bodySm, style]} {...props} />
);

export const Caption = ({ style, ...props }: TypographyProps) => (
    <Text style={[styles.caption, style]} {...props} />
);

const styles = StyleSheet.create({
    wordmark: {
        fontFamily: 'PlayfairDisplay-Medium',
        fontSize: 34,
        letterSpacing: -0.5,
        lineHeight: 40,
        color: colors.charcoal,
    },
    headingLg: {
        fontFamily: 'PlayfairDisplay-Medium',
        fontSize: 28,
        letterSpacing: -0.3,
        lineHeight: 34,
        color: colors.charcoal,
    },
    headingMd: {
        fontFamily: 'PlayfairDisplay-Medium',
        fontSize: 22,
        lineHeight: 30,
        color: colors.charcoal,
    },
    headingSm: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: colors.cobalt,
    },
    bodyLg: {
        fontFamily: 'Inter',
        fontSize: 17,
        lineHeight: 26,
        color: colors.charcoal,
    },
    body: {
        fontFamily: 'Inter',
        fontSize: 15,
        lineHeight: 22,
        color: colors.charcoal,
    },
    bodySm: {
        fontFamily: 'Inter',
        fontSize: 14,
        lineHeight: 20,
        color: colors.slate,
    },
    caption: {
        fontFamily: 'Inter',
        fontSize: 12,
        lineHeight: 16,
        color: colors.slate,
        letterSpacing: 0.2,
    },
});
