import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/auth.service';
import { router } from 'expo-router';

interface AuthContextType {
    user: any | null;
    isLoading: boolean;
    signIn: (data: any) => Promise<void>;
    signUp: (data: any) => Promise<void>;
    signOut: () => Promise<void>;
    updateUser: (user: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const userJson = await AsyncStorage.getItem('vtfree_user');
            const token = await AsyncStorage.getItem('vtfree_token');
            if (userJson && token) {
                setUser(JSON.parse(userJson));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    async function signIn(data: any) {
        try {
            const response = await AuthService.login(data);
            if (response.success) {
                setUser(response.data.user);
                // router.replace('/(tabs)'); // Handling navigation in the screen
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            throw error;
        }
    }

    async function signUp(data: any) {
        try {
            const response = await AuthService.register(data);
            if (response.success) {
                setUser(response.data.user);
                // router.replace('/(tabs)'); // Handling navigation in the screen
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            throw error;
        }
    }

    async function signOut() {
        await AuthService.logout();
        setUser(null);
        router.replace('/login');
    }

    async function updateUser(userData: any) {
        setUser(userData);
        await AsyncStorage.setItem('vtfree_user', JSON.stringify(userData));
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
