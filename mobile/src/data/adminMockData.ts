import { colors } from '../theme';

export type DeviceStatus = 'online' | 'offline' | 'malfunction';
export type DeviceType = 'gatekeeper' | 'watchman';

export interface AdminDevice {
    id: string;
    chipId: string;
    name: string;
    type: DeviceType;
    status: DeviceStatus;
    lastSeen: string;
    firmwareVersion: string;
    roomId?: string;
    roomName?: string;
    uptime?: string;
    freeMemory?: string;
}

export interface AdminUser {
    id: string;
    name: string;
    role: 'student' | 'teacher' | 'cleaner' | 'admin';
    status: 'enrolled' | 'graduated' | 'expelled' | 'active' | 'temporary';
    cardUID?: string;
    deviceId?: string;
    allowedRooms: string[];
    lastActive: string;
    avatar?: string;
}

export type LockStatus = 'unlocked' | 'staff_only' | 'admin_only' | 'locked';

export type RoomType = 'classroom' | 'lab' | 'bathroom' | 'office' | 'common';

export interface AdminRoom {
    id: string;
    name: string;
    type: RoomType;
    gatekeeperId?: string;
    watchmanId?: string;
    gps: { lat: number; lng: number };
    occupancy: number;
    powerStatus: 'on' | 'off';
    lockStatus: LockStatus;
    connectivity: {
        wifi: 'online' | 'offline';
        internet: 'online' | 'offline';
    };
    isPinned?: boolean;
    needsCleaning: boolean;
    lastCleanedAt?: string;
}

export interface AdminLog {
    id: string;
    userId: string;
    userName: string;
    roomId: string;
    roomName: string;
    method: 'card' | 'phone' | 'biometric';
    action: 'OPEN_GATE' | 'ATTENDANCE';
    result: 'granted' | 'denied';
    timestamp: string;
    timestampType: 'server' | 'local';
    details?: string;
}

export interface AdminAlert {
    id: string;
    type: 'device' | 'suspicious' | 'sharing' | 'gps';
    priority: 'high' | 'medium' | 'low';
    message: string;
    time: string;
    data?: any;
}

export const mockDevices: AdminDevice[] = [
    { 
        id: 'dev1', 
        chipId: 'A1B2C3D4E5F6', 
        name: 'Room 305 Door', 
        type: 'gatekeeper', 
        status: 'online', 
        lastSeen: '2 min ago', 
        firmwareVersion: '1.2.3',
        roomId: 'room1',
        roomName: 'Computer Lab 305',
        uptime: '4d 12h',
        freeMemory: '45KB'
    },
    { 
        id: 'dev2', 
        chipId: 'B2C3D4E5F6A1', 
        name: 'Room 305 Radar', 
        type: 'watchman', 
        status: 'online', 
        lastSeen: '2 min ago', 
        firmwareVersion: '1.2.3',
        roomId: 'room1',
        roomName: 'Computer Lab 305'
    },
    { 
        id: 'dev3', 
        chipId: 'C3D4E5F6A1B2', 
        name: 'Room 408 Door', 
        type: 'gatekeeper', 
        status: 'offline', 
        lastSeen: '15 min ago', 
        firmwareVersion: '1.2.2',
        roomId: 'room2',
        roomName: 'Seminar Room 408'
    },
    { 
        id: 'dev4', 
        chipId: 'D4E5F6A1B2C3', 
        name: 'Main Gate', 
        type: 'gatekeeper', 
        status: 'online', 
        lastSeen: '1 min ago', 
        firmwareVersion: '1.2.3'
    },
    { 
        id: 'dev5', 
        chipId: 'E5F6A1B2C3D4', 
        name: 'Room 112 Door', 
        type: 'gatekeeper', 
        status: 'online', 
        lastSeen: '5 min ago', 
        firmwareVersion: '1.2.3',
        roomId: 'room3',
        roomName: 'Physics Lab 112'
    },
];

export const mockUsers: AdminUser[] = [
    { id: 'u1', name: 'John Doe', role: 'student', status: 'enrolled', cardUID: '04:A3:2B:1C', lastActive: '10 min ago', allowedRooms: ['room1', 'room2', 'room3'] },
    { id: 'u2', name: 'Jane Smith', role: 'student', status: 'enrolled', cardUID: '04:B7:3C:2D', lastActive: '1 hr ago', allowedRooms: ['room1'] },
    { id: 'u3', name: 'Prof. Kingsford', role: 'teacher', status: 'active', lastActive: '5 min ago', allowedRooms: ['all'] },
    { id: 'u4', name: 'Mike Miller', role: 'cleaner', status: 'active', lastActive: '2 hrs ago', allowedRooms: ['all'] },
    { id: 'u5', name: 'Alice Wong', role: 'student', status: 'enrolled', cardUID: '04:D2:5E:4F', lastActive: 'Yesterday', allowedRooms: ['room2'] },
];

