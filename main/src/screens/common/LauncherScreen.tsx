import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';

const LauncherScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            {/* Rider Logo - Use the same path as admin */}
            <Image
                source={require('../../../resources/Images/launcherScreen/Rider.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            {/* App Name */}
            <Text style={styles.title}>GOF Rider</Text>
            <Text style={styles.subtitle}>Delivery Partner App</Text>

            {/* Loader */}
            <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
        </View>
    );
};

export default LauncherScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
});