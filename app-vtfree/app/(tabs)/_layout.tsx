import { Tabs } from 'expo-router';
import React from 'react';
import TabBar from '../../components/TabBar';

export default function TabLayout() {
    return (
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
                name="profile"
                options={{
                    title: 'Me',
                }}
            />
        </Tabs>
    );
}
