import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import SplashScreen from '@/components/public/SplashScreen';
import PublicLayout from '@/layouts/PublicLayout';
import UserLayout from '@/layouts/UserLayout';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import AdminRoute from '@/routes/AdminRoute';

import Home from '@/pages/public/Home';
import About from '@/pages/public/About';
import Membership from '@/pages/public/Membership';
import Contact from '@/pages/public/Contact';
import Store from '@/pages/public/Store';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

import Dashboard from '@/pages/user/Dashboard';
import Profile from '@/pages/user/Profile';
import MyGym from '@/pages/user/MyGym';
import MembershipPage from '@/pages/user/Membership';
import Payments from '@/pages/user/Payments';
import BodyProgress from '@/pages/user/BodyProgress';
import UserStore from '@/pages/user/Store';
import Cart from '@/pages/user/Cart';
import Checkout from '@/pages/user/Checkout';
import Orders from '@/pages/user/Orders';
import Notifications from '@/pages/user/Notifications';
import Settings from '@/pages/user/Settings';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminAdmissions from '@/pages/admin/AdminAdmissions';
import AdminMembershipPlans from '@/pages/admin/AdminMembershipPlans';
import AdminMemberships from '@/pages/admin/AdminMemberships';
import AdminPayments from '@/pages/admin/AdminPayments';
import AdminBodyMeasurements from '@/pages/admin/AdminBodyMeasurements';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminSettings from '@/pages/admin/AdminSettings';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  useAuth();

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/store" element={<Store />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/user" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/user/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="gym" element={<MyGym />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="payments" element={<Payments />} />
          <Route path="body-progress" element={<BodyProgress />} />
          <Route path="store" element={<UserStore />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="admissions" element={<AdminAdmissions />} />
          <Route path="membership-plans" element={<AdminMembershipPlans />} />
          <Route path="memberships" element={<AdminMemberships />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="body-measurements" element={<AdminBodyMeasurements />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
