import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import AppTextInput from '../../components/AppTextInput';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

// Dummy order interface - replace with API types
interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    address: string;
    items: number;
    amount: number;
    paymentMode: 'COD';
    status: 'assigned' | 'picked' | 'delivering';
    assignedTime: string;
}

const RiderOrdersScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();
    const [confirmationCode, setConfirmationCode] = useState('');

    // Dummy data - Replace with API call
    const pendingOrders: Order[] = [
        {
            id: '1',
            orderNumber: 'ORD001',
            customerName: 'Rahul Sharma',
            customerPhone: '+91 98765 43210',
            address: '123, MG Road, Indore, MP - 452001',
            items: 3,
            amount: 450,
            paymentMode: 'COD',
            status: 'assigned',
            assignedTime: '10 mins ago',
        },
        {
            id: '2',
            orderNumber: 'ORD002',
            customerName: 'Priya Patel',
            customerPhone: '+91 98765 43211',
            address: '456, AB Road, Indore, MP - 452002',
            items: 5,
            amount: 780,
            paymentMode: 'COD',
            status: 'picked',
            assignedTime: '25 mins ago',
        },
    ];

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'assigned':
                return { label: 'New', color: '#ff9800', action: 'Accept Order' };
            case 'picked':
                return { label: 'Picked Up', color: '#2196f3', action: 'Start Delivery' };
            case 'delivering':
                return { label: 'Delivering', color: '#9c27b0', action: 'Complete Delivery' };
            default:
                return { label: 'Unknown', color: colors.textLabel, action: 'View' };
        }
    };

    const handleOrderAction = (order: Order) => {
        const statusInfo = getStatusInfo(order.status);

        if (order.status === 'delivering') {
            // Show confirmation code dialog
            Alert.prompt(
                'Complete Delivery',
                `Enter the confirmation code from ${order.customerName}`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Confirm',
                        onPress: (code) => handleConfirmDelivery(order, code || ''),
                    },
                ],
                'plain-text',
                '',
                'numeric'
            );
        } else {
            // Show confirmation for other actions
            Alert.alert(
                statusInfo.action,
                `Order #${order.orderNumber} - ${order.customerName}`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: statusInfo.action,
                        onPress: () => {
                            console.log(`${statusInfo.action} for order:`, order.id);
                            // TODO: Call API to update order status
                            Alert.alert('Success', `Order ${statusInfo.action.toLowerCase()} successfully!`);
                        },
                    },
                ]
            );
        }
    };

    const handleConfirmDelivery = (order: Order, code: string) => {
        if (!code || code.length < 4) {
            Alert.alert('Error', 'Please enter a valid confirmation code');
            return;
        }

        // TODO: Verify code with API
        console.log('Confirming delivery with code:', code);
        Alert.alert(
            'Delivery Completed',
            `Order #${order.orderNumber} has been delivered successfully!\n\nAmount Collected: ₹${order.amount} (COD)`
        );
    };

    const handleCallCustomer = (phone: string) => {
        console.log('Calling customer:', phone);
        // TODO: Implement phone call using Linking
        Alert.alert('Call Customer', phone);
    };

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
                        My Orders
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: colors.white }]}>
                        <Text style={[styles.countText, { color: colors.themePrimary }]}>
                            {pendingOrders.length}
                        </Text>
                    </View>
                </View>

                {/* Orders List */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {pendingOrders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📦</Text>
                            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
                                No pending orders
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.textDescription }]}>
                                New orders will appear here
                            </Text>
                        </View>
                    ) : (
                        pendingOrders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            return (
                                <View
                                    key={order.id}
                                    style={[
                                        styles.orderCard,
                                        { backgroundColor: colors.backgroundSecondary },
                                    ]}
                                >
                                    {/* Order Header */}
                                    <View style={styles.orderHeader}>
                                        <View>
                                            <Text style={[styles.orderNumber, { color: colors.themePrimary }]}>
                                                #{order.orderNumber}
                                            </Text>
                                            <Text style={[styles.assignedTime, { color: colors.textLabel }]}>
                                                {order.assignedTime}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: statusInfo.color + '20' },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    { color: statusInfo.color },
                                                ]}
                                            >
                                                {statusInfo.label}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Customer Info */}
                                    <View style={styles.customerSection}>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoIcon}>👤</Text>
                                            <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                                                {order.customerName}
                                            </Text>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoIcon}>📞</Text>
                                            <Text style={[styles.phoneText, { color: colors.textPrimary }]}>
                                                {order.customerPhone}
                                            </Text>
                                            <AppTouchableRipple
                                                style={[styles.callButton, { backgroundColor: colors.themePrimary }]}
                                                onPress={() => handleCallCustomer(order.customerPhone)}
                                            >
                                                <Text style={[styles.callButtonText, { color: colors.white }]}>
                                                    Call
                                                </Text>
                                            </AppTouchableRipple>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoIcon}>📍</Text>
                                            <Text style={[styles.addressText, { color: colors.textDescription }]}>
                                                {order.address}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Order Details */}
                                    <View style={[styles.detailsSection, { borderTopColor: colors.border }]}>
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                                                Items:
                                            </Text>
                                            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                                                {order.items}
                                            </Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                                                Amount:
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.amountText,
                                                    { color: colors.themePrimary },
                                                ]}
                                            >
                                                ₹{order.amount}
                                            </Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                                                Payment:
                                            </Text>
                                            <View
                                                style={[
                                                    styles.codBadge,
                                                    { backgroundColor: '#ff9800' },
                                                ]}
                                            >
                                                <Text style={[styles.codText, { color: colors.white }]}>
                                                    {order.paymentMode}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Action Button */}
                                    <AppTouchableRipple
                                        style={[
                                            styles.actionButton,
                                            { backgroundColor: statusInfo.color },
                                        ]}
                                        onPress={() => handleOrderAction(order)}
                                    >
                                        <Text style={[styles.actionButtonText, { color: colors.white }]}>
                                            {statusInfo.action}
                                        </Text>
                                    </AppTouchableRipple>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default RiderOrdersScreen;

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
    headerTitle: {
        fontSize: fonts.size.font24,
        fontFamily: fonts.family.primaryBold,
    },
    countBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countText: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
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
    },
    orderCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderNumber: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 2,
    },
    assignedTime: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
    },
    customerSection: {
        marginBottom: 16,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        fontSize: 18,
        marginRight: 10,
        width: 24,
    },
    customerName: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryMedium,
        flex: 1,
    },
    phoneText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        flex: 1,
    },
    callButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    callButtonText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
    },
    addressText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        flex: 1,
        lineHeight: 20,
    },
    detailsSection: {
        borderTopWidth: 1,
        paddingTop: 16,
        marginBottom: 16,
        gap: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
    detailValue: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    amountText: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    codBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    codText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
    },
    actionButton: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
    },
});