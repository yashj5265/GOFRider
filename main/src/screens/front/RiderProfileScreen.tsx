import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import StorageManager from '../../managers/StorageManager';
import ApiManager from '../../managers/ApiManager';
import constant from '../../utilities/constant';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

const RiderProfileScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();
    const { logout } = useAuth();
    const [riderName, setRiderName] = useState<string>('Rider');
    const [username, setUsername] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [vehicleNumber, setVehicleNumber] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadRiderData();
    }, []);

    const loadRiderData = async () => {
        try {
            const riderData = await StorageManager.getItem(constant.shareInstanceKey.userData);
            if (riderData && typeof riderData === 'object') {
                if ('name' in riderData) setRiderName(riderData.name || 'Rider');
                if ('username' in riderData) setUsername(riderData.username || '');
                if ('phone' in riderData) setPhone(riderData.phone || '');
                if ('vehicle_number' in riderData) setVehicleNumber(riderData.vehicle_number || '');
            }
        } catch (error) {
            console.error('Error loading rider data:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: performLogout,
            },
        ]);
    };

    const performLogout = async () => {
        setLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            if (token) {
                try {
                    await ApiManager.post({
                        endpoint: constant.apiEndPoints.riderLogout,
                        token: token,
                    });
                } catch (apiError) {
                    console.log('Logout API error (continuing anyway):', apiError);
                }
            }
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
            setLoading(false);
        }
    };

    const menuSections = [
        {
            title: 'Account',
            items: [
                { id: 1, label: 'Edit Profile', icon: '✏️', route: 'EditProfile' },
                { id: 2, label: 'Change Password', icon: '🔒', route: 'ChangePassword' },
            ],
        },
        {
            title: 'Delivery',
            items: [
                { id: 3, label: 'Earnings Report', icon: '💰', route: 'Earnings' },
                { id: 4, label: 'Delivery Stats', icon: '📊', route: 'Stats' },
            ],
        },
        {
            title: 'Support',
            items: [
                { id: 5, label: 'Help & Support', icon: '❓', route: 'Support' },
                { id: 6, label: 'About', icon: 'ℹ️', route: 'About' },
            ],
        },
    ];

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
            showLoader={loading}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <View style={styles.profileSection}>
                        <View style={[styles.avatar, { backgroundColor: colors.white }]}>
                            <Text style={[styles.avatarText, { color: colors.themePrimary }]}>
                                {riderName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.riderName, { color: colors.white }]}>
                                {riderName}
                            </Text>
                            <Text style={[styles.username, { color: colors.white }]}>
                                @{username}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Profile Details Card */}
                <View style={styles.detailsCardContainer}>
                    <View style={[styles.detailsCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>📞</Text>
                            <View style={styles.detailText}>
                                <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                                    Phone Number
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                                    {phone || 'Not provided'}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>🏍️</Text>
                            <View style={styles.detailText}>
                                <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                                    Vehicle Number
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                                    {vehicleNumber || 'Not provided'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {menuSections.map((section, sectionIndex) => (
                        <View key={sectionIndex} style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>
                                {section.title}
                            </Text>

                            <View
                                style={[
                                    styles.sectionCard,
                                    { backgroundColor: colors.backgroundSecondary },
                                ]}
                            >
                                {section.items.map((item, index) => (
                                    <View key={item.id}>
                                        <AppTouchableRipple
                                            style={styles.menuItem}
                                            onPress={() => console.log('Navigate to:', item.route)}
                                        >
                                            <View style={styles.menuItemLeft}>
                                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                                <Text
                                                    style={[
                                                        styles.menuLabel,
                                                        { color: colors.textPrimary },
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </View>
                                            <Text style={styles.menuArrow}>›</Text>
                                        </AppTouchableRipple>

                                        {index < section.items.length - 1 && (
                                            <View
                                                style={[styles.menuDivider, { backgroundColor: colors.border }]}
                                            />
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Logout Button */}
                    <AppTouchableRipple
                        style={[
                            styles.logoutButton,
                            {
                                backgroundColor: loading ? colors.buttonDisabled : '#ff4444',
                            },
                        ]}
                        onPress={handleLogout}
                        disabled={loading}
                    >
                        <Text style={[styles.logoutText, { color: colors.white }]}>
                            {loading ? 'Logging out...' : '🚪 Logout'}
                        </Text>
                    </AppTouchableRipple>

                    {/* Version Info */}
                    <Text style={[styles.versionText, { color: colors.textLabel }]}>
                        GOF Rider v1.0.0
                    </Text>
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default RiderProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: fonts.size.font30,
        fontFamily: fonts.family.primaryBold,
    },
    profileInfo: {
        flex: 1,
    },
    riderName: {
        fontSize: fonts.size.font22,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    username: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
    },
    detailsCardContainer: {
        paddingHorizontal: 20,
        marginTop: -20,
        marginBottom: 20,
    },
    detailsCard: {
        borderRadius: 16,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailIcon: {
        fontSize: 24,
        marginRight: 16,
        width: 32,
    },
    detailText: {
        flex: 1,
    },
    detailLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryMedium,
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    sectionCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIcon: {
        fontSize: 22,
        marginRight: 16,
        width: 28,
    },
    menuLabel: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.secondaryRegular,
    },
    menuArrow: {
        fontSize: 28,
        color: '#999',
    },
    menuDivider: {
        height: 1,
        marginLeft: 60,
    },
    logoutButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    logoutText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    versionText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
        marginBottom: 20,
    },
});