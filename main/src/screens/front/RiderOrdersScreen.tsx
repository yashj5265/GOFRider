import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, Linking, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

// Order interface matching API response
interface Order {
    id: number;
    order_number?: string;
    order_id?: number;
    customer_name?: string;
    customer_phone?: string;
    address?: string;
    full_address?: string;
    items_count?: number;
    total_amount?: number;
    amount?: number;
    payment_mode?: string;
    status: string;
    created_at?: string;
    assigned_at?: string;
    delivery_person_id?: number;
}

const RiderOrdersScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
    const [confirmationCode, setConfirmationCode] = useState<string>('');
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

    // Load orders when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const fetchOrders = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            
            const response = await ApiManager.get({
                endpoint: constant.apiEndPoints.getOrders,
                token: token || undefined,
                showError: true,
            });

            if (__DEV__) {
                console.log('✅ Orders Response:', response);
            }

            // Handle different response structures
            let ordersData: Order[] = [];
            if (response?.data && Array.isArray(response.data)) {
                ordersData = response.data;
            } else if (response?.orders && Array.isArray(response.orders)) {
                ordersData = response.orders;
            } else if (Array.isArray(response)) {
                ordersData = response;
            }

            setOrders(ordersData);
        } catch (error: any) {
            console.error('❌ Fetch Orders Error:', error);
            setOrders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        fetchOrders(true);
    };

    const getStatusInfo = (status: string) => {
        const statusLower = status?.toLowerCase() || '';
        switch (statusLower) {
            case 'assigned':
            case 'pending':
                return { label: 'Assigned', color: '#ff9800', action: 'Mark as Picked', nextStatus: 'picked' };
            case 'picked':
            case 'picked_up':
                return { label: 'Picked Up', color: '#2196f3', action: 'Start Delivery', nextStatus: 'delivering' };
            case 'delivering':
            case 'out_for_delivery':
                return { label: 'Delivering', color: '#9c27b0', action: 'Complete Delivery', nextStatus: 'delivered' };
            case 'delivered':
                return { label: 'Delivered', color: '#4caf50', action: 'Completed', nextStatus: null };
            default:
                return { label: status || 'Unknown', color: colors.textLabel, action: 'View', nextStatus: null };
        }
    };

    const updateOrderStatus = async (order: Order, newStatus: string) => {
        if (updatingOrderId === order.id) return;

        setUpdatingOrderId(order.id);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.post({
                endpoint: constant.apiEndPoints.updateStatus,
                params: {
                    order_id: order.id,
                    status: newStatus,
                },
                token: token || undefined,
                showError: true,
                showSuccess: true,
            });

            if (__DEV__) {
                console.log('✅ Status Update Response:', response);
            }

            Alert.alert('Success', `Order status updated to ${newStatus}`);
            // Refresh orders list
            await fetchOrders(true);
        } catch (error: any) {
            console.error('❌ Update Status Error:', error);
            Alert.alert('Error', error.message || 'Failed to update order status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleOrderAction = (order: Order) => {
        const statusInfo = getStatusInfo(order.status);

        if (!statusInfo.nextStatus) {
            Alert.alert('Info', 'This order is already completed.');
            return;
        }

        const orderNumber = order.order_number || order.order_id || `#${order.id}`;
        const customerName = order.customer_name || 'Customer';

        // If completing delivery, show confirmation code modal
        if (statusInfo.nextStatus === 'delivered') {
            setCurrentOrder(order);
            setConfirmationCode('');
            setShowConfirmationModal(true);
        } else {
            Alert.alert(
                statusInfo.action,
                `Order ${orderNumber} - ${customerName}\n\nAre you sure you want to proceed?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Confirm',
                        onPress: () => updateOrderStatus(order, statusInfo.nextStatus!),
                    },
                ]
            );
        }
    };

    const handleCallCustomer = (phone: string) => {
        if (!phone) {
            Alert.alert('Error', 'Phone number not available');
            return;
        }

        const phoneNumber = phone.replace(/[^0-9]/g, ''); // Remove non-numeric characters
        const phoneUrl = `tel:${phoneNumber}`;

        Linking.canOpenURL(phoneUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(phoneUrl);
                } else {
                    Alert.alert('Error', 'Phone calls are not supported on this device');
                }
            })
            .catch((err) => {
                console.error('Error opening phone:', err);
                Alert.alert('Error', 'Failed to open phone dialer');
            });
    };

    const formatOrderNumber = (order: Order): string => {
        return order.order_number || `ORD${order.id}` || `#${order.id}`;
    };

    const formatAddress = (order: Order): string => {
        return order.full_address || order.address || 'Address not available';
    };

    const formatAmount = (order: Order): number => {
        return order.total_amount || order.amount || 0;
    };

    const formatItemsCount = (order: Order): number => {
        return order.items_count || 0;
    };

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
            showLoader={loading && orders.length === 0}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <Text style={[styles.headerTitle, { color: colors.white }]}>
                        My Orders
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: colors.white }]}>
                        <Text style={[styles.countText, { color: colors.themePrimary }]}>
                            {orders.length}
                        </Text>
                    </View>
                </View>

                {/* Orders List */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.themePrimary]}
                        />
                    }
                >
                    {loading && orders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>⏳</Text>
                            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
                                Loading orders...
                            </Text>
                        </View>
                    ) : orders.length === 0 ? (
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
                        orders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            const orderNumber = formatOrderNumber(order);
                            const customerName = order.customer_name || 'Customer';
                            const customerPhone = order.customer_phone || '';
                            const address = formatAddress(order);
                            const amount = formatAmount(order);
                            const itemsCount = formatItemsCount(order);
                            const isUpdating = updatingOrderId === order.id;

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
                                                {orderNumber}
                                            </Text>
                                            {order.assigned_at && (
                                                <Text style={[styles.assignedTime, { color: colors.textLabel }]}>
                                                    Assigned: {new Date(order.assigned_at).toLocaleString()}
                                                </Text>
                                            )}
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
                                                {customerName}
                                            </Text>
                                        </View>

                                        {customerPhone && (
                                            <View style={styles.infoRow}>
                                                <Text style={styles.infoIcon}>📞</Text>
                                                <Text style={[styles.phoneText, { color: colors.textPrimary }]}>
                                                    {customerPhone}
                                                </Text>
                                                <AppTouchableRipple
                                                    style={[styles.callButton, { backgroundColor: colors.themePrimary }]}
                                                    onPress={() => handleCallCustomer(customerPhone)}
                                                >
                                                    <Text style={[styles.callButtonText, { color: colors.white }]}>
                                                        Call
                                                    </Text>
                                                </AppTouchableRipple>
                                            </View>
                                        )}

                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoIcon}>📍</Text>
                                            <Text style={[styles.addressText, { color: colors.textDescription }]}>
                                                {address}
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
                                                {itemsCount}
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
                                                ₹{amount}
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
                                                    {order.payment_mode || 'COD'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Action Button */}
                                    {statusInfo.nextStatus && (
                                        <AppTouchableRipple
                                            style={[
                                                styles.actionButton,
                                                {
                                                    backgroundColor: isUpdating
                                                        ? colors.buttonDisabled
                                                        : statusInfo.color,
                                                },
                                            ]}
                                            onPress={() => handleOrderAction(order)}
                                            disabled={isUpdating}
                                        >
                                            <Text style={[styles.actionButtonText, { color: colors.white }]}>
                                                {isUpdating ? 'Updating...' : statusInfo.action}
                                            </Text>
                                        </AppTouchableRipple>
                                    )}
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        padding: 20,
    },
    orderInfoBox: {
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    orderInfoText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 4,
    },
    modalLabel: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
        marginBottom: 12,
    },
    confirmationInput: {
        borderWidth: 1.5,
        borderRadius: 10,
        padding: 16,
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
        textAlign: 'center',
        letterSpacing: 8,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
    },
    modalConfirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalConfirmText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
    },
});