import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardService } from '@/services/dashboardService';

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const fetchUserDashboard = createAsyncThunk('dashboard/fetchUserDashboard', async (_, { rejectWithValue }) => {
  try { return await dashboardService.getUserDashboard(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to load dashboard')); }
});

export const fetchAdminStats = createAsyncThunk('dashboard/fetchAdminStats', async (_, { rejectWithValue }) => {
  try { return await dashboardService.getAdminStats(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to load admin stats')); }
});

export const fetchRevenueAnalytics = createAsyncThunk('dashboard/fetchRevenueAnalytics', async (period, { rejectWithValue }) => {
  try { return await dashboardService.getRevenueAnalytics(period); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to load analytics')); }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { userData: null, adminStats: null, analytics: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDashboard.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUserDashboard.fulfilled, (state, action) => { state.userData = action.payload; state.loading = false; })
      .addCase(fetchUserDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAdminStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAdminStats.fulfilled, (state, action) => { state.adminStats = action.payload; state.loading = false; })
      .addCase(fetchAdminStats.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; });
  },
});

export default dashboardSlice.reducer;
