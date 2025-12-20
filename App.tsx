/**
 * GOF Rider App Entry Point
 * 
 * This file contains the main App component that wraps the application
 * with necessary providers (Theme, Auth, SafeArea).
 * 
 * The app is registered with React Native in index.js
 *
 * @format
 */

import React from 'react';
import NavigationManager from './main/src/navigations/NavigationManager';
import { ThemeProvider } from './main/src/contexts/ThemeProvider';
import { AuthProvider } from './main/src/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';

const App: React.FC = () => {
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

export default App;