export const mockRooms: AdminRoom[] = [
    { id: 'room1', name: 'Computer Lab 305', type: 'lab', gatekeeperId: 'dev1', watchmanId: 'dev2', gps: { lat: 13.7563, lng: 100.5018 }, occupancy: 12, powerStatus: 'on', lockStatus: 'unlocked', connectivity: { wifi: 'online', internet: 'online' }, isPinned: true, needsCleaning: false, lastCleanedAt: '2h ago' },
    { id: 'room2', name: 'Seminar Room 408', type: 'classroom', gatekeeperId: 'dev3', gps: { lat: 13.7565, lng: 100.5020 }, occupancy: 0, powerStatus: 'off', lockStatus: 'locked', connectivity: { wifi: 'offline', internet: 'offline' }, isPinned: false, needsCleaning: true, lastCleanedAt: 'Yesterday' },
    { id: 'room3', name: 'Physics Lab 112', type: 'lab', gatekeeperId: 'dev5', gps: { lat: 13.7560, lng: 100.5015 }, occupancy: 5, powerStatus: 'on', lockStatus: 'staff_only', connectivity: { wifi: 'online', internet: 'online' }, isPinned: true, needsCleaning: false, lastCleanedAt: '3h ago' },
    { id: 'room4', name: 'Men\'s Restroom L3', type: 'bathroom', gps: { lat: 13.7562, lng: 100.5017 }, occupancy: 0, powerStatus: 'on', lockStatus: 'unlocked', connectivity: { wifi: 'online', internet: 'online' }, needsCleaning: true, lastCleanedAt: '4h ago' },
    { id: 'room5', name: 'Women\'s Restroom L3', type: 'bathroom', gps: { lat: 13.7562, lng: 100.5019 }, occupancy: 0, powerStatus: 'on', lockStatus: 'unlocked', connectivity: { wifi: 'online', internet: 'online' }, needsCleaning: true, lastCleanedAt: '4h ago' },
    { id: 'room6', name: 'Staff Lounge', type: 'common', gps: { lat: 13.7561, lng: 100.5016 }, occupancy: 0, powerStatus: 'on', lockStatus: 'staff_only', connectivity: { wifi: 'online', internet: 'online' }, needsCleaning: true, lastCleanedAt: 'Today, 8:00 AM' },
];

export const mockLogs: AdminLog[] = [
    { id: 'l1', userId: 'u1', userName: 'John Doe', roomId: 'room1', roomName: 'Computer Lab 305', method: 'card', action: 'ATTENDANCE', result: 'granted', timestamp: '2026-01-25T09:01:25Z', timestampType: 'server' },
    { id: 'l2', userId: 'u3', userName: 'Prof. Kingsford', roomId: 'room1', roomName: 'Computer Lab 305', method: 'phone', action: 'OPEN_GATE', result: 'granted', timestamp: '2026-01-25T08:55:10Z', timestampType: 'server' },
    { id: 'l3', userId: 'u2', userName: 'Jane Smith', roomId: 'room2', roomName: 'Seminar Room 408', method: 'card', action: 'ATTENDANCE', result: 'denied', timestamp: '2026-01-25T10:15:00Z', timestampType: 'local', details: 'Not enrolled in room' },
    { id: 'l4', userId: 'u1', userName: 'John Doe', roomId: 'room3', roomName: 'Physics Lab 112', method: 'biometric', action: 'ATTENDANCE', result: 'granted', timestamp: '2026-01-25T11:30:45Z', timestampType: 'server' },
];

export interface StaffTask {
    id: string;
    roomId: string;
    roomName: string;
    type: 'cleaning' | 'maintenance' | 'inspection';
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    description: string;
    assignedTo?: string;
}

export const mockStaffTasks: StaffTask[] = [
    { id: 't1', roomId: 'room1', roomName: 'Computer Lab 305', type: 'cleaning', priority: 'medium', status: 'pending', description: 'Daily floor cleaning and desk sanitization.' },
    { id: 't2', roomId: 'room2', roomName: 'Seminar Room 408', type: 'maintenance', priority: 'high', status: 'in_progress', description: 'Check door lock mechanism - reported sticking.' },
    { id: 't3', roomId: 'room3', roomName: 'Physics Lab 112', type: 'cleaning', priority: 'low', status: 'completed', description: 'Trash removal.' },
    { id: 't4', roomId: 'room1', roomName: 'Computer Lab 305', type: 'maintenance', priority: 'medium', status: 'pending', description: 'Replace projector bulb.' },
];

export const mockAlerts: AdminAlert[] = [
    { id: 'a1', type: 'device', priority: 'high', message: 'Room 408 Door offline', time: '15 min ago' },
    { id: 'a2', type: 'sharing', priority: 'high', message: 'Device used by 2 accounts', time: '1 hr ago', data: { deviceId: 'E621E1F8...', users: ['John Doe', 'Jane Smith'] } },
    { id: 'a3', type: 'gps', priority: 'medium', message: 'GPS mismatch: John Doe', time: '2 hrs ago' },
];
