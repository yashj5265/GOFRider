import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    Platform,
    Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import ApiManager from '../../managers/ApiManager';
import constant from '../../utilities/constant';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import MainContainer from '../../container/MainContainer';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

interface LoginResponse {
    success: boolean;
    message?: string;
    token?: string;
    data?: {
        token?: string;
        rider?: {
            id: number;
            name: string;
            username: string;
            phone?: string;
            vehicle_number?: string;
        };
    };
    rider?: {
        id: number;
        name: string;
        username: string;
        phone?: string;
        vehicle_number?: string;
    };
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const colors = useTheme();
    const { login } = useAuth();

    const handleLogin = async () => {
        // Validation
        if (!username || !password) {
            Alert.alert('Validation Error', 'Please enter both username and password');
            return;
        }

        if (username.length < 3) {
            Alert.alert('Validation Error', 'Username must be at least 3 characters');
            return;
        }

        setLoading(true);

        try {
            console.log('🚴 Attempting rider login with:', username);

            // When API is ready, use this:
            const response: LoginResponse = await ApiManager.post({
                endpoint: constant.apiEndPoints.riderLogin, // Add this to your constants
                params: {
                    username: username.trim(),
                    password: password
                },
            });

            console.log('✅ Rider Login Response:', response);

            if (response?.success || response?.token) {
                const token = response?.token || response?.data?.token;

                if (!token) {
                    Alert.alert('Error', 'Login failed: No authentication token received');
                    setLoading(false);
                    return;
                }

                const riderData = response?.rider || response?.data?.rider;

                // Use AuthContext login function
                await login(token, riderData);

                console.log('✅ Rider login successful!');
                Alert.alert('Success', `Welcome ${riderData?.name || 'Rider'}!`);

            } else {
                console.error('❌ Login failed:', response?.message);
                Alert.alert(
                    'Login Failed',
                    response?.message || 'Invalid credentials. Please check your username and password.'
                );
                setLoading(false);
            }
        } catch (error: any) {
            console.error('❌ Login error:', error);

            let errorMessage = 'Something went wrong. Please try again.';

            if (error.message === 'No internet connection') {
                errorMessage = 'No internet connection. Please check your network and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Error', errorMessage);
            setLoading(false);
        }
    };

    return (
        <MainContainer
            isInternetRequired={true}
            statusBarColor={colors.backgroundPrimary}
            statusBarStyle="dark-content"
            style={{ backgroundColor: colors.backgroundPrimary }}
            showLoader={loading}
        >
            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContainer}
                enableOnAndroid
                extraScrollHeight={Platform.OS === 'ios' ? 80 : 100}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../../resources/Images/launcherScreen/Rider.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.title, { color: colors.themePrimary }]}>
                            GOF Rider Login
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textLabel }]}>
                            Delivery Partner Portal
                        </Text>
                    </View>

                    <View style={{ gap: 20 }}>
                        <AppTextInput
                            label="Username"
                            placeholder="Enter your username"
                            onChangeText={setUsername}
                            value={username}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />

                        <AppTextInput
                            label="Password"
                            placeholder="Enter your password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!loading}
                        />
                    </View>

                    <AppTouchableRipple
                        style={[
                            styles.button,
                            {
                                backgroundColor: loading
                                    ? colors.buttonDisabled
                                    : colors.themePrimary,
                            },
                        ]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={[styles.buttonText, { color: colors.white }]}>
                            {loading ? 'Logging in...' : 'Login as Rider'}
                        </Text>
                    </AppTouchableRipple>

                    {/* Info Box */}
                    <View style={[styles.infoBox, { backgroundColor: colors.themePrimaryLight }]}>
                        <Text style={[styles.infoText, { color: colors.textDescription }]}>
                            🚴 Login credentials are provided by your manager
                        </Text>
                    </View>
                </View>
            </KeyboardAwareScrollView>
        </MainContainer>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        gap: 10,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 16,
    },
    title: {
        fontSize: fonts.size.font24,
        fontFamily: fonts.family.primaryBold,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
    },
    button: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryMedium,
    },
    infoBox: {
        marginTop: 30,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    infoText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
        lineHeight: 20,
    },
});