import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import StorageManager, { StorageKey } from '../../managers/StorageManager';
import ApiManager from '../../managers/ApiManager';
import constant from '../../utilities/constant';
import { RiderOrderAssignmentModel, DeliveryPersonModel } from '../../dataModels/models';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

interface StatCard {
    label: string;
    value: string;
    icon: string;
    color: string;
}

interface QuickAction {
    id: number;
    title: string;
    icon: string;
    color: string;
    count?: number;
    onPress: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_RIDER_NAME = 'Rider';

const COLORS = {
    SUCCESS: '#4caf50',
    WARNING: '#ff9800',
    INFO: '#2196f3',
    PURPLE: '#9c27b0',
} as const;

const ICONS = {
    DELIVERIES: '📦',
    PENDING: '⏳',
    TOTAL: '📋',
    COMPLETED: '✅',
    PROFILE: '👤',
    RIDER: '🚴',
    INFO: 'ℹ️',
    ONLINE: '●',
} as const;

const ORDER_STATUS = {
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalizes order status to lowercase
 */
const normalizeStatus = (status?: string): string => {
    return (status || '').toLowerCase();
};

/**
 * Checks if order is pending (not delivered or cancelled)
 */
const isPendingOrder = (order: RiderOrderAssignmentModel): boolean => {
    const status = normalizeStatus(order.status);
    return status !== ORDER_STATUS.DELIVERED && status !== ORDER_STATUS.CANCELLED;
};

/**
 * Checks if order is completed (delivered)
 */
const isCompletedOrder = (order: RiderOrderAssignmentModel): boolean => {
    const status = normalizeStatus(order.status);
    return status === ORDER_STATUS.DELIVERED;
};

/**
 * Calculates pending orders count
 */
const calculatePendingCount = (orders: RiderOrderAssignmentModel[]): number => {
    return orders.filter(isPendingOrder).length;
};

/**
 * Calculates completed orders count
 */
const calculateCompletedCount = (orders: RiderOrderAssignmentModel[]): number => {
    return orders.filter(isCompletedOrder).length;
};

// ============================================================================
// COMPONENT
// ============================================================================

const RiderHomeScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();

    // ========================================================================
    // STATE
    // ========================================================================

    const [riderName, setRiderName] = useState<string>(DEFAULT_RIDER_NAME);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [orders, setOrders] = useState<RiderOrderAssignmentModel[]>([]);
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [completedCount, setCompletedCount] = useState<number>(0);

    // ========================================================================
    // API CALLS
    // ========================================================================

    const loadRiderData = useCallback(async () => {
        try {
            const riderData = await StorageManager.getItem<DeliveryPersonModel>(StorageKey.USER);
            if (riderData?.name) {
                setRiderName(riderData.name);
            }
        } catch (error) {
            console.error('Error loading rider data:', error);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            const token = await StorageManager.getItem(StorageKey.TOKEN);

            const response = await ApiManager.get<RiderOrderAssignmentModel[]>({
                endpoint: constant.apiEndPoints.getOrders,
                token: token || undefined,
                showError: false,
            });

            const ordersData: RiderOrderAssignmentModel[] = (response?.data as RiderOrderAssignmentModel[]) || [];
            setOrders(ordersData);

            // Calculate and update stats
            const pending = calculatePendingCount(ordersData);
            const completed = calculateCompletedCount(ordersData);

            setPendingCount(pending);
            setCompletedCount(completed);
        } catch (error) {
            if (__DEV__) {
                console.log('Error fetching orders on home:', error);
            }
        }
    }, []);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    useFocusEffect(
        useCallback(() => {
            loadRiderData();
            fetchOrders();
        }, [loadRiderData, fetchOrders])
    );

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([loadRiderData(), fetchOrders()]);
        setRefreshing(false);
    }, [loadRiderData, fetchOrders]);

    const navigateToOrders = useCallback(() => {
        navigation.navigate('Orders');
    }, [navigation]);

    const navigateToHistory = useCallback(() => {
        navigation.navigate('History');
    }, [navigation]);

    const navigateToProfile = useCallback(() => {
        navigation.navigate('Profile');
    }, [navigation]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const todayStats: StatCard[] = useMemo(() => [
        {
            label: 'Deliveries',
            value: completedCount.toString(),
            icon: ICONS.DELIVERIES,
            color: COLORS.SUCCESS,
        },
        {
            label: 'Pending',
            value: pendingCount.toString(),
            icon: ICONS.PENDING,
            color: COLORS.WARNING,
        },
        {
            label: 'Total',
            value: orders.length.toString(),
            icon: ICONS.TOTAL,
            color: COLORS.INFO,
        },
    ], [completedCount, pendingCount, orders.length]);

    const quickActions: QuickAction[] = useMemo(() => [
        {
            id: 1,
            title: 'Pending Orders',
            icon: ICONS.TOTAL,
            color: COLORS.WARNING,
            count: pendingCount,
            onPress: navigateToOrders,
        },
        {
            id: 2,
            title: 'Completed',
            icon: ICONS.COMPLETED,
            color: COLORS.SUCCESS,
            count: completedCount,
            onPress: navigateToHistory,
        },
        {
            id: 3,
            title: 'My Profile',
            icon: ICONS.PROFILE,
            color: COLORS.INFO,
            onPress: navigateToProfile,
        },
        {
            id: 4,
            title: 'Orders',
            icon: ICONS.DELIVERIES,
            color: COLORS.PURPLE,
            onPress: navigateToOrders,
        },
    ], [pendingCount, completedCount, navigateToOrders, navigateToHistory, navigateToProfile]);

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <View>
                <Text style={[styles.greeting, { color: colors.white }]}>Hello,</Text>
                <Text style={[styles.riderName, { color: colors.white }]}>
                    {riderName}! {ICONS.RIDER}
                </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: COLORS.SUCCESS }]}>
                <Text style={[styles.statusText, { color: colors.white }]}>
                    {ICONS.ONLINE} Online
                </Text>
            </View>
        </View>
    );

    const renderStatCard = (stat: StatCard, index: number) => (
        <View
            key={index}
            style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}
        >
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textDescription }]}>
                {stat.label}
            </Text>
        </View>
    );

    const renderTodayStats = () => (
        <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Today's Summary
            </Text>
            <View style={styles.statsGrid}>
                {todayStats.map(renderStatCard)}
            </View>
        </View>
    );

    const renderActionCard = (action: QuickAction) => (
        <AppTouchableRipple
            key={action.id}
            style={[styles.actionCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={action.onPress}
        >
            <View>
                <Text style={styles.actionIcon}>{action.icon}</Text>
                {action.count !== undefined && action.count > 0 && (
                    <View style={[styles.actionBadge, { backgroundColor: action.color }]}>
                        <Text style={[styles.badgeText, { color: colors.white }]}>
                            {action.count}
                        </Text>
                    </View>
                )}
            </View>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                {action.title}
            </Text>
        </AppTouchableRipple>
    );

    const renderQuickActions = () => (
        <View style={styles.actionsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Quick Actions
            </Text>
            <View style={styles.actionsGrid}>
                {quickActions.map(renderActionCard)}
            </View>
        </View>
    );

    const renderNoticeBox = () => (
        <View style={[styles.noticeBox, { backgroundColor: colors.themePrimaryLight }]}>
            <Text style={styles.noticeIcon}>{ICONS.INFO}</Text>
            <View style={styles.noticeContent}>
                <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>
                    Payment Mode
                </Text>
                <Text style={[styles.noticeText, { color: colors.textDescription }]}>
                    Currently, only Cash on Delivery (COD) is available for all orders
                </Text>
            </View>
        </View>
    );

    // ========================================================================
    // MAIN RENDER
    // ========================================================================

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.themePrimary]}
                    />
                }
            >
                {renderHeader()}
                {renderTodayStats()}
                {renderQuickActions()}
                {renderNoticeBox()}
            </ScrollView>
        </MainContainer>
    );
};

export default RiderHomeScreen;

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
    },
    riderName: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
    },
    statsContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    statValue: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
    },
    actionsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '48%',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    actionBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.primaryBold,
    },
    actionTitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
        textAlign: 'center',
    },
    noticeBox: {
        marginHorizontal: 20,
        marginBottom: 30,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    noticeIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    noticeContent: {
        flex: 1,
    },
    noticeTitle: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    noticeText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 20,
    },
});