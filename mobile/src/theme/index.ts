// ═══════════════════════════════════════════════════════════════════════════
// KINGSFORD UNIVERSITY — Design Tokens
// British collegiate minimalism with editorial precision
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
    // Primary
    cobalt: '#3B5EE8',
    cobaltLight: '#6B8BF5',
    cobaltDark: '#2A47B8',

    // Neutrals
    ivory: '#FAFAF8',
    cream: '#F5F4F0',
    charcoal: '#1A1A1A',
    slate: '#6B6B6B',
    mist: '#E8E8E6',

    // Semantic
    success: '#2E7D32',
    successBg: '#E8F5E9',
    error: '#C62828',
    errorBg: '#FFEBEE',

    // Transparent
    cobaltAlpha10: 'rgba(59, 94, 232, 0.1)',
    cobaltAlpha20: 'rgba(59, 94, 232, 0.2)',
} as const;

export const fonts = {
    serif: 'PlayfairDisplay',
    serifItalic: 'PlayfairDisplay-Italic',
    sans: 'Inter',
    sansMedium: 'Inter-Medium',
    sansSemiBold: 'Inter-SemiBold',
} as const;

export const spacing = {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 40,
    xl: 64,
    xxl: 96,
} as const;

export const radius = {
    sm: 8,
    md: 12,
    lg: 24,
    full: 9999,
} as const;

export const shadows = {
    subtle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    card: {
        shadowColor: colors.cobalt,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 4,
    },
} as const;
