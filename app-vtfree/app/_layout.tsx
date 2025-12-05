import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={styles.container}>
            <AuthProvider>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        gestureEnabled: true,
                        animation: 'slide_from_right',
                    }}
                >
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="register" options={{ headerShown: false }} />
                    <Stack.Screen name="dashboard" options={{ headerShown: false }} />
                    <Stack.Screen name="create-app" options={{ headerShown: false }} />
                    <Stack.Screen name="build-status" options={{ headerShown: false }} />
                    <Stack.Screen name="app-details" options={{ headerShown: false }} />
                    <Stack.Screen name="support" options={{ headerShown: false }} />
                    <Stack.Screen name="documentation" options={{ headerShown: false }} />
                    <Stack.Screen name="settings" options={{ headerShown: false }} />
                </Stack>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
