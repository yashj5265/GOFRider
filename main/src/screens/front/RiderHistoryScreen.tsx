import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';

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

const RiderHistoryScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();
    const [selectedFilter, setSelectedFilter] = useState<'today' | 'week' | 'month'>('today');

    // Dummy data - Replace with API
    const completedOrders: CompletedOrder[] = [
        {
            id: '1',
            orderNumber: 'ORD005',
            customerName: 'Sneha Reddy',
            amount: 620,
            deliveredAt: '2:30 PM',
            date: 'Today',
            earnings: 50,
        },
        {
            id: '2',
            orderNumber: 'ORD004',
            customerName: 'Vikram Singh',
            amount: 890,
            deliveredAt: '11:45 AM',
            date: 'Today',
            earnings: 60,
        },
        {
            id: '3',
            orderNumber: 'ORD003',
            customerName: 'Amit Kumar',
            amount: 320,
            deliveredAt: '9:20 AM',
            date: 'Today',
            earnings: 40,
        },
        {
            id: '4',
            orderNumber: 'ORD002',
            customerName: 'Priya Patel',
            amount: 780,
            deliveredAt: '6:15 PM',
            date: 'Yesterday',
            earnings: 55,
        },
    ];

    const getFilteredOrders = () => {
        // TODO: Filter based on selected filter when API is ready
        return completedOrders;
    };

    const totalEarnings = completedOrders.reduce((sum, order) => sum + order.earnings, 0);
    const totalDeliveries = completedOrders.length;
    const totalCollected = completedOrders.reduce((sum, order) => sum + order.amount, 0);

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
                <View style={[styles.filterContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    {(['today', 'week', 'month'] as const).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterTab,
                                selectedFilter === filter && {
                                    backgroundColor: colors.themePrimary,
                                },
                            ]}
                            onPress={() => setSelectedFilter(filter)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    {
                                        color: selectedFilter === filter
                                            ? colors.white
                                            : colors.textLabel,
                                    },
                                ]}
                            >
                                {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={styles.summaryIcon}>📦</Text>
                        <Text style={[styles.summaryValue, { color: colors.themePrimary }]}>
                            {totalDeliveries}
                        </Text>
                        <Text style={[styles.summaryLabel, { color: colors.textDescription }]}>
                            Deliveries
                        </Text>
                    </View>

                    <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={styles.summaryIcon}>💰</Text>
                        <Text style={[styles.summaryValue, { color: colors.themePrimary }]}>
                            ₹{totalEarnings}
                        </Text>
                        <Text style={[styles.summaryLabel, { color: colors.textDescription }]}>
                            Earnings
                        </Text>
                    </View>

                    <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={styles.summaryIcon}>💵</Text>
                        <Text style={[styles.summaryValue, { color: colors.themePrimary }]}>
                            ₹{totalCollected}
                        </Text>
                        <Text style={[styles.summaryLabel, { color: colors.textDescription }]}>
                            Collected
                        </Text>
                    </View>
                </View>

                {/* History List */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {getFilteredOrders().map((order) => (
                        <AppTouchableRipple
                            key={order.id}
                            style={[styles.historyCard, { backgroundColor: colors.backgroundSecondary }]}
                            onPress={() => console.log('View order details:', order.id)}
                        >
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={[styles.orderNumber, { color: colors.themePrimary }]}>
                                        #{order.orderNumber}
                                    </Text>
                                    <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                                        {order.customerName}
                                    </Text>
                                </View>
                                <View style={[styles.completedBadge, { backgroundColor: '#4caf50' }]}>
                                    <Text style={[styles.badgeText, { color: colors.white }]}>
                                        ✓ Delivered
                                    </Text>
                                </View>
                            </View>

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
                                        ₹{order.amount}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                                        💰 Earnings:
                                    </Text>
                                    <Text style={[styles.earningsText, { color: '#4caf50' }]}>
                                        +₹{order.earnings}
                                    </Text>
                                </View>
                            </View>
                        </AppTouchableRipple>
                    ))}
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default RiderHistoryScreen;

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
});