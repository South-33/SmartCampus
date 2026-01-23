import { colors } from '../theme';

export const teacherProfile = {
    name: 'Prof. Sarah Williams',
    email: 'sarah.williams@kingsford.edu',
    department: 'Computer Science',
    staffId: 'STAFF-2019-0142',
    avatar: 'SW',
};

export const teachingHours = {
    today: { scanIn: '08:45', scanOut: null, duration: null, status: 'teaching' },
    thisWeek: 12.5,
    thisMonth: 48.0,
    target: 20, // hours per week
};

export type ClassStatus = 'completed' | 'ongoing' | 'upcoming';

export interface ClassSession {
    id: string;
    code: string;
    name: string;
    room: string;
    startTime: string;
    endTime: string;
    status: ClassStatus;
    attendance: {
        present: number;
        late: number;
        absent: number;
        total: number;
    };
    date: string;
}

export const teacherClasses: ClassSession[] = [
    {
        id: '1',
        code: 'CS101',
        name: 'Data Structures',
        room: 'Room 305',
        startTime: '09:00',
        endTime: '10:30',
        status: 'completed',
        date: '2026-01-23',
        attendance: { present: 28, late: 2, absent: 2, total: 32 },
    },
    {
        id: '2',
        code: 'CS201',
        name: 'Algorithms',
        room: 'Room 305',
        startTime: '11:00',
        endTime: '12:30',
        status: 'ongoing',
        date: '2026-01-23',
        attendance: { present: 15, late: 3, absent: 12, total: 30 },
    },
    {
        id: '3',
        code: 'CS301',
        name: 'Database Systems',
        room: 'Room 408',
        startTime: '14:00',
        endTime: '15:30',
        status: 'upcoming',
        date: '2026-01-23',
        attendance: { present: 0, late: 0, absent: 0, total: 25 },
    },
    {
        id: '4',
        code: 'CS101',
        name: 'Data Structures',
        room: 'Room 305',
        startTime: '09:00',
        endTime: '10:30',
        status: 'completed',
        date: '2026-01-21',
        attendance: { present: 30, late: 1, absent: 1, total: 32 },
    },
];

export const classRoster = {
    '2': [
        { id: 's1', name: 'Alice Chen', status: 'present', checkInTime: '11:02', studentId: 'STU-001' },
        { id: 's2', name: 'Bob Martinez', status: 'late', checkInTime: '11:18', studentId: 'STU-002' },
        { id: 's3', name: 'Carol Johnson', status: 'absent', checkInTime: null, studentId: 'STU-003' },
        { id: 's4', name: 'David Smith', status: 'present', checkInTime: '11:05', studentId: 'STU-004' },
        { id: 's5', name: 'Emma Wilson', status: 'absent', checkInTime: null, studentId: 'STU-005' },
        { id: 's6', name: 'Frank Wright', status: 'present', checkInTime: '11:01', studentId: 'STU-006' },
    ],
};

export const attendanceAlerts = [
    { 
        id: '1', 
        type: 'low_attendance' as const, 
        course: 'CS201', 
        message: 'Only 15/30 checked in (50%)', 
        priority: 'high' as const 
    },
    { 
        id: '2', 
        type: 'at_risk' as const, 
        student: 'James Miller', 
        course: 'CS201', 
        message: '2 more absences = probation', 
        priority: 'medium' as const 
    },
    { 
        id: '3', 
        type: 'suspicious' as const, 
        message: 'Device sharing detected in Room 305', 
        priority: 'high' as const 
    },
];

export const teachingHistory = [
    { id: 'h1', date: '2026-01-22', scanIn: '08:55', scanOut: '15:45', duration: '6h 50m', status: 'completed' },
    { id: 'h2', date: '2026-01-21', scanIn: '08:42', scanOut: '12:40', duration: '3h 58m', status: 'completed' },
    { id: 'h3', date: '2026-01-20', scanIn: '10:15', scanOut: '17:10', duration: '6h 55m', status: 'completed' },
    { id: 'h4', date: '2026-01-19', scanIn: '08:50', scanOut: '15:30', duration: '6h 40m', status: 'completed' },
];

export const classHoursProgress = [
    { id: '1', code: 'CS101', name: 'Data Structures', completed: 24, total: 36, color: colors.cobalt },
    { id: '2', code: 'CS201', name: 'Algorithms', completed: 18, total: 36, color: '#6366F1' },
    { id: '3', code: 'CS301', name: 'Database Systems', completed: 6, total: 30, color: '#8B5CF6' },
];
