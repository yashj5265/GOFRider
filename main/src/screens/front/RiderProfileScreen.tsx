import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import StorageManager, { StorageKey } from '../../managers/StorageManager';
import ApiManager from '../../managers/ApiManager';
import constant from '../../utilities/constant';
import { DeliveryPersonModel } from '../../dataModels/models';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

interface MenuItem {
    id: number;
    label: string;
    icon: string;
    route: string;
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

interface ProfileDetail {
    icon: string;
    label: string;
    value: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_VALUES = {
    RIDER_NAME: 'Rider',
    EMPTY_STRING: '',
    NOT_PROVIDED: 'Not provided',
} as const;

const ICONS = {
    PHONE: '📞',
    VEHICLE: '🏍️',
    EDIT: '✏️',
    PASSWORD: '🔒',
    EARNINGS: '💰',
    STATS: '📊',
    HELP: '❓',
    INFO: 'ℹ️',
    LOGOUT: '🚪',
    ARROW: '›',
} as const;

const ALERT_MESSAGES = {
    LOGOUT_TITLE: 'Logout',
    LOGOUT_MESSAGE: 'Are you sure you want to logout?',
    LOGOUT_ERROR: 'Failed to logout. Please try again.',
    CANCEL: 'Cancel',
    LOGOUT: 'Logout',
} as const;

const APP_VERSION = 'v1.0.0';
const APP_NAME = 'GOF Rider';

const LOGOUT_BUTTON_COLOR = '#ff4444';

// ============================================================================
// MENU CONFIGURATION
// ============================================================================

const MENU_SECTIONS: MenuSection[] = [
    {
        title: 'Account',
        items: [
            { id: 1, label: 'Edit Profile', icon: ICONS.EDIT, route: 'EditProfile' },
            { id: 2, label: 'Change Password', icon: ICONS.PASSWORD, route: 'ChangePassword' },
        ],
    },
    {
        title: 'Delivery',
        items: [
            { id: 3, label: 'Earnings Report', icon: ICONS.EARNINGS, route: 'Earnings' },
            { id: 4, label: 'Delivery Stats', icon: ICONS.STATS, route: 'Stats' },
        ],
    },
    {
        title: 'Support',
        items: [
            { id: 5, label: 'Help & Support', icon: ICONS.HELP, route: 'Support' },
            { id: 6, label: 'About', icon: ICONS.INFO, route: 'About' },
        ],
    },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extracts rider data from storage model
 */
const extractRiderData = (riderData: DeliveryPersonModel | null) => {
    if (!riderData) {
        return {
            name: DEFAULT_VALUES.RIDER_NAME,
            email: DEFAULT_VALUES.EMPTY_STRING,
            phone: DEFAULT_VALUES.EMPTY_STRING,
            vehicleNumber: DEFAULT_VALUES.EMPTY_STRING,
        };
    }

    return {
        name: riderData.name || DEFAULT_VALUES.RIDER_NAME,
        email: riderData.email || DEFAULT_VALUES.EMPTY_STRING,
        phone: riderData.phone || DEFAULT_VALUES.EMPTY_STRING,
        // Note: vehicle_number is not in the API response model, keeping for backward compatibility
        vehicleNumber: 'vehicle_number' in riderData ? (riderData as any).vehicle_number || DEFAULT_VALUES.EMPTY_STRING : DEFAULT_VALUES.EMPTY_STRING,
    };
};

/**
 * Gets the first letter of name for avatar
 */
const getAvatarLetter = (name: string): string => {
    return name.charAt(0).toUpperCase();
};

/**
 * Formats version string
 */
const getVersionString = (): string => {
    return `${APP_NAME} ${APP_VERSION}`;
};

// ============================================================================
// COMPONENT
// ============================================================================

const RiderProfileScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();
    const { logout } = useAuth();

    // ========================================================================
    // STATE
    // ========================================================================

    const [riderName, setRiderName] = useState<string>(DEFAULT_VALUES.RIDER_NAME);
    const [username, setUsername] = useState<string>(DEFAULT_VALUES.EMPTY_STRING);
    const [phone, setPhone] = useState<string>(DEFAULT_VALUES.EMPTY_STRING);
    const [vehicleNumber, setVehicleNumber] = useState<string>(DEFAULT_VALUES.EMPTY_STRING);
    const [loading, setLoading] = useState<boolean>(false);

    // ========================================================================
    // API CALLS
    // ========================================================================

    const loadRiderData = useCallback(async () => {
        try {
            const riderData = await StorageManager.getItem<DeliveryPersonModel>(StorageKey.USER);
            const extractedData = extractRiderData(riderData);

            setRiderName(extractedData.name);
            setUsername(extractedData.email);
            setPhone(extractedData.phone);
            setVehicleNumber(extractedData.vehicleNumber);
        } catch (error) {
            console.error('Error loading rider data:', error);
        }
    }, []);

    const performLogout = useCallback(async () => {
        setLoading(true);
        try {
            const token = await StorageManager.getItem(StorageKey.TOKEN);

            if (token) {
                try {
                    await ApiManager.post({
                        endpoint: constant.apiEndPoints.riderLogout,
                        token,
                    });
                } catch (apiError) {
                    console.log('Logout API error (continuing anyway):', apiError);
                }
            }

            await logout();
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', ALERT_MESSAGES.LOGOUT_ERROR);
            setLoading(false);
        }
    }, [logout]);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    useEffect(() => {
        loadRiderData();
    }, [loadRiderData]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleLogout = useCallback(() => {
        Alert.alert(
            ALERT_MESSAGES.LOGOUT_TITLE,
            ALERT_MESSAGES.LOGOUT_MESSAGE,
            [
                { text: ALERT_MESSAGES.CANCEL, style: 'cancel' },
                {
                    text: ALERT_MESSAGES.LOGOUT,
                    style: 'destructive',
                    onPress: performLogout,
                },
            ]
        );
    }, [performLogout]);

    const handleMenuItemPress = useCallback((route: string) => {
        // Future: Implement navigation for other routes
        if (__DEV__) {
            console.log('Navigate to:', route);
        }
    }, []);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const profileDetails: ProfileDetail[] = useMemo(() => [
        {
            icon: ICONS.PHONE,
            label: 'Phone Number',
            value: phone || DEFAULT_VALUES.NOT_PROVIDED,
        },
        {
            icon: ICONS.VEHICLE,
            label: 'Vehicle Number',
            value: vehicleNumber || DEFAULT_VALUES.NOT_PROVIDED,
        },
    ], [phone, vehicleNumber]);

    const avatarLetter = useMemo(() => getAvatarLetter(riderName), [riderName]);
    const versionString = useMemo(() => getVersionString(), []);
    const logoutButtonColor = loading ? colors.buttonDisabled : LOGOUT_BUTTON_COLOR;
    const logoutButtonText = loading ? 'Logging out...' : `${ICONS.LOGOUT} Logout`;

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <View style={styles.profileSection}>
                <View style={[styles.avatar, { backgroundColor: colors.white }]}>
                    <Text style={[styles.avatarText, { color: colors.themePrimary }]}>
                        {avatarLetter}
                    </Text>
                </View>
                <View style={styles.profileInfo}>
                    <Text style={[styles.riderName, { color: colors.white }]}>
                        {riderName}
                    </Text>
                    <Text style={[styles.username, { color: colors.white }]}>
                        {username}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderProfileDetail = (detail: ProfileDetail, isLast: boolean) => (
        <React.Fragment key={detail.label}>
            <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>{detail.icon}</Text>
                <View style={styles.detailText}>
                    <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                        {detail.label}
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                        {detail.value}
                    </Text>
                </View>
            </View>
            {!isLast && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
        </React.Fragment>
    );

    const renderDetailsCard = () => (
        <View style={styles.detailsCardContainer}>
            <View style={[styles.detailsCard, { backgroundColor: colors.backgroundSecondary }]}>
                {profileDetails.map((detail, index) =>
                    renderProfileDetail(detail, index === profileDetails.length - 1)
                )}
            </View>
        </View>
    );

    const renderMenuItem = (item: MenuItem, isLast: boolean) => (
        <View key={item.id}>
            <AppTouchableRipple
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.route)}
            >
                <View style={styles.menuItemLeft}>
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                        {item.label}
                    </Text>
                </View>
                <Text style={styles.menuArrow}>{ICONS.ARROW}</Text>
            </AppTouchableRipple>
            {!isLast && (
                <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            )}
        </View>
    );

    const renderMenuSection = (section: MenuSection, index: number) => (
        <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>
                {section.title}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.backgroundSecondary }]}>
                {section.items.map((item, itemIndex) =>
                    renderMenuItem(item, itemIndex === section.items.length - 1)
                )}
            </View>
        </View>
    );

    const renderLogoutButton = () => (
        <AppTouchableRipple
            style={[styles.logoutButton, { backgroundColor: logoutButtonColor }]}
            onPress={handleLogout}
            disabled={loading}
        >
            <Text style={[styles.logoutText, { color: colors.white }]}>
                {logoutButtonText}
            </Text>
        </AppTouchableRipple>
    );

    const renderVersionInfo = () => (
        <Text style={[styles.versionText, { color: colors.textLabel }]}>
            {versionString}
        </Text>
    );

    // ========================================================================
    // MAIN RENDER
    // ========================================================================

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
            showLoader={loading}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {renderHeader()}
                {renderDetailsCard()}

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {MENU_SECTIONS.map(renderMenuSection)}
                    {renderLogoutButton()}
                    {renderVersionInfo()}
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default RiderProfileScreen;

// ============================================================================
// STYLES
// ============================================================================

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