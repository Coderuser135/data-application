import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { admissionService } from '@/services/admissionService';

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const fetchMyAdmission = createAsyncThunk('admissions/fetchMyAdmission', async (_, { rejectWithValue }) => {
  try { return await admissionService.getMine(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch admission')); }
});

export const fetchAllAdmissions = createAsyncThunk('admissions/fetchAll', async (_, { rejectWithValue }) => {
  try { return await admissionService.getAll(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch admissions')); }
});

export const searchUsers = createAsyncThunk('admissions/searchUsers', async ({ q, page, limit }, { rejectWithValue }) => {
  try { return await admissionService.searchUsers(q, page, limit); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to search users')); }
});

export const createAdmission = createAsyncThunk('admissions/create', async (data, { rejectWithValue }) => {
  try { return await admissionService.create(data); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to create admission')); }
});

const admissionSlice = createSlice({
  name: 'admissions',
  initialState: { admission: null, adminAdmissions: [], searchResults: { rows: [], total: 0, page: 1, pages: 1 }, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAdmission.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyAdmission.fulfilled, (state, action) => { state.admission = action.payload; state.loading = false; })
      .addCase(fetchMyAdmission.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAllAdmissions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllAdmissions.fulfilled, (state, action) => { state.adminAdmissions = action.payload; state.loading = false; })
      .addCase(fetchAllAdmissions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(searchUsers.fulfilled, (state, action) => { state.searchResults = action.payload; })
      .addCase(createAdmission.fulfilled, (state, action) => { state.adminAdmissions.unshift(action.payload.admission); });
  },
});

export default admissionSlice.reducer;
