import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

const RiderHomeScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();
    const [riderName, setRiderName] = useState<string>('Rider');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadRiderData();
    }, []);

    const loadRiderData = async () => {
        try {
            const riderData = await StorageManager.getItem(constant.shareInstanceKey.userData);
            if (riderData && typeof riderData === 'object' && 'name' in riderData) {
                setRiderName(riderData.name || 'Rider');
            }
        } catch (error) {
            console.error('Error loading rider data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // TODO: Refresh orders from API when ready
        await loadRiderData();
        setTimeout(() => setRefreshing(false), 1000);
    };

    const todayStats = [
        { label: 'Deliveries', value: '8', icon: '📦', color: '#4caf50' },
        { label: 'Pending', value: '3', icon: '⏳', color: '#ff9800' },
        { label: 'Earnings', value: '₹420', icon: '💰', color: '#2196f3' },
    ];

    const quickActions = [
        { id: 1, title: 'Pending Orders', icon: '📋', color: '#ff9800', count: 3 },
        { id: 2, title: 'Completed', icon: '✅', color: '#4caf50', count: 8 },
        { id: 3, title: 'My Profile', icon: '👤', color: '#2196f3' },
        { id: 4, title: 'Support', icon: '📞', color: '#9c27b0' },
    ];

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
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.white }]}>
                            Hello,
                        </Text>
                        <Text style={[styles.riderName, { color: colors.white }]}>
                            {riderName}! 🚴
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#4caf50' }]}>
                        <Text style={[styles.statusText, { color: colors.white }]}>
                            ● Online
                        </Text>
                    </View>
                </View>

                {/* Today's Stats */}
                <View style={styles.statsContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Today's Summary
                    </Text>
                    <View style={styles.statsGrid}>
                        {todayStats.map((stat, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.statCard,
                                    { backgroundColor: colors.backgroundSecondary },
                                ]}
                            >
                                <Text style={styles.statIcon}>{stat.icon}</Text>
                                <Text
                                    style={[
                                        styles.statValue,
                                        { color: stat.color },
                                    ]}
                                >
                                    {stat.value}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textDescription }]}>
                                    {stat.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Quick Actions
                    </Text>
                    <View style={styles.actionsGrid}>
                        {quickActions.map((action) => (
                            <AppTouchableRipple
                                key={action.id}
                                style={[
                                    styles.actionCard,
                                    { backgroundColor: colors.backgroundSecondary },
                                ]}
                                onPress={() => console.log('Action:', action.title)}
                            >
                                <View>
                                    <Text style={styles.actionIcon}>{action.icon}</Text>
                                    {action.count && (
                                        <View
                                            style={[
                                                styles.actionBadge,
                                                { backgroundColor: action.color },
                                            ]}
                                        >
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
                        ))}
                    </View>
                </View>

                {/* Important Notice */}
                <View style={[styles.noticeBox, { backgroundColor: colors.themePrimaryLight }]}>
                    <Text style={styles.noticeIcon}>ℹ️</Text>
                    <View style={styles.noticeContent}>
                        <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>
                            Payment Mode
                        </Text>
                        <Text style={[styles.noticeText, { color: colors.textDescription }]}>
                            Currently, only Cash on Delivery (COD) is available for all orders
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </MainContainer>
    );
};

export default RiderHomeScreen;

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