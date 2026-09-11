import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async (_, { rejectWithValue }) => {
  try { return await authService.me(); } catch (error) { return rejectWithValue(errorMessage(error, 'Not authenticated')); }
});

export const signIn = createAsyncThunk('auth/signIn', async (credentials, { rejectWithValue }) => {
  try { return await authService.login(credentials); } catch (error) { return rejectWithValue(errorMessage(error, 'Login failed')); }
});

export const signUp = createAsyncThunk('auth/signUp', async (data, { rejectWithValue }) => {
  try { return await authService.register(data); } catch (error) { return rejectWithValue(errorMessage(error, 'Registration failed')); }
});

export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try { return await authService.logout(); } catch (error) { return rejectWithValue(errorMessage(error, 'Logout failed')); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, profile: null, loading: false, error: null, initializing: true, isAuthenticated: false },
  reducers: {
    clearAuth: (state) => { state.user = null; state.profile = null; state.isAuthenticated = false; state.initializing = false; state.loading = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCurrentUser.pending, (state) => { state.initializing = true; })
      .addCase(getCurrentUser.fulfilled, (state, action) => { state.user = action.payload; state.profile = action.payload; state.isAuthenticated = true; state.initializing = false; })
      .addCase(getCurrentUser.rejected, (state) => { state.user = null; state.profile = null; state.isAuthenticated = false; state.initializing = false; })
      .addCase(signIn.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(signIn.fulfilled, (state, action) => { state.user = action.payload.user; state.profile = action.payload.user; state.isAuthenticated = true; state.loading = false; })
      .addCase(signIn.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(signUp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(signUp.fulfilled, (state, action) => { state.user = action.payload.user; state.profile = action.payload.user; state.isAuthenticated = true; state.loading = false; })
      .addCase(signUp.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(signOut.fulfilled, (state) => { state.user = null; state.profile = null; state.isAuthenticated = false; state.loading = false; })
      .addCase(signOut.rejected, (state) => { state.user = null; state.profile = null; state.isAuthenticated = false; state.loading = false; });
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
