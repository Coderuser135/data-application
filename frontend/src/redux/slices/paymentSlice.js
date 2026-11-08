import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { paymentService } from '@/services/paymentService';

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const fetchMyPayments = createAsyncThunk('payments/fetchMyPayments', async (_, { rejectWithValue }) => {
  try { return await paymentService.getMine(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch payments')); }
});

export const fetchAllPayments = createAsyncThunk('payments/fetchAll', async (params, { rejectWithValue }) => {
  try { return await paymentService.getAll(params); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch payments')); }
});

export const createRazorpayOrder = createAsyncThunk('payments/createRazorpayOrder', async (data, { rejectWithValue }) => {
  try { return await paymentService.createRazorpayOrder(data); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to create payment order')); }
});

export const verifyRazorpayPayment = createAsyncThunk('payments/verifyRazorpayPayment', async (data, { rejectWithValue }) => {
  try { return await paymentService.verifyRazorpayPayment(data); } catch (error) { return rejectWithValue(errorMessage(error, 'Payment verification failed')); }
});

export const confirmReconciliationRefund = createAsyncThunk('payments/confirmReconciliationRefund', async ({ paymentId, refundId }, { rejectWithValue }) => {
  try { return await paymentService.confirmReconciliationRefund(paymentId, { refundId }); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to verify refund')); }
});

const paymentSlice = createSlice({
  name: 'payments',
  initialState: { items: [], adminItems: [], adminPagination: null, adminSummary: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPayments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyPayments.fulfilled, (state, action) => { state.items = action.payload; state.loading = false; })
      .addCase(fetchMyPayments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAllPayments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllPayments.fulfilled, (state, action) => { state.adminItems = action.payload.items || []; state.adminPagination = action.payload.pagination || null; state.adminSummary = action.payload.summary || null; state.loading = false; })
      .addCase(fetchAllPayments.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export default paymentSlice.reducer;
