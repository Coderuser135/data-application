import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import themeReducer from './slices/themeSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import membershipReducer from './slices/membershipSlice';
import membershipPlanReducer from './slices/membershipPlanSlice';
import paymentReducer from './slices/paymentSlice';
import dashboardReducer from './slices/dashboardSlice';
import notificationReducer from './slices/notificationSlice';
import measurementReducer from './slices/measurementSlice';
import admissionReducer from './slices/admissionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    theme: themeReducer,
    products: productReducer,
    orders: orderReducer,
    memberships: membershipReducer,
    membershipPlans: membershipPlanReducer,
    payments: paymentReducer,
    dashboard: dashboardReducer,
    notifications: notificationReducer,
    measurements: measurementReducer,
    admissions: admissionReducer,
  },
});
