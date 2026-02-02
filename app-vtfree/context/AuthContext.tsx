import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/auth.service';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
    user: any | null;
    token: string | null;
    isLoading: boolean;
    hasLaunched: boolean;
    signIn: (data: any, rememberMe?: boolean) => Promise<void>;
    signUp: (data: any, rememberMe?: boolean) => Promise<void>;
    signOut: () => Promise<void>;
    updateUser: (user: any) => Promise<void>;
    completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLaunched, setHasLaunched] = useState(false);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const userJson = await AsyncStorage.getItem('vtfree_user');
            const storedToken = await AsyncStorage.getItem('vtfree_token');
            const launched = await AsyncStorage.getItem('vtfree_has_launched');

            if (launched === 'true') {
                setHasLaunched(true);
            }

            if (userJson && storedToken) {
                try {
                    setUser(JSON.parse(userJson));
                    setToken(storedToken);
                } catch (parseError) {
                    console.error('Error parsing stored user:', parseError);
                    await AsyncStorage.removeItem('vtfree_user');
                    await AsyncStorage.removeItem('vtfree_token');
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    async function signIn(data: any, rememberMe = true) {
        try {
            const response = await AuthService.login(data, rememberMe);
            if (response.success) {
                setUser(response.data.user);
                setToken(response.data.token);
                await completeOnboarding();

                // Save credentials for Biometric Login
                if (rememberMe) {
                    await SecureStore.setItemAsync('user_email', data.email);
                    await SecureStore.setItemAsync('user_password', data.password);
                } else {
                    await SecureStore.deleteItemAsync('user_email');
                    await SecureStore.deleteItemAsync('user_password');
                }

                router.replace('/(tabs)/home');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            throw error;
        }
    }

    async function signUp(data: any, rememberMe = true) {
        try {
            const response = await AuthService.register(data, rememberMe);
            if (response.success) {
                setUser(response.data.user);
                setToken(response.data.token);
                await completeOnboarding();
                router.replace('/(tabs)/home');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            throw error;
        }
    }

    async function signOut() {
        await AuthService.logout();
        await AsyncStorage.multiRemove(['vtfree_token', 'vtfree_user']);

        // Optionally keep biometrics enabled even after logout for quick re-login?
        // Usually logout means "clear everything". But for convenient re-login (like banking apps),
        // we might KEEP the SecureStore data but clear the active session token.
        // User request: "next time he can use biometric to login" implies persistance.
        // However, standard security practice is to clear on explicit Logout.
        // IF I clear it here, the user has to type password again next time.
        // IF I don't, they can just press "Biometric Login" immediately.
        // Given the request "next time he can use biometric", I will NOT clear SecureStore here.
        // Instead, I'll only clear the active session state.

        setUser(null);
        setToken(null);
        router.replace('/login');
    }

    async function updateUser(userData: any) {
        setUser(userData);
        await AsyncStorage.setItem('vtfree_user', JSON.stringify(userData));
    }

    async function completeOnboarding() {
        setHasLaunched(true);
        await AsyncStorage.setItem('vtfree_has_launched', 'true');
    }

    return (
        <AuthContext.Provider value={{ user, token, isLoading, hasLaunched, signIn, signUp, signOut, updateUser, completeOnboarding }}>
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
