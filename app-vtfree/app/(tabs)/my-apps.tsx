import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, MoreVertical, Smartphone, Globe, Server } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppService } from '../../services/app.service';

export default function MyAppsScreen() {
    const router = useRouter();

    const [apps, setApps] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        try {
            const response = await AppService.getMyApps();
            if (response.success) {
                setApps(response.data.apps.map((app: any) => ({
                    id: app.app_id,
                    name: app.app_name,
                    package: app.package_name,
                    status: app.status === 'active' ? 'Live' : 'Building',
                    type: 'Android', // TODO: Handle multiple platforms
                    icon: Smartphone,
                    color: app.branding?.primary_color || Colors.primary
                })));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <TouchableOpacity
                style={styles.appCard}
                activeOpacity={0.8}
                onPress={() => router.push({
                    pathname: '/app-details',
                    params: {
                        appId: item.id,
                        name: item.name,
                        package: item.package,
                        status: item.status,
                        type: item.type,
                        color: item.color
                    }
                })}
            >
                <View style={[styles.appIcon, { backgroundColor: `${item.color}20` }]}>
                    <item.icon color={item.color} size={24} />
                </View>
                <View style={styles.appInfo}>
                    <Text style={styles.appName}>{item.name}</Text>
                    <Text style={styles.appPackage}>{item.package}</Text>
                </View>
                <View style={styles.appStatus}>
                    <View style={[styles.statusBadge, {
                        backgroundColor: item.status === 'Live' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                    }]}>
                        <Text style={[styles.statusText, {
                            color: item.status === 'Live' ? Colors.success : Colors.warning
                        }]}>{item.status}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.header}>
                <Text style={styles.headerTitle}>My Apps</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/create-app')}
                >
                    <Plus color={Colors.primary} size={24} />
                </TouchableOpacity>
            </LinearGradient>

            <FlatList
                data={apps}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No apps found. Create one!</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.white,
    },
    addButton: {
        width: 44,
        height: 44,
        backgroundColor: Colors.white,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    appCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    appIcon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    appPackage: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    appStatus: {
        marginLeft: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: Colors.gray[500],
        fontSize: 16,
    },
});
