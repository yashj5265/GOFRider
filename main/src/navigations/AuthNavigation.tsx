import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import constant from '../utilities/constant';
import LoginScreen from '../screens/auth/LoginScreen';

const NavigationStack = createNativeStackNavigator();

const AuthNavigation: React.FC = () => {
    return (
        <NavigationStack.Navigator
            initialRouteName={constant.routeName.Login}
            screenOptions={{ headerShown: false }}
        >
            <NavigationStack.Screen
                name={constant.routeName.Login}
                component={LoginScreen}
            />
        </NavigationStack.Navigator>
    );
};

export default AuthNavigation;