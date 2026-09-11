import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { membershipService } from '@/services/membershipService';

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const fetchMyMemberships = createAsyncThunk('memberships/fetchMyMemberships', async (_, { rejectWithValue }) => {
  try { return await membershipService.getMine(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch memberships')); }
});

export const fetchActivePlans = createAsyncThunk('memberships/fetchActivePlans', async (_, { rejectWithValue }) => {
  try { return await membershipService.getActivePlans(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch plans')); }
});

export const purchaseMembership = createAsyncThunk('memberships/purchase', async (planId, { rejectWithValue }) => {
  try { return await membershipService.purchase(planId); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to purchase membership')); }
});

export const renewMembership = createAsyncThunk('memberships/renew', async (id, { rejectWithValue }) => {
  try { return await membershipService.renew(id); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to renew membership')); }
});

const membershipSlice = createSlice({
  name: 'memberships',
  initialState: { items: [], plans: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyMemberships.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyMemberships.fulfilled, (state, action) => { state.items = action.payload; state.loading = false; })
      .addCase(fetchMyMemberships.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchActivePlans.fulfilled, (state, action) => { state.plans = action.payload; })
      .addCase(purchaseMembership.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(renewMembership.fulfilled, (state, action) => { state.items.unshift(action.payload); });
  },
});

export default membershipSlice.reducer;
