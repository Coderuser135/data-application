import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { measurementService } from '@/services/measurementService';

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const fetchMyMeasurements = createAsyncThunk('measurements/fetchMyMeasurements', async (_, { rejectWithValue }) => {
  try { return await measurementService.getMine(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch measurements')); }
});

export const fetchAllMeasurements = createAsyncThunk('measurements/fetchAll', async (_, { rejectWithValue }) => {
  try { return await measurementService.getAll(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch measurements')); }
});

export const fetchMeasurementsByUser = createAsyncThunk('measurements/fetchByUser', async (userId, { rejectWithValue }) => {
  try { return await measurementService.getByUser(userId); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch measurements')); }
});

export const createMeasurement = createAsyncThunk('measurements/create', async (data, { rejectWithValue }) => {
  try { return await measurementService.create(data); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to create measurement')); }
});

export const fetchAdmittedMembers = createAsyncThunk('measurements/fetchMembers', async (_, { rejectWithValue }) => {
  try { return await measurementService.getMembers(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch members')); }
});

const measurementSlice = createSlice({
  name: 'measurements',
  initialState: { items: [], adminItems: [], memberItems: [], members: [], selectedUserMeasurements: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyMeasurements.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyMeasurements.fulfilled, (state, action) => { state.items = action.payload; state.loading = false; })
      .addCase(fetchMyMeasurements.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAllMeasurements.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllMeasurements.fulfilled, (state, action) => { state.adminItems = action.payload; state.loading = false; })
      .addCase(fetchAllMeasurements.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMeasurementsByUser.fulfilled, (state, action) => { state.selectedUserMeasurements = action.payload; })
      .addCase(createMeasurement.fulfilled, (state, action) => { state.adminItems.unshift(action.payload); })
      .addCase(fetchAdmittedMembers.fulfilled, (state, action) => { state.members = action.payload; });
  },
});

export default measurementSlice.reducer;
