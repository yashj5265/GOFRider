/**
 * @format
 * GOF Rider App - Entry Point
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import NavigationManager from './main/src/navigations/NavigationManager';
import { ThemeProvider } from './main/src/contexts/ThemeProvider';
import { AuthProvider } from './main/src/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const RiderApp = () => {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <NavigationManager />
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
};

AppRegistry.registerComponent(appName, () => RiderApp);