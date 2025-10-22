// GOF Rider App Constants

const constant = {
    // Route Names
    routeName: {
        // Auth Routes
        Login: 'Login',

        // Main Routes
        home: 'Home',
        orders: 'Orders',
        history: 'History',
        profile: 'Profile',

        // Detail Routes
        orderDetail: 'OrderDetail',
        editProfile: 'EditProfile',
        changePassword: 'ChangePassword',
        earnings: 'Earnings',
        stats: 'Stats',
        support: 'Support',
        about: 'About',
    },

    // API Endpoints (Update base URL in ApiManager.ts)
    apiEndPoints: {
        // Auth
        riderLogin: 'api/delivery/login',
        riderLogout: 'api/delivery/logout',

        // Orders
        getAssignedOrders: 'api/rider/orders/assigned',
        getOrderDetails: 'api/rider/orders/detail',
        acceptOrder: 'api/rider/orders/accept',
        pickupOrder: 'api/rider/orders/pickup',
        startDelivery: 'api/rider/orders/start-delivery',
        completeDelivery: 'api/rider/orders/complete',
        verifyConfirmationCode: 'api/rider/orders/verify-code',

        // History
        getDeliveryHistory: 'api/rider/history',
        getTodayHistory: 'api/rider/history/today',
        getWeekHistory: 'api/rider/history/week',
        getMonthHistory: 'api/rider/history/month',

        // Profile
        getRiderProfile: 'api/rider/profile',
        updateProfile: 'api/rider/profile/update',
        changePassword: 'api/rider/change-password',

        // Earnings
        getEarnings: 'api/rider/earnings',
        getEarningsReport: 'api/rider/earnings/report',

        // Stats
        getStats: 'api/rider/stats',
        getTodayStats: 'api/rider/stats/today',
    },

    // Storage Keys (using same structure as admin app)
    shareInstanceKey: {
        authToken: 'auth_token' as const,
        userData: 'user_detail' as const,
        baseUrl: 'base_url' as const,
        loggedInUser: 'loggedInUser' as const,
    },

    // Order Status
    orderStatus: {
        ASSIGNED: 'assigned',
        ACCEPTED: 'accepted',
        PICKED: 'picked',
        DELIVERING: 'delivering',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled',
    },

    // Payment Modes
    paymentMode: {
        COD: 'COD',
        // Online payments will be added later
    },

    // Validation Rules
    validation: {
        minPasswordLength: 6,
        minUsernameLength: 3,
        confirmationCodeLength: 4,
    },

    // App Settings
    settings: {
        defaultTimeout: 30000, // 30 seconds
        refreshInterval: 60000, // 1 minute
        locationUpdateInterval: 10000, // 10 seconds (for future tracking)
    },

    // Messages
    messages: {
        noInternet: 'No internet connection. Please check your network.',
        loginSuccess: 'Login successful!',
        loginFailed: 'Invalid credentials. Please try again.',
        logoutSuccess: 'Logged out successfully!',
        orderAccepted: 'Order accepted successfully!',
        orderPickedUp: 'Order picked up successfully!',
        deliveryStarted: 'Delivery started!',
        deliveryCompleted: 'Delivery completed successfully!',
        invalidCode: 'Invalid confirmation code. Please try again.',
        updateSuccess: 'Updated successfully!',
        updateFailed: 'Update failed. Please try again.',
    },
};

export default constant;