import { colors } from '../theme';

export const ENROLLMENT_START = { year: 2024, month: 8 }; // September 2024
export const ENROLLMENT_END = { year: 2028, month: 5 };   // June 2028

export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const getTermInfo = (month: number, year: number) => {
    if (month >= 9 && month <= 11) return { name: 'Michaelmas Term', color: colors.cobalt };
    if (month >= 0 && month <= 2) return { name: 'Hilary Term', color: '#6366F1' };
    if (month >= 3 && month <= 5) return { name: 'Trinity Term', color: '#8B5CF6' };
    return { name: 'Summer Vacation', color: colors.slate };
};

export const getAcademicData = (month: number, year: number) => {
    const holidays: number[] = [];
    const termDays: number[] = [];
    const examDays: number[] = [];
    
    if (month === 11) holidays.push(24, 25, 26, 27, 28, 29, 30, 31);
    if (month === 0) holidays.push(1, 2);
    if (month === 2) holidays.push(29, 30, 31);
    if (month === 3) holidays.push(1, 2, 3, 4, 5);
    if (month === 4) holidays.push(6, 27);
    if (month === 7) holidays.push(26);
    
    const termMonths = [0, 1, 2, 3, 4, 5, 9, 10, 11];
    if (termMonths.includes(month)) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dayOfWeek = new Date(year, month, d).getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(d)) {
                termDays.push(d);
            }
        }
    }
    
    if (month === 0) examDays.push(13, 14, 15, 16, 17, 20, 21, 22, 23, 24);
    if (month === 4 || month === 5) {
        if (month === 4) examDays.push(19, 20, 21, 22, 23, 26, 27, 28, 29, 30);
        if (month === 5) examDays.push(2, 3, 4, 5, 6, 9, 10, 11, 12, 13);
    }
    
    return { holidays, termDays, examDays };
};
