import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import Colors from '../constants/Colors';

export default function Index() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    if (user) {
        return <Redirect href="/(tabs)/home" />;
    }

    return <Redirect href="/onboarding" />;
}
