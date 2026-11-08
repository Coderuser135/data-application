import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { orderService } from '@/services/orderService';

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const fetchMyOrders = createAsyncThunk('orders/fetchMyOrders', async (_, { rejectWithValue }) => {
  try { return await orderService.getMine(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch orders')); }
});

export const fetchAllOrders = createAsyncThunk('orders/fetchAll', async (params, { rejectWithValue }) => {
  try { return await orderService.getAll(params); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch orders')); }
});

export const createOrder = createAsyncThunk('orders/createOrder', async (orderData, { rejectWithValue }) => {
  try { return await orderService.create(orderData); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to create order')); }
});

export const updateOrderStatus = createAsyncThunk('orders/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try { return await orderService.updateStatus(id, status); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to update order')); }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: { items: [], adminItems: [], adminPagination: { total: 0, page: 1, pages: 1, limit: 10 }, loading: false, error: null, lastCreated: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => { state.items = action.payload; state.loading = false; })
      .addCase(fetchMyOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAllOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllOrders.fulfilled, (state, action) => { state.adminItems = action.payload.rows || []; state.adminPagination = { total: action.payload.total || 0, page: action.payload.page || 1, pages: action.payload.pages || 1, limit: action.payload.limit || 10 }; state.loading = false; })
      .addCase(fetchAllOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createOrder.fulfilled, (state, action) => { state.lastCreated = action.payload; state.items.unshift(action.payload); })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.adminItems.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) state.adminItems[idx] = action.payload;
      });
  },
});

export default orderSlice.reducer;
