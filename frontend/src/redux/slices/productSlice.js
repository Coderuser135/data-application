import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { productService, categoryService } from '@/services/productService';

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const fetchProducts = createAsyncThunk('products/fetchProducts', async (_, { rejectWithValue }) => {
  try { return await productService.getAll(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch products')); }
});

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try { return await categoryService.getAll(); } catch (error) { return rejectWithValue(errorMessage(error, 'Failed to fetch categories')); }
});

const productSlice = createSlice({
  name: 'products',
  initialState: { items: [], categories: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.items = action.payload; state.loading = false; })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.categories = action.payload; });
  },
});

export default productSlice.reducer;
