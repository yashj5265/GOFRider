import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, Linking, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager, { StorageKey } from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import { RiderOrderAssignmentModel } from '../../dataModels/models';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

interface StatusInfo {
    label: string;
    color: string;
    action: string;
    nextStatus: string | null;
}

interface TextSelection {
    start: number;
    end: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OTP_LENGTH = 4;
const OTP_INPUT_FOCUS_DELAY = 300;

const STATUS_MAP: Record<string, StatusInfo> = {
    assigned: { label: 'Assigned', color: '#ff9800', action: 'Mark as Picked', nextStatus: 'picked' },
    pending: { label: 'Assigned', color: '#ff9800', action: 'Mark as Picked', nextStatus: 'picked' },
    picked: { label: 'Picked Up', color: '#2196f3', action: 'Start Delivery', nextStatus: 'delivering' },
    picked_up: { label: 'Picked Up', color: '#2196f3', action: 'Start Delivery', nextStatus: 'delivering' },
    delivering: { label: 'Delivering', color: '#9c27b0', action: 'Complete Delivery', nextStatus: 'delivered' },
    out_for_delivery: { label: 'Delivering', color: '#9c27b0', action: 'Complete Delivery', nextStatus: 'delivered' },
    delivered: { label: 'Delivered', color: '#4caf50', action: 'Completed', nextStatus: null },
};

const CANCELLABLE_STATUSES = ['delivering'] as const;
const NON_CANCELLABLE_STATUSES = ['delivered', 'cancelled'] as const;

const ALERT_MESSAGES = {
    ORDER_COMPLETED: 'This order is already completed.',
    ORDER_NOT_CANCELLABLE: 'This order cannot be cancelled.',
    PHONE_NOT_AVAILABLE: 'Phone number not available',
    PHONE_NOT_SUPPORTED: 'Phone calls are not supported on this device',
    PHONE_DIALER_FAILED: 'Failed to open phone dialer',
    OTP_VALIDATION: `Please enter a ${OTP_LENGTH}-digit OTP code`,
    STATUS_UPDATE_SUCCESS: (status: string) => `Order status updated to ${status}`,
    STATUS_UPDATE_FAILED: 'Failed to update order status',
    OTP_VERIFICATION_SUCCESS: 'Delivery completed successfully!',
    OTP_VERIFICATION_FAILED: 'Invalid OTP. Please try again.',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusInfo = (status: string, fallbackColor: string): StatusInfo => {
    const statusKey = status?.toLowerCase() || '';
    return STATUS_MAP[statusKey] || {
        label: status || 'Unknown',
        color: fallbackColor,
        action: 'View',
        nextStatus: null,
    };
};

const formatOrderNumber = (order: RiderOrderAssignmentModel): string => {
    return order.order.order_code || `ORD${order.order.id}`;
};

const formatAddress = (order: RiderOrderAssignmentModel): string => {
    const addr = order.order.address;
    if (!addr) return 'Address not available';

    const parts = [addr.address, addr.city, addr.state, addr.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
};

const formatAmount = (order: RiderOrderAssignmentModel): number => {
    return parseFloat(order.order.total_amount) || 0;
};

const formatItemsCount = (order: RiderOrderAssignmentModel): number => {
    return order.order.items?.length || 0;
};

const sanitizePhoneNumber = (phone: string): string => {
    return phone.replace(/[^0-9]/g, '');
};

const getOrderStatus = (order: RiderOrderAssignmentModel): string => {
    return order.order?.status || order.status;
};

const getCustomerInfo = (order: RiderOrderAssignmentModel) => {
    return {
        name: order.order.address?.full_name || 'Customer',
        phone: order.order.address?.phone || '',
    };
};

const canCancelOrder = (orderStatus: string): boolean => {
    const statusLower = orderStatus?.toLowerCase() || '';
    return !NON_CANCELLABLE_STATUSES.includes(statusLower as any);
};

const shouldShowCancelButton = (statusLabel: string): boolean => {
    return CANCELLABLE_STATUSES.some(status =>
        STATUS_MAP[status]?.label === statusLabel
    );
};

// ============================================================================
// COMPONENT
// ============================================================================

const RiderOrdersScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();
    const otpInputRef = useRef<TextInput>(null);

    // ========================================================================
    // STATE
    // ========================================================================

    const [orders, setOrders] = useState<RiderOrderAssignmentModel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
    const [confirmationCode, setConfirmationCode] = useState<string>('');
    const [currentOrder, setCurrentOrder] = useState<RiderOrderAssignmentModel | null>(null);
    const [otpSelection, setOtpSelection] = useState<TextSelection>({ start: 0, end: 0 });

    // ========================================================================
    // API CALLS
    // ========================================================================

    const fetchOrders = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const token = await StorageManager.getItem(StorageKey.TOKEN);

            const response = await ApiManager.get<RiderOrderAssignmentModel[]>({
                endpoint: constant.apiEndPoints.getOrders,
                token: token || undefined,
                showError: true,
            });

            if (__DEV__) {
                console.log('✅ Orders Response:', response);
            }

            const ordersData: RiderOrderAssignmentModel[] = (response?.data as RiderOrderAssignmentModel[]) || [];
            setOrders(ordersData);
        } catch (error: any) {
            console.error('❌ Fetch Orders Error:', error);
            setOrders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const updateOrderStatus = useCallback(async (order: RiderOrderAssignmentModel, newStatus: string) => {
        if (updatingOrderId === order.id) return;

        setUpdatingOrderId(order.id);
        try {
            const token = await StorageManager.getItem(StorageKey.TOKEN);

            const response = await ApiManager.post({
                endpoint: constant.apiEndPoints.updateStatus,
                params: {
                    order_id: order.order_id,
                    status: newStatus,
                },
                token: token || undefined,
                showError: true,
                showSuccess: true,
            });

            if (__DEV__) {
                console.log('✅ Status Update Response:', response);
            }

            Alert.alert('Success', ALERT_MESSAGES.STATUS_UPDATE_SUCCESS(newStatus));
            await fetchOrders(true);
        } catch (error: any) {
            console.error('❌ Update Status Error:', error);
            Alert.alert('Error', error.message || ALERT_MESSAGES.STATUS_UPDATE_FAILED);
        } finally {
            setUpdatingOrderId(null);
        }
    }, [updatingOrderId, fetchOrders]);

    const verifyOTP = useCallback(async () => {
        if (!currentOrder) return;

        if (!confirmationCode || confirmationCode.length !== OTP_LENGTH) {
            Alert.alert('Validation Error', ALERT_MESSAGES.OTP_VALIDATION);
            return;
        }

        setUpdatingOrderId(currentOrder.id);
        try {
            const token = await StorageManager.getItem(StorageKey.TOKEN);

            const response = await ApiManager.post({
                endpoint: constant.apiEndPoints.verifyOTP,
                params: {
                    order_id: currentOrder.order_id,
                    otp: confirmationCode,
                },
                token: token || undefined,
                showError: true,
                showSuccess: true,
            });

            if (__DEV__) {
                console.log('✅ OTP Verification Response:', response);
            }

            closeOTPModal();
            Alert.alert('Success', ALERT_MESSAGES.OTP_VERIFICATION_SUCCESS);
            await fetchOrders(true);
        } catch (error: any) {
            console.error('❌ OTP Verification Error:', error);
            Alert.alert('Error', error.message || ALERT_MESSAGES.OTP_VERIFICATION_FAILED);
        } finally {
            setUpdatingOrderId(null);
        }
    }, [currentOrder, confirmationCode, fetchOrders]);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    // ========================================================================
    // MODAL MANAGEMENT
    // ========================================================================

    const openOTPModal = useCallback((order: RiderOrderAssignmentModel) => {
        setCurrentOrder(order);
        setConfirmationCode('');
        setOtpSelection({ start: 0, end: 0 });
        setShowConfirmationModal(true);

        setTimeout(() => {
            otpInputRef.current?.focus();
        }, OTP_INPUT_FOCUS_DELAY);
    }, []);

    const closeOTPModal = useCallback(() => {
        setShowConfirmationModal(false);
        setConfirmationCode('');
        setCurrentOrder(null);
        setOtpSelection({ start: 0, end: 0 });
    }, []);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const onRefresh = useCallback(() => {
        fetchOrders(true);
    }, [fetchOrders]);

    const handleOrderAction = useCallback((order: RiderOrderAssignmentModel) => {
        const orderStatus = getOrderStatus(order);
        const statusInfo = getStatusInfo(orderStatus, colors.textLabel);

        if (!statusInfo.nextStatus) {
            Alert.alert('Info', ALERT_MESSAGES.ORDER_COMPLETED);
            return;
        }

        const orderNumber = formatOrderNumber(order);
        const { name: customerName } = getCustomerInfo(order);

        if (statusInfo.nextStatus === 'delivered') {
            openOTPModal(order);
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
    }, [colors.textLabel, updateOrderStatus, openOTPModal]);

    const handleCancelOrder = useCallback((order: RiderOrderAssignmentModel) => {
        const orderNumber = formatOrderNumber(order);
        const { name: customerName } = getCustomerInfo(order);
        const orderStatus = getOrderStatus(order);

        if (!canCancelOrder(orderStatus)) {
            Alert.alert('Info', ALERT_MESSAGES.ORDER_NOT_CANCELLABLE);
            return;
        }

        Alert.alert(
            'Cancel Order',
            `Are you sure you want to cancel order ${orderNumber}?\n\nCustomer: ${customerName}\n\nThis action cannot be undone.`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => updateOrderStatus(order, 'cancelled'),
                },
            ]
        );
    }, [updateOrderStatus]);

    const handleCallCustomer = useCallback((phone: string) => {
        if (!phone) {
            Alert.alert('Error', ALERT_MESSAGES.PHONE_NOT_AVAILABLE);
            return;
        }

        const phoneNumber = sanitizePhoneNumber(phone);
        const phoneUrl = `tel:${phoneNumber}`;

        Linking.canOpenURL(phoneUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(phoneUrl);
                } else {
                    Alert.alert('Error', ALERT_MESSAGES.PHONE_NOT_SUPPORTED);
                }
            })
            .catch((err) => {
                console.error('Error opening phone:', err);
                Alert.alert('Error', ALERT_MESSAGES.PHONE_DIALER_FAILED);
            });
    }, []);

    const handleOTPChange = useCallback((text: string) => {
        const numericText = text.replace(/[^0-9]/g, '');
        if (numericText.length <= OTP_LENGTH) {
            setConfirmationCode(numericText);
            const cursorPos = numericText.length;
            setOtpSelection({ start: cursorPos, end: cursorPos });
        }
    }, []);

    const handleOTPFocus = useCallback(() => {
        const cursorPos = confirmationCode.length === 0 ? 0 : confirmationCode.length;
        setOtpSelection({ start: cursorPos, end: cursorPos });
    }, [confirmationCode]);

    const handleOTPSelectionChange = useCallback((e: any) => {
        setOtpSelection(e.nativeEvent.selection);
    }, []);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const isVerifying = updatingOrderId === currentOrder?.id;
    const isOTPComplete = confirmationCode.length === OTP_LENGTH;

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
                {loading ? 'Loading orders...' : 'No pending orders'}
            </Text>
            {!loading && (
                <Text style={[styles.emptySubtext, { color: colors.textDescription }]}>
                    New orders will appear here
                </Text>
            )}
        </View>
    );

    const renderOrderHeader = (order: RiderOrderAssignmentModel, statusInfo: StatusInfo) => (
        <View style={styles.orderHeader}>
            <View>
                <Text style={[styles.orderNumber, { color: colors.themePrimary }]}>
                    {formatOrderNumber(order)}
                </Text>
                {order.created_at && (
                    <Text style={[styles.assignedTime, { color: colors.textLabel }]}>
                        Assigned: {new Date(order.created_at).toLocaleString()}
                    </Text>
                )}
                {order.eta && (
                    <Text style={[styles.assignedTime, { color: colors.textLabel }]}>
                        ETA: {order.eta}
                    </Text>
                )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                </Text>
            </View>
        </View>
    );

    const renderCustomerInfo = (order: RiderOrderAssignmentModel) => {
        const { name: customerName, phone: customerPhone } = getCustomerInfo(order);
        const address = formatAddress(order);

        return (
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
        );
    };

    const renderOrderDetails = (order: RiderOrderAssignmentModel) => {
        const amount = formatAmount(order);
        const itemsCount = formatItemsCount(order);

        return (
            <View style={[styles.detailsSection, { borderTopColor: colors.border }]}>
                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textLabel }]}>Items:</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                        {itemsCount}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textLabel }]}>Amount:</Text>
                    <Text style={[styles.amountText, { color: colors.themePrimary }]}>
                        ₹{amount}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textLabel }]}>Payment:</Text>
                    <View style={[styles.codBadge, { backgroundColor: '#ff9800' }]}>
                        <Text style={[styles.codText, { color: colors.white }]}>COD</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderActionButtons = (order: RiderOrderAssignmentModel, statusInfo: StatusInfo, isUpdating: boolean) => (
        <View style={styles.actionButtonsContainer}>
            {statusInfo.nextStatus && (
                <AppTouchableRipple
                    style={[
                        styles.actionButton,
                        {
                            backgroundColor: isUpdating ? colors.buttonDisabled : statusInfo.color,
                            flex: 1,
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

            {shouldShowCancelButton(statusInfo.label) && (
                <AppTouchableRipple
                    style={[
                        styles.cancelButton,
                        {
                            backgroundColor: isUpdating ? colors.buttonDisabled : colors.backgroundSecondary,
                            borderColor: colors.border,
                            marginLeft: statusInfo.nextStatus ? 12 : 0,
                        },
                    ]}
                    onPress={() => handleCancelOrder(order)}
                    disabled={isUpdating}
                >
                    <Icon name="close-circle" size={18} color={colors.textPrimary} />
                    <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>
                        Cancel
                    </Text>
                </AppTouchableRipple>
            )}
        </View>
    );

    const renderOrderCard = (order: RiderOrderAssignmentModel) => {
        const orderStatus = getOrderStatus(order);
        const statusInfo = getStatusInfo(orderStatus, colors.textLabel);
        const isUpdating = updatingOrderId === order.id;

        return (
            <View
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.backgroundSecondary }]}
            >
                {renderOrderHeader(order, statusInfo)}
                {renderCustomerInfo(order)}
                {renderOrderDetails(order)}
                {renderActionButtons(order, statusInfo, isUpdating)}
            </View>
        );
    };

    const renderOTPModal = () => (
        <Modal
            visible={showConfirmationModal}
            transparent
            animationType="fade"
            onRequestClose={closeOTPModal}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modernModalContent, { backgroundColor: colors.backgroundPrimary }]}>
                        {/* Close Button */}
                        <AppTouchableRipple
                            style={styles.modernCloseButton}
                            onPress={closeOTPModal}
                        >
                            <Icon name="close" size={24} color={colors.textLabel} />
                        </AppTouchableRipple>

                        {/* Icon Header */}
                        <View style={[styles.modalIconContainer, { backgroundColor: colors.themePrimaryLight }]}>
                            <Icon name="shield-lock-outline" size={48} color={colors.themePrimary} />
                        </View>

                        {/* Title */}
                        <Text style={[styles.modernModalTitle, { color: colors.textPrimary }]}>
                            Verify Delivery
                        </Text>

                        {/* Subtitle */}
                        <Text style={[styles.modernModalSubtitle, { color: colors.textDescription }]}>
                            Enter the {OTP_LENGTH}-digit OTP code from the customer
                        </Text>

                        {/* OTP Input */}
                        <View style={styles.otpInputContainer}>
                            <TextInput
                                ref={otpInputRef}
                                style={[
                                    styles.modernOtpInput,
                                    {
                                        borderColor: isOTPComplete ? colors.themePrimary : colors.border,
                                        color: colors.textPrimary,
                                        backgroundColor: colors.backgroundSecondary,
                                    },
                                ]}
                                value={confirmationCode}
                                onChangeText={handleOTPChange}
                                placeholder="••••"
                                placeholderTextColor={colors.textLabel}
                                keyboardType="number-pad"
                                maxLength={OTP_LENGTH}
                                autoFocus={false}
                                editable={!isVerifying}
                                textAlign="center"
                                selection={otpSelection}
                                onSelectionChange={handleOTPSelectionChange}
                                onFocus={handleOTPFocus}
                            />
                        </View>

                        {/* Action Button */}
                        <View style={styles.modernModalActions}>
                            <AppTouchableRipple
                                style={[
                                    styles.modernVerifyButton,
                                    {
                                        backgroundColor: isVerifying || !isOTPComplete
                                            ? colors.buttonDisabled
                                            : colors.themePrimary,
                                    },
                                ]}
                                onPress={verifyOTP}
                                disabled={isVerifying || !isOTPComplete}
                            >
                                {isVerifying ? (
                                    <Text style={[styles.modernButtonText, { color: colors.white }]}>
                                        Verifying...
                                    </Text>
                                ) : (
                                    <>
                                        <Icon name="check-circle" size={20} color={colors.white} />
                                        <Text style={[styles.modernButtonText, { color: colors.white }]}>
                                            Verify & Complete
                                        </Text>
                                    </>
                                )}
                            </AppTouchableRipple>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    // ========================================================================
    // MAIN RENDER
    // ========================================================================

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
                    <Text style={[styles.headerTitle, { color: colors.white }]}>My Orders</Text>
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
                    {loading && orders.length === 0
                        ? renderEmptyState()
                        : orders.length === 0
                            ? renderEmptyState()
                            : orders.map(renderOrderCard)
                    }
                </ScrollView>
            </View>

            {/* OTP Modal */}
            {renderOTPModal()}
        </MainContainer>
    );
};

export default RiderOrdersScreen;

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
    actionButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        flex: 1,
    },
    actionButtonText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
    },
    cancelButton: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        gap: 6,
    },
    cancelButtonText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryMedium,
    },

    // Modern Modal Styles
    modalOverlay: {
        flex: 1,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modernModalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    modernCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    modalIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    modernModalTitle: {
        fontSize: fonts.size.font24,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 12,
        textAlign: 'center',
    },
    modernModalSubtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    otpInputContainer: {
        width: '100%',
        marginBottom: 32,
    },
    modernOtpInput: {
        borderWidth: 2,
        borderRadius: 16,
        padding: 20,
        fontSize: fonts.size.font30,
        fontFamily: fonts.family.primaryBold,
        letterSpacing: 16,
        textAlign: 'center',
    },
    modernModalActions: {
        width: '100%',
    },
    modernVerifyButton: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    modernButtonText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
});