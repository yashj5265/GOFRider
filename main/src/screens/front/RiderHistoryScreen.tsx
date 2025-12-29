import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

interface CompletedOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    amount: number;
    deliveredAt: string;
    date: string;
    earnings: number;
}

type FilterType = 'today' | 'week' | 'month';

interface FilterOption {
    key: FilterType;
    label: string;
}

interface SummaryCard {
    icon: string;
    value: string | number;
    label: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FILTER_OPTIONS: FilterOption[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
];

const SUMMARY_ICONS = {
    DELIVERIES: '📦',
    EARNINGS: '💰',
    COLLECTED: '💵',
} as const;

const BADGE_COLORS = {
    COMPLETED: '#4caf50',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculates total earnings from orders
 */
const calculateTotalEarnings = (orders: CompletedOrder[]): number => {
    return orders.reduce((sum, order) => sum + order.earnings, 0);
};

/**
 * Calculates total amount collected from orders
 */
const calculateTotalCollected = (orders: CompletedOrder[]): number => {
    return orders.reduce((sum, order) => sum + order.amount, 0);
};

/**
 * Formats currency with rupee symbol
 */
const formatCurrency = (amount: number): string => {
    return `₹${amount}`;
};

// ============================================================================
// COMPONENT
// ============================================================================

const RiderHistoryScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();

    // ========================================================================
    // STATE
    // ========================================================================

    const [selectedFilter, setSelectedFilter] = useState<FilterType>('today');
    const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    useEffect(() => {
        // Note: History API endpoint will be implemented in future update
        // For now, showing empty state
        const fetchCompletedOrders = async () => {
            // Future: Fetch completed orders from API based on selectedFilter
            setLoading(false);
        };

        fetchCompletedOrders();
    }, [selectedFilter]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const filteredOrders = useMemo(() => {
        // Future: Filter based on selected filter when API is ready
        return completedOrders;
    }, [completedOrders, selectedFilter]);

    const totalEarnings = useMemo(() => {
        return calculateTotalEarnings(completedOrders);
    }, [completedOrders]);

    const totalDeliveries = useMemo(() => {
        return completedOrders.length;
    }, [completedOrders]);

    const totalCollected = useMemo(() => {
        return calculateTotalCollected(completedOrders);
    }, [completedOrders]);

    const summaryCards: SummaryCard[] = useMemo(() => [
        {
            icon: SUMMARY_ICONS.DELIVERIES,
            value: totalDeliveries,
            label: 'Deliveries',
        },
        {
            icon: SUMMARY_ICONS.EARNINGS,
            value: formatCurrency(totalEarnings),
            label: 'Earnings',
        },
        {
            icon: SUMMARY_ICONS.COLLECTED,
            value: formatCurrency(totalCollected),
            label: 'Collected',
        },
    ], [totalDeliveries, totalEarnings, totalCollected]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleFilterChange = useCallback((filter: FilterType) => {
        setSelectedFilter(filter);
    }, []);

    const handleOrderPress = useCallback((order: CompletedOrder) => {
        // Future: Navigate to order details
        console.log('Order pressed:', order.id);
    }, []);

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    const renderFilterTabs = () => (
        <View style={[styles.filterContainer, { backgroundColor: colors.backgroundSecondary }]}>
            {FILTER_OPTIONS.map((filter) => (
                <TouchableOpacity
                    key={filter.key}
                    style={[
                        styles.filterTab,
                        selectedFilter === filter.key && {
                            backgroundColor: colors.themePrimary,
                        },
                    ]}
                    onPress={() => handleFilterChange(filter.key)}
                >
                    <Text
                        style={[
                            styles.filterText,
                            {
                                color: selectedFilter === filter.key
                                    ? colors.white
                                    : colors.textLabel,
                            },
                        ]}
                    >
                        {filter.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderSummaryCard = (card: SummaryCard, index: number) => (
        <View
            key={index}
            style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}
        >
            <Text style={styles.summaryIcon}>{card.icon}</Text>
            <Text style={[styles.summaryValue, { color: colors.themePrimary }]}>
                {card.value}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textDescription }]}>
                {card.label}
            </Text>
        </View>
    );

    const renderSummaryCards = () => (
        <View style={styles.summaryContainer}>
            {summaryCards.map(renderSummaryCard)}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
                {loading ? '⏳' : '📦'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
                {loading ? 'Loading history...' : 'No delivery history'}
            </Text>
            {!loading && (
                <Text style={[styles.emptySubtext, { color: colors.textDescription }]}>
                    Your completed deliveries will appear here
                </Text>
            )}
        </View>
    );

    const renderOrderCard = (order: CompletedOrder) => (
        <AppTouchableRipple
            key={order.id}
            style={[styles.historyCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => handleOrderPress(order)}
        >
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.orderNumber, { color: colors.themePrimary }]}>
                        #{order.orderNumber}
                    </Text>
                    <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                        {order.customerName}
                    </Text>
                </View>
                <View style={[styles.completedBadge, { backgroundColor: BADGE_COLORS.COMPLETED }]}>
                    <Text style={[styles.badgeText, { color: colors.white }]}>
                        ✓ Delivered
                    </Text>
                </View>
            </View>

            {/* Card Details */}
            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                        🕐 Time:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                        {order.date}, {order.deliveredAt}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                        💵 Amount:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                        {formatCurrency(order.amount)}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                        💰 Earnings:
                    </Text>
                    <Text style={[styles.earningsText, { color: BADGE_COLORS.COMPLETED }]}>
                        +{formatCurrency(order.earnings)}
                    </Text>
                </View>
            </View>
        </AppTouchableRipple>
    );

    const renderHistoryList = () => {
        if (loading || filteredOrders.length === 0) {
            return renderEmptyState();
        }

        return filteredOrders.map(renderOrderCard);
    };

    // ========================================================================
    // MAIN RENDER
    // ========================================================================

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <Text style={[styles.headerTitle, { color: colors.white }]}>
                        Delivery History
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                        Your completed deliveries
                    </Text>
                </View>

                {/* Filter Tabs */}
                {renderFilterTabs()}

                {/* Summary Cards */}
                {renderSummaryCards()}

                {/* History List */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {renderHistoryList()}
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default RiderHistoryScreen;

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
    headerTitle: {
        fontSize: fonts.size.font24,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 4,
        margin: 20,
        borderRadius: 12,
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    filterText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryMedium,
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    summaryCard: {
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
    summaryIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.secondaryRegular,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    historyCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderNumber: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 2,
    },
    customerName: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
    completedBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.primaryBold,
    },
    cardDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
    },
    detailValue: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    earningsText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
    },
});