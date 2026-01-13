import { Tabs } from 'expo-router';
import React from 'react';
import TabBar from '../../components/TabBar';
import { View } from 'react-native';
import FloatingChatButton from '../../components/FloatingChatButton';

export default function TabLayout() {
    return (
        <View style={{ flex: 1 }}>
            <Tabs
                tabBar={(props) => <TabBar {...props} />}
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                    }}
                />
                <Tabs.Screen
                    name="my-apps"
                    options={{
                        title: 'My Apps',
                    }}
                />
                <Tabs.Screen
                    name="wallet"
                    options={{
                        title: 'Wallet',
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Me',
                    }}
                />
            </Tabs>
            <FloatingChatButton />
        </View>
    );
}
