import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import fonts from '../styles/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RiderHomeScreen from '../screens/front/RiderHomeScreen';
import RiderOrdersScreen from '../screens/front/RiderOrdersScreen';
import RiderHistoryScreen from '../screens/front/RiderHistoryScreen';
import RiderProfileScreen from '../screens/front/RiderProfileScreen';

const Tab = createBottomTabNavigator();

const FrontNavigation: React.FC = () => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.backgroundPrimary,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios'
                        ? 85 + insets.bottom
                        : 65 + insets.bottom,
                    paddingBottom: Platform.OS === 'ios'
                        ? insets.bottom
                        : Math.max(insets.bottom, 8),
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarActiveTintColor: colors.themePrimary,
                tabBarInactiveTintColor: colors.textLabel,
                tabBarLabelStyle: {
                    fontSize: fonts.size.font11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarIconStyle: {
                    marginTop: 4,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={RiderHomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ focused, color, size }) => {
                        return (
                            <Icon
                                name={focused ? 'home' : 'home-outline'}
                                size={size}
                                color={color}
                            />
                        );
                    },
                }}
            />

            <Tab.Screen
                name="Orders"
                component={RiderOrdersScreen}
                options={{
                    tabBarLabel: 'Orders',
                    tabBarIcon: ({ focused, color, size }) => {
                        return (
                            <Icon
                                name={focused ? 'clipboard-list' : 'clipboard-list-outline'}
                                size={size}
                                color={color}
                            />
                        );
                    },
                    tabBarBadge: 3, // Dynamic count from API
                }}
            />

            <Tab.Screen
                name="History"
                component={RiderHistoryScreen}
                options={{
                    tabBarLabel: 'History',
                    tabBarIcon: ({ focused, color, size }) => {
                        return (
                            <Icon
                                name={focused ? 'history' : 'history'}
                                size={size}
                                color={color}
                            />
                        );
                    },
                }}
            />

            <Tab.Screen
                name="Profile"
                component={RiderProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ focused, color, size }) => {
                        return (
                            <Icon
                                name={focused ? 'account' : 'account-outline'}
                                size={size}
                                color={color}
                            />
                        );
                    },
                }}
            />
        </Tab.Navigator>
    );
};

export default FrontNavigation;