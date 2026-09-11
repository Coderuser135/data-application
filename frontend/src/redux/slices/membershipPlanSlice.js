import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { membershipPlanService } from '@/services/membershipPlanService';

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const fetchMembershipPlans = createAsyncThunk('membershipPlans/fetchAll', async (_, { rejectWithValue }) => {
  try { return await membershipPlanService.getAll(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch membership plans')); }
});

export const createMembershipPlan = createAsyncThunk('membershipPlans/create', async (data, { rejectWithValue }) => {
  try { return await membershipPlanService.create(data); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to create plan')); }
});

export const updateMembershipPlan = createAsyncThunk('membershipPlans/update', async ({ id, data }, { rejectWithValue }) => {
  try { return await membershipPlanService.update(id, data); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to update plan')); }
});

export const deleteMembershipPlan = createAsyncThunk('membershipPlans/delete', async (id, { rejectWithValue }) => {
  try { return await membershipPlanService.delete(id); return id; } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to delete plan')); }
});

const membershipPlanSlice = createSlice({
  name: 'membershipPlans',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembershipPlans.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMembershipPlans.fulfilled, (state, action) => { state.items = action.payload; state.loading = false; })
      .addCase(fetchMembershipPlans.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createMembershipPlan.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateMembershipPlan.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteMembershipPlan.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export default membershipPlanSlice.reducer;
