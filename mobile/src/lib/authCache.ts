import { Platform } from 'react-native';
import { UserRole } from '../screens/LoginScreen';

const CACHE_KEY = 'schoolnfc_auth_cache';
const PROFILE_KEY = 'schoolnfc_user_profile';

interface AuthCache {
    isAuthenticated: boolean;
    userRole: UserRole;
    timestamp: number;
}

interface UserProfile {
    name: string;
    email: string;
    role: UserRole;
    avatarInitials: string;
}

const storage = {
    getItem: (key: string): string | null => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return null;
    },
    setItem: (key: string, value: string): void => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
        }
    },
    removeItem: (key: string): void => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        }
    },
};

export const authCache = {
    get: (): AuthCache | null => {
        try {
            const cached = storage.getItem(CACHE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            console.error('Failed to parse auth cache:', e);
        }
        return null;
    },

    set: (isAuthenticated: boolean, userRole: UserRole): void => {
        try {
            const cache: AuthCache = {
                isAuthenticated,
                userRole,
                timestamp: Date.now(),
            };
            storage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (e) {
            console.error('Failed to set auth cache:', e);
        }
    },

    clear: (): void => {
        storage.removeItem(CACHE_KEY);
        storage.removeItem(PROFILE_KEY);
    },

    // Check if we should optimistically show logged-in state
    shouldOptimisticallyShowApp: (): boolean => {
        const cache = authCache.get();
        if (cache && cache.isAuthenticated) {
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            const isRecent = Date.now() - cache.timestamp < oneWeek;
            return isRecent;
        }
        return false;
    },

    getCachedRole: (): UserRole | null => {
        const cache = authCache.get();
        return cache?.userRole || null;
    },

    // User profile caching
    setProfile: (profile: UserProfile): void => {
        try {
            storage.setItem(PROFILE_KEY, JSON.stringify(profile));
        } catch (e) {
            console.error('Failed to set profile cache:', e);
        }
    },

    getProfile: (): UserProfile | null => {
        try {
            const cached = storage.getItem(PROFILE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            console.error('Failed to parse profile cache:', e);
        }
        return null;
    },

    clearProfile: (): void => {
        storage.removeItem(PROFILE_KEY);
    },
};
